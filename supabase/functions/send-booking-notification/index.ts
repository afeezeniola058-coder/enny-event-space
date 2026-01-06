import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface NotificationRequest {
  booking_id: string;
  new_status: "confirmed" | "cancelled" | "pending";
}

const handler = async (req: Request): Promise<Response> => {
  console.log("send-booking-notification function called");

  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { booking_id, new_status }: NotificationRequest = await req.json();
    console.log(`Processing notification for booking: ${booking_id}, status: ${new_status}`);

    if (!booking_id || !new_status) {
      throw new Error("Missing booking_id or new_status");
    }

    // Create Supabase client with service role for admin access
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch booking details with user profile
    const { data: booking, error: bookingError } = await supabase
      .from("bookings")
      .select(`
        *,
        halls (name),
        catering_packages (name),
        decoration_packages (name)
      `)
      .eq("id", booking_id)
      .single();

    if (bookingError || !booking) {
      console.error("Error fetching booking:", bookingError);
      throw new Error("Booking not found");
    }

    // Fetch user profile for email
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("email, full_name")
      .eq("user_id", booking.user_id)
      .single();

    if (profileError || !profile?.email) {
      console.error("Error fetching user profile:", profileError);
      throw new Error("User email not found");
    }

    const userEmail = profile.email;
    const userName = profile.full_name || "Valued Customer";

    // Generate email content based on status
    let subject: string;
    let htmlContent: string;

    const eventDate = new Date(booking.event_date).toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });

    const hallName = booking.halls?.name || "N/A";
    const cateringName = booking.catering_packages?.name || "None";
    const decorationName = booking.decoration_packages?.name || "None";

    if (new_status === "confirmed") {
      subject = `🎉 Your Booking is Confirmed - ${booking.event_name}`;
      htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #10b981, #059669); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
            .details { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
            .detail-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #e5e7eb; }
            .detail-row:last-child { border-bottom: none; }
            .label { color: #6b7280; }
            .value { font-weight: 600; color: #111827; }
            .footer { text-align: center; margin-top: 20px; color: #6b7280; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Booking Confirmed! 🎉</h1>
            </div>
            <div class="content">
              <p>Dear ${userName},</p>
              <p>Great news! Your booking has been <strong>confirmed</strong>. We're excited to host your event!</p>
              
              <div class="details">
                <h3 style="margin-top: 0;">Booking Details</h3>
                <div class="detail-row">
                  <span class="label">Event Name</span>
                  <span class="value">${booking.event_name}</span>
                </div>
                <div class="detail-row">
                  <span class="label">Date</span>
                  <span class="value">${eventDate}</span>
                </div>
                <div class="detail-row">
                  <span class="label">Time</span>
                  <span class="value">${booking.start_time} - ${booking.end_time}</span>
                </div>
                <div class="detail-row">
                  <span class="label">Hall</span>
                  <span class="value">${hallName}</span>
                </div>
                <div class="detail-row">
                  <span class="label">Guests</span>
                  <span class="value">${booking.guest_count}</span>
                </div>
                <div class="detail-row">
                  <span class="label">Catering</span>
                  <span class="value">${cateringName}</span>
                </div>
                <div class="detail-row">
                  <span class="label">Decoration</span>
                  <span class="value">${decorationName}</span>
                </div>
                <div class="detail-row">
                  <span class="label">Total Amount</span>
                  <span class="value">₦${Number(booking.total_amount).toLocaleString()}</span>
                </div>
              </div>

              <p>If you have any questions, please don't hesitate to contact us.</p>
              <p>Thank you for choosing us!</p>
            </div>
            <div class="footer">
              <p>This is an automated message. Please do not reply directly to this email.</p>
            </div>
          </div>
        </body>
        </html>
      `;
    } else if (new_status === "cancelled") {
      subject = `Booking Cancelled - ${booking.event_name}`;
      htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #ef4444, #dc2626); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }
            .details { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
            .detail-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #e5e7eb; }
            .detail-row:last-child { border-bottom: none; }
            .label { color: #6b7280; }
            .value { font-weight: 600; color: #111827; }
            .footer { text-align: center; margin-top: 20px; color: #6b7280; font-size: 14px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Booking Cancelled</h1>
            </div>
            <div class="content">
              <p>Dear ${userName},</p>
              <p>We're sorry to inform you that your booking has been <strong>cancelled</strong>.</p>
              
              <div class="details">
                <h3 style="margin-top: 0;">Cancelled Booking Details</h3>
                <div class="detail-row">
                  <span class="label">Event Name</span>
                  <span class="value">${booking.event_name}</span>
                </div>
                <div class="detail-row">
                  <span class="label">Original Date</span>
                  <span class="value">${eventDate}</span>
                </div>
                <div class="detail-row">
                  <span class="label">Hall</span>
                  <span class="value">${hallName}</span>
                </div>
              </div>

              <p>If this cancellation was made in error or you'd like to make a new booking, please visit our website or contact us.</p>
              <p>We hope to serve you again in the future!</p>
            </div>
            <div class="footer">
              <p>This is an automated message. Please do not reply directly to this email.</p>
            </div>
          </div>
        </body>
        </html>
      `;
    } else {
      // For pending status, we don't send an email
      console.log("Status is pending, no email sent");
      return new Response(
        JSON.stringify({ success: true, message: "No email sent for pending status" }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Send the email using Resend API directly
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    if (!resendApiKey) {
      throw new Error("RESEND_API_KEY not configured");
    }

    const emailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "Enny Venue <bookings@ennyvenue.com>",
        to: [userEmail],
        subject: subject,
        html: htmlContent,
      }),
    });

    const emailResult = await emailResponse.json();

    if (!emailResponse.ok) {
      console.error("Error sending email:", emailResult);
      throw new Error(emailResult.message || "Failed to send email");
    }

    console.log("Email sent successfully:", emailResult);

    return new Response(
      JSON.stringify({ success: true, emailResponse: emailResult }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: any) {
    console.error("Error in send-booking-notification function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
