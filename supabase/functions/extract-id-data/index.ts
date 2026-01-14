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
    const { imageBase64, category } = await req.json();
    
    if (!imageBase64) {
      throw new Error('No image provided');
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    console.log('Extracting data from ID card image for category:', category);

    const fieldPrompts: Record<string, string> = {
      school: 'name, rollNo (roll number), class (class/section), grNo (GR/admission number), dob (date of birth in YYYY-MM-DD format), bloodGroup, phone, address, academicYear',
      college: 'name, enrollmentNo (enrollment number), department, course, dob (date of birth in YYYY-MM-DD format), bloodGroup, phone, address, academicYear',
      corporate: 'name, employeeId (employee ID), designation, department, dob (date of birth in YYYY-MM-DD format), bloodGroup, phone, joiningYear, address',
      event: 'name, participantId (participant ID), role, organization, phone, email, eventDate',
      custom: 'name, idNumber, designation, department, dob, bloodGroup, phone, address'
    };

    const fieldsToExtract = fieldPrompts[category] || fieldPrompts.custom;

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
            role: "user",
            content: [
              {
                type: "text",
                text: `You are an OCR expert. Analyze this ID card image and extract the following information: ${fieldsToExtract}.

Also extract:
- institutionName: the name of the institution/organization/company shown on the card
- institutionAddress: any address visible on the card

Return the data as a JSON object with these exact field names. If a field is not visible or cannot be determined, use an empty string. Be accurate and extract only what you can clearly read.

Important: Return ONLY the JSON object, no markdown formatting, no code blocks, just the raw JSON.`
              },
              {
                type: "image_url",
                image_url: {
                  url: imageBase64
                }
              }
            ]
          }
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "extract_id_data",
              description: "Extract structured data from an ID card image",
              parameters: {
                type: "object",
                properties: {
                  name: { type: "string", description: "Full name of the person" },
                  rollNo: { type: "string", description: "Roll number" },
                  class: { type: "string", description: "Class or section" },
                  grNo: { type: "string", description: "GR or admission number" },
                  enrollmentNo: { type: "string", description: "Enrollment number" },
                  employeeId: { type: "string", description: "Employee ID" },
                  participantId: { type: "string", description: "Participant ID" },
                  idNumber: { type: "string", description: "Generic ID number" },
                  designation: { type: "string", description: "Job title or designation" },
                  department: { type: "string", description: "Department name" },
                  course: { type: "string", description: "Course name" },
                  role: { type: "string", description: "Role at event" },
                  organization: { type: "string", description: "Organization name" },
                  dob: { type: "string", description: "Date of birth (YYYY-MM-DD)" },
                  bloodGroup: { type: "string", description: "Blood group" },
                  phone: { type: "string", description: "Phone number" },
                  email: { type: "string", description: "Email address" },
                  address: { type: "string", description: "Address" },
                  academicYear: { type: "string", description: "Academic year" },
                  joiningYear: { type: "string", description: "Joining year" },
                  eventDate: { type: "string", description: "Event date" },
                  emergencyContact: { type: "string", description: "Emergency contact" },
                  institutionName: { type: "string", description: "Institution or organization name" },
                  institutionAddress: { type: "string", description: "Institution address" }
                },
                required: ["name"],
                additionalProperties: false
              }
            }
          }
        ],
        tool_choice: { type: "function", function: { name: "extract_id_data" } }
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
    console.log('OCR extraction completed');

    let extractedData = {};
    
    // Try to get data from tool call
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (toolCall?.function?.arguments) {
      try {
        extractedData = JSON.parse(toolCall.function.arguments);
      } catch (e) {
        console.error('Failed to parse tool call arguments:', e);
      }
    }
    
    // Fallback: try to parse from content
    if (Object.keys(extractedData).length === 0) {
      const content = data.choices?.[0]?.message?.content;
      if (content) {
        try {
          const jsonMatch = content.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            extractedData = JSON.parse(jsonMatch[0]);
          }
        } catch (e) {
          console.error('Failed to parse content as JSON:', e);
        }
      }
    }

    return new Response(JSON.stringify({ 
      extractedData,
      success: Object.keys(extractedData).length > 0
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error extracting ID data:', error);
    return new Response(JSON.stringify({ 
      error: error instanceof Error ? error.message : 'Failed to extract ID data' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
