import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// 1x1 transparent GIF
const TRACKING_PIXEL = new Uint8Array([
  0x47, 0x49, 0x46, 0x38, 0x39, 0x61, 0x01, 0x00, 0x01, 0x00, 0x80, 0x00,
  0x00, 0xff, 0xff, 0xff, 0x00, 0x00, 0x00, 0x21, 0xf9, 0x04, 0x01, 0x00,
  0x00, 0x00, 0x00, 0x2c, 0x00, 0x00, 0x00, 0x00, 0x01, 0x00, 0x01, 0x00,
  0x00, 0x02, 0x02, 0x44, 0x01, 0x00, 0x3b
]);

const handler = async (req: Request): Promise<Response> => {
  console.log("email-tracking function called");

  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const url = new URL(req.url);
  const bookingId = url.searchParams.get("bid");
  const eventType = url.searchParams.get("type"); // "open" or "click"
  const redirectUrl = url.searchParams.get("url");
  const email = url.searchParams.get("email");

  if (!bookingId || !eventType || !email) {
    console.error("Missing required parameters");
    return new Response("Missing parameters", { status: 400 });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(supabaseUrl, supabaseServiceKey);

  const userAgent = req.headers.get("user-agent") || null;
  const forwardedFor = req.headers.get("x-forwarded-for");
  const ipAddress = forwardedFor?.split(",")[0].trim() || null;

  try {
    // Record the tracking event
    const { error } = await supabase.from("email_tracking").insert({
      booking_id: bookingId,
      email_type: "booking_notification",
      recipient_email: email,
      event_type: eventType === "open" ? "opened" : "clicked",
      link_url: redirectUrl || null,
      user_agent: userAgent,
      ip_address: ipAddress,
    });

    if (error) {
      console.error("Error recording tracking event:", error);
    } else {
      console.log(`Recorded ${eventType} event for booking ${bookingId}`);
    }
  } catch (err) {
    console.error("Error in tracking:", err);
  }

  // For open tracking, return the tracking pixel
  if (eventType === "open") {
    return new Response(TRACKING_PIXEL, {
      headers: {
        "Content-Type": "image/gif",
        "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
        "Pragma": "no-cache",
        "Expires": "0",
        ...corsHeaders,
      },
    });
  }

  // For click tracking, redirect to the original URL
  if (eventType === "click" && redirectUrl) {
    return new Response(null, {
      status: 302,
      headers: {
        Location: redirectUrl,
        ...corsHeaders,
      },
    });
  }

  return new Response("OK", { status: 200, headers: corsHeaders });
};

serve(handler);
