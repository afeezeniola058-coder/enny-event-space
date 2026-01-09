import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getCorsHeaders } from "../_shared/cors.ts";

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);
  
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { eventType, guestCount, budget } = await req.json();

    if (!eventType || !guestCount) {
      return new Response(
        JSON.stringify({ error: "eventType and guestCount are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Fetch available packages from database
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const [cateringResult, decorationResult] = await Promise.all([
      supabase.from("catering_packages").select("*"),
      supabase.from("decoration_packages").select("*"),
    ]);

    if (cateringResult.error) throw cateringResult.error;
    if (decorationResult.error) throw decorationResult.error;

    const cateringPackages = cateringResult.data || [];
    const decorationPackages = decorationResult.data || [];

    const systemPrompt = `You are an expert event planner helping clients choose the perfect catering and decoration packages for their events. You have access to real package data and should make personalized recommendations based on the event type, guest count, and budget.

Always respond with valid JSON in this exact format:
{
  "cateringRecommendation": {
    "packageId": "uuid of the recommended package",
    "packageName": "name of the package",
    "reason": "1-2 sentence explanation why this is perfect for the event",
    "estimatedCost": number (price_per_person * guest_count)
  },
  "decorationRecommendation": {
    "packageId": "uuid of the recommended package",
    "packageName": "name of the package",
    "reason": "1-2 sentence explanation why this is perfect for the event",
    "estimatedCost": number (package price)
  },
  "summary": "A friendly 2-3 sentence summary of why these packages work great together for this event",
  "tips": ["2-3 helpful tips for making the event special"]
}

Consider these factors when making recommendations:
- Wedding events typically need elegant, upscale options
- Corporate events benefit from professional, refined choices
- Birthday parties can be more casual and fun
- Large guest counts (200+) need efficient service packages
- Budget constraints should influence your choices
- Match decoration styles to the event formality`;

    const userPrompt = `Please recommend the best catering and decoration packages for this event:

Event Type: ${eventType}
Number of Guests: ${guestCount}
${budget ? `Budget: NGN ${budget.toLocaleString()}` : "Budget: Flexible"}

Available Catering Packages:
${JSON.stringify(cateringPackages.map(p => ({
  id: p.id,
  name: p.name,
  category: p.category,
  description: p.description,
  price_per_person: p.price_per_person,
  menu_items: p.menu_items
})), null, 2)}

Available Decoration Packages:
${JSON.stringify(decorationPackages.map(p => ({
  id: p.id,
  name: p.name,
  style: p.style,
  description: p.description,
  price: p.price,
  features: p.features
})), null, 2)}

Provide your recommendations in the specified JSON format.`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits exhausted. Please contact support." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error("AI service unavailable");
    }

    const aiResponse = await response.json();
    const content = aiResponse.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error("No response from AI");
    }

    // Parse the JSON response - handle markdown code blocks
    let jsonContent = content;
    const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch) {
      jsonContent = jsonMatch[1].trim();
    }

    const recommendations = JSON.parse(jsonContent);

    return new Response(JSON.stringify(recommendations), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("AI recommender error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
