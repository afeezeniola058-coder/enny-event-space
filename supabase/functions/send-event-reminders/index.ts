import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.2";
import { Resend } from "https://esm.sh/resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface BookingWithProfile {
  id: string;
  event_name: string;
  event_date: string;
  start_time: string;
  end_time: string;
  guest_count: number;
  user_id: string;
  hall: { name: string } | null;
  catering_package: { name: string } | null;
  decoration_package: { name: string } | null;
  profile: { email: string; full_name: string } | null;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const resendApiKey = Deno.env.get("RESEND_API_KEY");

    if (!resendApiKey) {
      throw new Error("RESEND_API_KEY is not configured");
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
    const resend = new Resend(resendApiKey);

    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const oneWeekFromNow = new Date(today);
    oneWeekFromNow.setDate(oneWeekFromNow.getDate() + 7);

    const formatDate = (date: Date) => date.toISOString().split("T")[0];

    // Fetch bookings happening tomorrow (one day reminder)
    const { data: tomorrowBookings, error: tomorrowError } = await supabase
      .from("bookings")
      .select(`
        id,
        event_name,
        event_date,
        start_time,
        end_time,
        guest_count,
        user_id,
        hall:halls(name),
        catering_package:catering_packages(name),
        decoration_package:decoration_packages(name)
      `)
      .eq("event_date", formatDate(tomorrow))
      .eq("status", "confirmed");

    if (tomorrowError) {
      console.error("Error fetching tomorrow bookings:", tomorrowError);
      throw tomorrowError;
    }

    // Fetch bookings happening in one week (one week reminder)
    const { data: weekBookings, error: weekError } = await supabase
      .from("bookings")
      .select(`
        id,
        event_name,
        event_date,
        start_time,
        end_time,
        guest_count,
        user_id,
        hall:halls(name),
        catering_package:catering_packages(name),
        decoration_package:decoration_packages(name)
      `)
      .eq("event_date", formatDate(oneWeekFromNow))
      .eq("status", "confirmed");

    if (weekError) {
      console.error("Error fetching week bookings:", weekError);
      throw weekError;
    }

    const results = {
      oneDayReminders: { sent: 0, skipped: 0, errors: 0 },
      oneWeekReminders: { sent: 0, skipped: 0, errors: 0 },
    };

    // Process one day reminders
    for (const booking of tomorrowBookings || []) {
      try {
        // Check if reminder already sent
        const { data: existingReminder } = await supabase
          .from("email_reminders")
          .select("id")
          .eq("booking_id", booking.id)
          .eq("reminder_type", "one_day")
          .single();

        if (existingReminder) {
          results.oneDayReminders.skipped++;
          continue;
        }

        // Get user profile
        const { data: profile } = await supabase
          .from("profiles")
          .select("email, full_name")
          .eq("user_id", booking.user_id)
          .single();

        if (!profile?.email) {
          console.log(`No email found for user ${booking.user_id}`);
          results.oneDayReminders.skipped++;
          continue;
        }

        // Send reminder email
        const emailHtml = generateReminderEmail(booking, profile, "tomorrow");
        
        const fromEmail = resendApiKey.startsWith("re_test") 
          ? "onboarding@resend.dev" 
          : "Elegance Events <notifications@yourdomain.com>";

        await resend.emails.send({
          from: fromEmail,
          to: [profile.email],
          subject: `Reminder: Your event "${booking.event_name}" is tomorrow!`,
          html: emailHtml,
        });

        // Record reminder sent
        await supabase.from("email_reminders").insert({
          booking_id: booking.id,
          reminder_type: "one_day",
        });

        results.oneDayReminders.sent++;
        console.log(`One day reminder sent for booking ${booking.id}`);
      } catch (error) {
        console.error(`Error sending one day reminder for booking ${booking.id}:`, error);
        results.oneDayReminders.errors++;
      }
    }

    // Process one week reminders
    for (const booking of weekBookings || []) {
      try {
        // Check if reminder already sent
        const { data: existingReminder } = await supabase
          .from("email_reminders")
          .select("id")
          .eq("booking_id", booking.id)
          .eq("reminder_type", "one_week")
          .single();

        if (existingReminder) {
          results.oneWeekReminders.skipped++;
          continue;
        }

        // Get user profile
        const { data: profile } = await supabase
          .from("profiles")
          .select("email, full_name")
          .eq("user_id", booking.user_id)
          .single();

        if (!profile?.email) {
          console.log(`No email found for user ${booking.user_id}`);
          results.oneWeekReminders.skipped++;
          continue;
        }

        // Send reminder email
        const emailHtml = generateReminderEmail(booking, profile, "one week");

        const fromEmail = resendApiKey.startsWith("re_test") 
          ? "onboarding@resend.dev" 
          : "Elegance Events <notifications@yourdomain.com>";

        await resend.emails.send({
          from: fromEmail,
          to: [profile.email],
          subject: `Reminder: Your event "${booking.event_name}" is in one week!`,
          html: emailHtml,
        });

        // Record reminder sent
        await supabase.from("email_reminders").insert({
          booking_id: booking.id,
          reminder_type: "one_week",
        });

        results.oneWeekReminders.sent++;
        console.log(`One week reminder sent for booking ${booking.id}`);
      } catch (error) {
        console.error(`Error sending one week reminder for booking ${booking.id}:`, error);
        results.oneWeekReminders.errors++;
      }
    }

    console.log("Reminder processing complete:", results);

    return new Response(JSON.stringify({ success: true, results }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error in send-event-reminders function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

function generateReminderEmail(
  booking: any,
  profile: { email: string; full_name: string },
  timeframe: string
): string {
  const eventDate = new Date(booking.event_date);
  const formattedDate = eventDate.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(":");
    const date = new Date();
    date.setHours(parseInt(hours), parseInt(minutes));
    return date.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  };

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Event Reminder</title>
    </head>
    <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f5f5f5;">
      <table role="presentation" style="width: 100%; border-collapse: collapse;">
        <tr>
          <td align="center" style="padding: 40px 0;">
            <table role="presentation" style="width: 600px; border-collapse: collapse; background-color: #ffffff; border-radius: 12px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
              <!-- Header -->
              <tr>
                <td style="background: linear-gradient(135deg, #8B5CF6 0%, #A855F7 100%); padding: 40px 30px; text-align: center; border-radius: 12px 12px 0 0;">
                  <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 600;">⏰ Event Reminder</h1>
                  <p style="color: #E9D5FF; margin: 10px 0 0 0; font-size: 16px;">Your event is ${timeframe}!</p>
                </td>
              </tr>
              
              <!-- Content -->
              <tr>
                <td style="padding: 40px 30px;">
                  <p style="font-size: 16px; color: #374151; margin: 0 0 20px 0;">
                    Hello ${profile.full_name || "there"},
                  </p>
                  <p style="font-size: 16px; color: #374151; margin: 0 0 30px 0;">
                    This is a friendly reminder that your event <strong>"${booking.event_name}"</strong> is scheduled for ${timeframe}. Here are your event details:
                  </p>
                  
                  <!-- Event Details Card -->
                  <table role="presentation" style="width: 100%; border-collapse: collapse; background-color: #F3F4F6; border-radius: 8px; margin-bottom: 30px;">
                    <tr>
                      <td style="padding: 24px;">
                        <table role="presentation" style="width: 100%; border-collapse: collapse;">
                          <tr>
                            <td style="padding: 8px 0;">
                              <span style="color: #6B7280; font-size: 14px;">📅 Date</span><br>
                              <span style="color: #111827; font-size: 16px; font-weight: 500;">${formattedDate}</span>
                            </td>
                          </tr>
                          <tr>
                            <td style="padding: 8px 0;">
                              <span style="color: #6B7280; font-size: 14px;">🕐 Time</span><br>
                              <span style="color: #111827; font-size: 16px; font-weight: 500;">${formatTime(booking.start_time)} - ${formatTime(booking.end_time)}</span>
                            </td>
                          </tr>
                          ${booking.hall ? `
                          <tr>
                            <td style="padding: 8px 0;">
                              <span style="color: #6B7280; font-size: 14px;">🏛️ Venue</span><br>
                              <span style="color: #111827; font-size: 16px; font-weight: 500;">${booking.hall.name}</span>
                            </td>
                          </tr>
                          ` : ""}
                          <tr>
                            <td style="padding: 8px 0;">
                              <span style="color: #6B7280; font-size: 14px;">👥 Guests</span><br>
                              <span style="color: #111827; font-size: 16px; font-weight: 500;">${booking.guest_count} people</span>
                            </td>
                          </tr>
                          ${booking.catering_package ? `
                          <tr>
                            <td style="padding: 8px 0;">
                              <span style="color: #6B7280; font-size: 14px;">🍽️ Catering</span><br>
                              <span style="color: #111827; font-size: 16px; font-weight: 500;">${booking.catering_package.name}</span>
                            </td>
                          </tr>
                          ` : ""}
                          ${booking.decoration_package ? `
                          <tr>
                            <td style="padding: 8px 0;">
                              <span style="color: #6B7280; font-size: 14px;">🎨 Decorations</span><br>
                              <span style="color: #111827; font-size: 16px; font-weight: 500;">${booking.decoration_package.name}</span>
                            </td>
                          </tr>
                          ` : ""}
                        </table>
                      </td>
                    </tr>
                  </table>
                  
                  <p style="font-size: 14px; color: #6B7280; margin: 0 0 20px 0;">
                    If you have any questions or need to make changes, please contact us as soon as possible.
                  </p>
                  
                  <p style="font-size: 14px; color: #374151; margin: 0;">
                    We look forward to making your event memorable!
                  </p>
                </td>
              </tr>
              
              <!-- Footer -->
              <tr>
                <td style="background-color: #F9FAFB; padding: 24px 30px; text-align: center; border-radius: 0 0 12px 12px; border-top: 1px solid #E5E7EB;">
                  <p style="color: #6B7280; font-size: 12px; margin: 0;">
                    Elegance Events Hall | Your Perfect Venue for Every Occasion
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;
}

serve(handler);
