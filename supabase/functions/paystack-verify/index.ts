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

    const { reference } = await req.json();
    
    console.log('Verifying payment for reference:', reference);

    if (!reference) {
      throw new Error('Payment reference is required');
    }

    // Verify transaction with Paystack
    const paystackResponse = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
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

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Update booking status based on payment status
    if (paystackData.data.status === 'success') {
      const bookingId = paystackData.data.metadata?.booking_id;
      
      if (bookingId) {
        const { error: updateError } = await supabase
          .from('bookings')
          .update({
            payment_status: 'completed',
            status: 'confirmed',
          })
          .eq('id', bookingId);

        if (updateError) {
          console.error('Failed to update booking status:', updateError);
          throw new Error('Failed to update booking status');
        }

        console.log('Booking updated successfully:', bookingId);
      }

      return new Response(
        JSON.stringify({
          success: true,
          message: 'Payment verified successfully',
          booking_id: paystackData.data.metadata?.booking_id,
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
