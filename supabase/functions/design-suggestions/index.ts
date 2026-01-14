import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { category, institutionName, currentColors } = await req.json();
    
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    console.log('Generating design suggestions for:', category, institutionName);

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          {
            role: "system",
            content: `You are a professional ID card design consultant. You provide color schemes and design recommendations based on institution types and branding needs. Always provide practical, professional suggestions that work well for ID cards.`
          },
          {
            role: "user",
            content: `I'm designing an ID card for a ${category} institution${institutionName ? ` called "${institutionName}"` : ''}. 
            
Current header color: ${currentColors?.headerColor || 'not set'}
Current footer color: ${currentColors?.footerColor || 'not set'}

Please suggest:
1. A professional color scheme (header and footer colors as hex codes)
2. Whether vertical or horizontal layout would work better
3. Which fields are most important for this type of institution
4. Any design tips specific to this category

Provide 3 different color theme options.`
          }
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "provide_design_suggestions",
              description: "Provide ID card design suggestions",
              parameters: {
                type: "object",
                properties: {
                  colorThemes: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        name: { type: "string", description: "Theme name" },
                        headerColor: { type: "string", description: "Header color as hex code" },
                        footerColor: { type: "string", description: "Footer color as hex code" },
                        description: { type: "string", description: "Brief description of the theme" }
                      },
                      required: ["name", "headerColor", "footerColor", "description"]
                    },
                    description: "Array of 3 color theme suggestions"
                  },
                  recommendedLayout: {
                    type: "string",
                    enum: ["vertical", "horizontal"],
                    description: "Recommended card layout"
                  },
                  layoutReason: {
                    type: "string",
                    description: "Reason for the layout recommendation"
                  },
                  priorityFields: {
                    type: "array",
                    items: { type: "string" },
                    description: "List of most important fields for this institution type"
                  },
                  designTips: {
                    type: "array",
                    items: { type: "string" },
                    description: "Design tips specific to this category"
                  }
                },
                required: ["colorThemes", "recommendedLayout", "layoutReason", "priorityFields", "designTips"],
                additionalProperties: false
              }
            }
          }
        ],
        tool_choice: { type: "function", function: { name: "provide_design_suggestions" } }
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI gateway error:', response.status, errorText);
      
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }), {
          status: 429,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: 'Usage limit reached. Please add credits to continue.' }), {
          status: 402,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    console.log('Design suggestions generated');

    let suggestions = null;
    
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (toolCall?.function?.arguments) {
      try {
        suggestions = JSON.parse(toolCall.function.arguments);
      } catch (e) {
        console.error('Failed to parse tool call arguments:', e);
      }
    }

    // Fallback with default suggestions if AI fails
    if (!suggestions) {
      suggestions = {
        colorThemes: [
          { name: "Professional Blue", headerColor: "#1e40af", footerColor: "#1e3a8a", description: "Classic professional look" },
          { name: "Modern Teal", headerColor: "#0d9488", footerColor: "#0f766e", description: "Fresh and contemporary" },
          { name: "Elegant Gray", headerColor: "#374151", footerColor: "#1f2937", description: "Sophisticated and neutral" }
        ],
        recommendedLayout: "vertical",
        layoutReason: "Vertical layout provides more space for photo and details",
        priorityFields: ["name", "idNumber", "designation", "photo"],
        designTips: ["Use high-contrast colors for readability", "Keep the design clean and uncluttered"]
      };
    }

    return new Response(JSON.stringify({ suggestions }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error generating design suggestions:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Failed to generate suggestions' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
