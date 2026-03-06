import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getCorsHeaders } from "../_shared/cors.ts";

// In-memory rate limiting: max 5 payment initializations per user per 15 minutes
const RATE_LIMIT_REQUESTS = 5;
const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000;
const rateLimitMap = new Map<string, { count: number; windowStart: number }>();

function checkRateLimit(userId: string): { allowed: boolean; remaining: number; resetAt: number } {
  const now = Date.now();
  const entry = rateLimitMap.get(userId);

  if (!entry || now - entry.windowStart > RATE_LIMIT_WINDOW_MS) {
    rateLimitMap.set(userId, { count: 1, windowStart: now });
    return { allowed: true, remaining: RATE_LIMIT_REQUESTS - 1, resetAt: now + RATE_LIMIT_WINDOW_MS };
  }

  if (entry.count >= RATE_LIMIT_REQUESTS) {
    return { allowed: false, remaining: 0, resetAt: entry.windowStart + RATE_LIMIT_WINDOW_MS };
  }

  entry.count++;
  return { allowed: true, remaining: RATE_LIMIT_REQUESTS - entry.count, resetAt: entry.windowStart + RATE_LIMIT_WINDOW_MS };
}

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const paystackSecretKey = Deno.env.get('paystack_secret_code');
    if (!paystackSecretKey) {
      console.error('paystack_secret_code not configured');
      throw new Error('Payment service not configured');
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    // Authenticate the user
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.error('No authorization header provided');
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create client with user's auth token to verify identity
    const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });

    const { data: { user }, error: authError } = await supabaseAuth.auth.getUser();
    if (authError || !user) {
      console.error('Auth error:', authError);
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check rate limit
    const rateLimit = checkRateLimit(user.id);
    if (!rateLimit.allowed) {
      const retryAfter = Math.ceil((rateLimit.resetAt - Date.now()) / 1000);
      return new Response(
        JSON.stringify({ error: 'Too many payment requests. Please try again later.' }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json', 'Retry-After': String(retryAfter) } }
      );
    }

    const { bookingId, email, amount } = await req.json();
    
    console.log('Initializing payment for booking:', bookingId, 'amount:', amount, 'user:', user.id);

    if (!bookingId || !email || !amount) {
      throw new Error('Missing required fields: bookingId, email, or amount');
    }

    // Verify user owns the booking and amount matches
    const { data: booking, error: bookingError } = await supabaseAuth
      .from('bookings')
      .select('user_id, total_amount')
      .eq('id', bookingId)
      .single();

    if (bookingError || !booking) {
      console.error('Booking not found:', bookingError);
      return new Response(
        JSON.stringify({ error: 'Booking not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (booking.user_id !== user.id) {
      console.error('User does not own this booking');
      return new Response(
        JSON.stringify({ error: 'Forbidden' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify amount matches booking total
    if (Math.abs(Number(booking.total_amount) - amount) > 0.01) {
      console.error('Amount mismatch:', booking.total_amount, 'vs', amount);
      return new Response(
        JSON.stringify({ error: 'Amount mismatch' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Initialize Paystack transaction
    const paystackResponse = await fetch('https://api.paystack.co/transaction/initialize', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${paystackSecretKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email,
        amount: Math.round(amount * 100), // Paystack expects amount in kobo
        callback_url: `${req.headers.get('origin')}/dashboard?payment=success`,
        metadata: {
          booking_id: bookingId,
          user_id: user.id,
        },
      }),
    });

    const paystackData = await paystackResponse.json();
    console.log('Paystack response:', paystackData);

    if (!paystackData.status) {
      throw new Error(paystackData.message || 'Failed to initialize payment');
    }

    // Use service role to update payment reference (after ownership verified)
    const supabaseService = createClient(supabaseUrl, supabaseServiceKey);

    const { error: updateError } = await supabaseService
      .from('bookings')
      .update({ payment_reference: paystackData.data.reference })
      .eq('id', bookingId)
      .eq('user_id', user.id); // Double-check ownership in update

    if (updateError) {
      console.error('Failed to update booking with payment reference:', updateError);
    }

    return new Response(
      JSON.stringify({
        authorization_url: paystackData.data.authorization_url,
        reference: paystackData.data.reference,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Payment initialization error:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
