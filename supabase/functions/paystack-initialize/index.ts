import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const paystackSecretKey = Deno.env.get('PAYSTACK_SECRET_KEY');
    if (!paystackSecretKey) {
      console.error('PAYSTACK_SECRET_KEY not configured');
      throw new Error('Payment service not configured');
    }

    const { bookingId, email, amount } = await req.json();
    
    console.log('Initializing payment for booking:', bookingId, 'amount:', amount);

    if (!bookingId || !email || !amount) {
      throw new Error('Missing required fields: bookingId, email, or amount');
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
        },
      }),
    });

    const paystackData = await paystackResponse.json();
    console.log('Paystack response:', paystackData);

    if (!paystackData.status) {
      throw new Error(paystackData.message || 'Failed to initialize payment');
    }

    // Update booking with payment reference
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { error: updateError } = await supabase
      .from('bookings')
      .update({ payment_reference: paystackData.data.reference })
      .eq('id', bookingId);

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
