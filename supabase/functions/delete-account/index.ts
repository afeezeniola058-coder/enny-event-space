import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify the user from the JWT
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing authorization" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Client with user's JWT to get their identity
    const userClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: userError } = await userClient.auth.getUser();
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userId = user.id;

    // Admin client to delete data and auth user
    const adminClient = createClient(supabaseUrl, serviceRoleKey);

    // Delete user data from all tables (order matters for any future FK constraints)
    await adminClient.from("email_reminders").delete().eq("booking_id", userId); // handled via bookings below
    await adminClient.from("notifications").delete().eq("user_id", userId);
    await adminClient.from("reviews").delete().eq("user_id", userId);
    await adminClient.from("email_tracking").delete().eq("booking_id", userId); // clean up tracking

    // Delete bookings and related email_reminders
    const { data: bookings } = await adminClient.from("bookings").select("id").eq("user_id", userId);
    if (bookings && bookings.length > 0) {
      const bookingIds = bookings.map((b: any) => b.id);
      await adminClient.from("email_reminders").delete().in("booking_id", bookingIds);
      await adminClient.from("email_tracking").delete().in("booking_id", bookingIds);
      await adminClient.from("bookings").delete().eq("user_id", userId);
    }

    await adminClient.from("user_roles").delete().eq("user_id", userId);
    await adminClient.from("profiles").delete().eq("user_id", userId);

    // Delete avatar files from storage
    const { data: avatarFiles } = await adminClient.storage.from("avatars").list(userId);
    if (avatarFiles && avatarFiles.length > 0) {
      const filePaths = avatarFiles.map((f: any) => `${userId}/${f.name}`);
      await adminClient.storage.from("avatars").remove(filePaths);
    }

    // Delete the auth user
    const { error: deleteError } = await adminClient.auth.admin.deleteUser(userId);
    if (deleteError) {
      throw new Error(`Failed to delete auth user: ${deleteError.message}`);
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
