import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface LockoutNotificationRequest {
  email: string;
  attemptType: 'login' | 'signup';
  lockoutMinutes: number;
}

serve(async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error("Missing Supabase configuration");
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { email, attemptType, lockoutMinutes }: LockoutNotificationRequest = await req.json();

    // Validate input
    if (!email || !attemptType || !lockoutMinutes) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return new Response(
        JSON.stringify({ error: "Invalid email format" }),
        { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Check if email exists in auth.users (only notify registered users)
    const { data: userData, error: userError } = await supabase.auth.admin.listUsers();
    
    if (userError) {
      console.error("Error checking user:", userError);
      // Don't reveal if user exists or not for security
      return new Response(
        JSON.stringify({ success: true, message: "Notification processed" }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const userExists = userData.users.some(u => u.email?.toLowerCase() === email.toLowerCase());
    
    if (!userExists) {
      // Don't reveal if user exists - just return success silently
      return new Response(
        JSON.stringify({ success: true, message: "Notification processed" }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Log the lockout event (for security auditing)
    console.log(`Lockout notification triggered for ${email} - ${attemptType} attempts exceeded`);

    // For now, we'll log the notification
    // To enable actual email sending, configure a Resend API key or email domain
    const notificationData = {
      email,
      attemptType,
      lockoutMinutes,
      timestamp: new Date().toISOString(),
      message: `Your account has been temporarily locked due to too many ${attemptType} attempts. Please try again in ${lockoutMinutes} minutes. If this wasn't you, please contact support.`
    };

    console.log("Lockout notification data:", JSON.stringify(notificationData));

    // Check if RESEND_API_KEY is configured for actual email sending
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    
    if (resendApiKey) {
      try {
        const emailResponse = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${resendApiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            from: "IDCRAFT Security <security@resend.dev>",
            to: [email],
            subject: "Security Alert: Account Temporarily Locked",
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #dc2626;">Security Alert</h2>
                <p>Hello,</p>
                <p>We detected multiple failed ${attemptType} attempts on your IDCRAFT account.</p>
                <p>For your security, your account has been temporarily locked for <strong>${lockoutMinutes} minutes</strong>.</p>
                <p>If this was you, simply wait and try again later.</p>
                <p>If you didn't attempt to ${attemptType === 'login' ? 'log in' : 'sign up'}, please:</p>
                <ul>
                  <li>Change your password immediately after the lockout expires</li>
                  <li>Enable two-factor authentication if available</li>
                  <li>Contact our support team if you need assistance</li>
                </ul>
                <p style="color: #666; font-size: 12px; margin-top: 20px;">
                  This is an automated security notification from IDCRAFT.
                </p>
              </div>
            `,
          }),
        });

        const emailResult = await emailResponse.json();
        console.log("Email sent successfully:", emailResult);
      } catch (emailError) {
        console.error("Failed to send email:", emailError);
      }
    } else {
      console.log("RESEND_API_KEY not configured - email notification skipped");
    }

    return new Response(
      JSON.stringify({ success: true, message: "Notification processed" }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: unknown) {
    console.error("Error in send-lockout-notification:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
});
