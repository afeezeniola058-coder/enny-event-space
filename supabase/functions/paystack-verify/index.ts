import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getCorsHeaders } from "../_shared/cors.ts";

// Rate limiting: max 10 payment verifications per user per 15 minutes
const RATE_LIMIT_REQUESTS = 10;
const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000;
const kv = await Deno.openKv();

async function checkRateLimit(userId: string): Promise<{ allowed: boolean; remaining: number; resetAt: number }> {
  const key = ["rate_limit", "paystack_verify", userId];
  const now = Date.now();
  const entry = await kv.get<{ count: number; windowStart: number }>(key);

  if (!entry.value || now - entry.value.windowStart > RATE_LIMIT_WINDOW_MS) {
    await kv.set(key, { count: 1, windowStart: now }, { expireIn: RATE_LIMIT_WINDOW_MS });
    return { allowed: true, remaining: RATE_LIMIT_REQUESTS - 1, resetAt: now + RATE_LIMIT_WINDOW_MS };
  }

  if (entry.value.count >= RATE_LIMIT_REQUESTS) {
    return { allowed: false, remaining: 0, resetAt: entry.value.windowStart + RATE_LIMIT_WINDOW_MS };
  }

  const newCount = entry.value.count + 1;
  await kv.set(key, { count: newCount, windowStart: entry.value.windowStart }, {
    expireIn: RATE_LIMIT_WINDOW_MS - (now - entry.value.windowStart)
  });
  return { allowed: true, remaining: RATE_LIMIT_REQUESTS - newCount, resetAt: entry.value.windowStart + RATE_LIMIT_WINDOW_MS };
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
    const rateLimit = await checkRateLimit(user.id);
    if (!rateLimit.allowed) {
      const retryAfter = Math.ceil((rateLimit.resetAt - Date.now()) / 1000);
      return new Response(
        JSON.stringify({ error: 'Too many verification requests. Please try again later.' }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json', 'Retry-After': String(retryAfter) } }
      );
    }

    const { reference } = await req.json();
    
    console.log('Verifying payment for reference:', reference, 'user:', user.id);

    if (!reference) {
      throw new Error('Payment reference is required');
    }

    // Verify transaction with Paystack
    const paystackResponse = await fetch(`https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${paystackSecretKey}`,
      },
    });

    const paystackData = await paystackResponse.json();
    console.log('Paystack verification response:', paystackData);

    if (!paystackData.status) {
      throw new Error(paystackData.message || 'Failed to verify payment');
    }

    const bookingId = paystackData.data.metadata?.booking_id;
    const paymentUserId = paystackData.data.metadata?.user_id;

    // Verify the authenticated user owns this payment/booking
    if (paymentUserId && paymentUserId !== user.id) {
      console.error('User does not own this payment');
      return new Response(
        JSON.stringify({ error: 'Forbidden' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Also verify via booking ownership
    if (bookingId) {
      const { data: booking, error: bookingError } = await supabaseAuth
        .from('bookings')
        .select('user_id')
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
    }

    // Use service role to update booking status (after ownership verified)
    const supabaseService = createClient(supabaseUrl, supabaseServiceKey);

    // Update booking status based on payment status
    if (paystackData.data.status === 'success') {
      if (bookingId) {
        const { error: updateError } = await supabaseService
          .from('bookings')
          .update({
            payment_status: 'paid',
            status: 'confirmed',
            payment_reference: reference,
          })
          .eq('id', bookingId)
          .eq('user_id', user.id); // Double-check ownership in update

        if (updateError) {
          console.error('Failed to update booking status:', updateError);
          throw new Error('Failed to update booking status');
        }

        console.log('Booking updated successfully:', bookingId);

        // Send email notification for confirmed booking
        try {
          const notificationResponse = await fetch(`${supabaseUrl}/functions/v1/send-booking-notification`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${supabaseServiceKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              booking_id: bookingId,
              new_status: 'confirmed',
            }),
          });

          const notificationResult = await notificationResponse.json();
          console.log('Email notification result:', notificationResult);
        } catch (notifError) {
          console.error('Failed to send email notification:', notifError);
          // Don't fail the payment verification if email fails
        }
      }

      return new Response(
        JSON.stringify({
          success: true,
          message: 'Payment verified successfully',
          booking_id: bookingId,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    } else {
      return new Response(
        JSON.stringify({
          success: false,
          message: 'Payment was not successful',
          status: paystackData.data.status,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
  } catch (error) {
    console.error('Payment verification error:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
