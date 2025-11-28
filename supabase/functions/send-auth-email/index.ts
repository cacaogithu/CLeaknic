import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY") as string;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

async function sendEmail(to: string, subject: string, html: string) {
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${RESEND_API_KEY}`,
    },
    body: JSON.stringify({
      from: "EvidenS Clinic <onboarding@resend.dev>",
      to: [to],
      subject,
      html,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Resend API error: ${error}`);
  }

  return await response.json();
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const payload = await req.json();
    const { user, email_data } = payload;

    console.log("[send-auth-email] Received request for:", user.email);
    console.log("[send-auth-email] Email type:", email_data?.email_action_type);

    const { token_hash, redirect_to, token } = email_data;
    const emailType = email_data?.email_action_type;
    const supabaseUrl = Deno.env.get("SUPABASE_URL");

    console.log("[send-auth-email] Processing email type:", emailType);
    console.log("[send-auth-email] Sending to:", user.email);

    let subject = "";
    let html = "";

    // Base styles for all emails
    const baseStyles = `
      body { margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', sans-serif; }
      .container { max-width: 600px; margin: 0 auto; background: linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%); padding: 40px 20px; }
      .card { background: white; border-radius: 16px; padding: 40px; box-shadow: 0 10px 30px rgba(0,0,0,0.1); }
      .logo { text-align: center; margin-bottom: 30px; }
      .logo-text { font-size: 32px; font-weight: bold; color: #0ea5e9; margin: 0; }
      h1 { color: #1e293b; font-size: 28px; margin: 0 0 20px 0; text-align: center; }
      p { color: #475569; font-size: 16px; line-height: 1.6; margin: 0 0 20px 0; }
      .button-container { text-align: center; margin: 40px 0; }
      .button { display: inline-block; background: linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%); color: white; text-decoration: none; padding: 16px 40px; border-radius: 12px; font-size: 18px; font-weight: 600; box-shadow: 0 4px 15px rgba(14, 165, 233, 0.3); }
      .footer { text-align: center; color: #94a3b8; font-size: 14px; margin-top: 40px; padding-top: 30px; border-top: 1px solid #e2e8f0; }
      .link-text { color: #64748b; font-size: 14px; word-break: break-all; background: #f1f5f9; padding: 12px; border-radius: 8px; margin: 20px 0; }
      .code { display: inline-block; padding: 16px 4.5%; width: 90.5%; background: #f4f4f4; border-radius: 5px; border: 1px solid #eee; color: #333; font-family: monospace; font-size: 24px; text-align: center; letter-spacing: 4px; }
    `;

    switch (emailType) {
      case "signup":
        subject = "✅ Confirme seu email - EvidenS Clinic CRM";
        const signupUrl = `${supabaseUrl}/auth/v1/verify?token=${token_hash}&type=signup&redirect_to=${encodeURIComponent(redirect_to || "/")}`;
        html = `
          <!DOCTYPE html>
          <html>
            <head>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <style>${baseStyles}</style>
            </head>
            <body>
              <div class="container">
                <div class="card">
                  <div class="logo">
                    <p class="logo-text">🦷 EvidenS Clinic</p>
                  </div>
                  <h1>Bem-vindo ao nosso CRM! 🎉</h1>
                  <p>Olá,</p>
                  <p>Obrigado por se cadastrar no <strong>CRM + AI da EvidenS Clinic</strong>. Estamos muito felizes em tê-lo(a) conosco!</p>
                  <p>Para completar seu cadastro e começar a usar o sistema, confirme seu email clicando no botão abaixo:</p>
                  <div class="button-container">
                    <a href="${signupUrl}" class="button">✓ Confirmar Email</a>
                  </div>
                  <p style="font-size: 14px; color: #64748b;">Ou copie e cole este link no seu navegador:</p>
                  <div class="link-text">${signupUrl}</div>
                  <div class="footer">
                    <p style="margin: 0 0 10px 0;">⏰ Este link expira em 24 horas</p>
                    <p style="margin: 0 0 20px 0; font-size: 13px;">Se você não criou esta conta, pode ignorar este email com segurança.</p>
                    <p style="margin: 0; font-weight: 600; color: #64748b;">EvidenS Clinic - Sistema de Gestão de Clientes</p>
                  </div>
                </div>
              </div>
            </body>
          </html>
        `;
        break;

      case "invite":
        subject = "📧 Convite para EvidenS Clinic CRM";
        const inviteUrl = `${supabaseUrl}/auth/v1/verify?token=${token_hash}&type=invite&redirect_to=${encodeURIComponent(redirect_to || "/")}`;
        html = `
          <!DOCTYPE html>
          <html>
            <head>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <style>${baseStyles}</style>
            </head>
            <body>
              <div class="container">
                <div class="card">
                  <div class="logo">
                    <p class="logo-text">🦷 EvidenS Clinic</p>
                  </div>
                  <h1>Você foi convidado! 🎊</h1>
                  <p>Olá,</p>
                  <p>Você recebeu um convite para fazer parte da equipe do <strong>CRM + AI da EvidenS Clinic</strong>.</p>
                  <p>Clique no botão abaixo para aceitar o convite e criar sua conta:</p>
                  <div class="button-container">
                    <a href="${inviteUrl}" class="button">✓ Aceitar Convite</a>
                  </div>
                  <p style="font-size: 14px; color: #64748b;">Ou copie e cole este link no seu navegador:</p>
                  <div class="link-text">${inviteUrl}</div>
                  <div class="footer">
                    <p style="margin: 0 0 10px 0;">⏰ Este convite expira em 24 horas</p>
                    <p style="margin: 0 0 20px 0; font-size: 13px;">Se você não esperava este convite, pode ignorar este email com segurança.</p>
                    <p style="margin: 0; font-weight: 600; color: #64748b;">EvidenS Clinic - Sistema de Gestão de Clientes</p>
                  </div>
                </div>
              </div>
            </body>
          </html>
        `;
        break;

      case "magiclink":
        subject = "🔐 Seu link de acesso - EvidenS Clinic CRM";
        const magicUrl = `${supabaseUrl}/auth/v1/verify?token=${token_hash}&type=magiclink&redirect_to=${encodeURIComponent(redirect_to || "/")}`;
        html = `
          <!DOCTYPE html>
          <html>
            <head>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <style>${baseStyles}</style>
            </head>
            <body>
              <div class="container">
                <div class="card">
                  <div class="logo">
                    <p class="logo-text">🦷 EvidenS Clinic</p>
                  </div>
                  <h1>Seu Link Mágico ✨</h1>
                  <p>Olá,</p>
                  <p>Você solicitou um link para acessar o <strong>CRM + AI da EvidenS Clinic</strong>.</p>
                  <p>Clique no botão abaixo para fazer login automaticamente:</p>
                  <div class="button-container">
                    <a href="${magicUrl}" class="button">🔓 Fazer Login</a>
                  </div>
                  <p style="font-size: 14px; color: #64748b;">Ou copie e cole este link no seu navegador:</p>
                  <div class="link-text">${magicUrl}</div>
                  ${token ? `
                  <p style="font-size: 14px; color: #64748b; text-align: center; margin-top: 30px;">Ou use este código de verificação:</p>
                  <div class="code">${token}</div>
                  ` : ''}
                  <div class="footer">
                    <p style="margin: 0 0 10px 0;">⏰ Este link expira em 1 hora</p>
                    <p style="margin: 0 0 20px 0; font-size: 13px;">Se você não solicitou este login, pode ignorar este email com segurança.</p>
                    <p style="margin: 0; font-weight: 600; color: #64748b;">EvidenS Clinic - Sistema de Gestão de Clientes</p>
                  </div>
                </div>
              </div>
            </body>
          </html>
        `;
        break;

      case "recovery":
        subject = "🔑 Recuperação de senha - EvidenS Clinic CRM";
        const recoveryUrl = `${supabaseUrl}/auth/v1/verify?token=${token_hash}&type=recovery&redirect_to=${encodeURIComponent(redirect_to || "/")}`;
        html = `
          <!DOCTYPE html>
          <html>
            <head>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <style>${baseStyles}</style>
            </head>
            <body>
              <div class="container">
                <div class="card">
                  <div class="logo">
                    <p class="logo-text">🦷 EvidenS Clinic</p>
                  </div>
                  <h1>Recuperação de Senha 🔑</h1>
                  <p>Olá,</p>
                  <p>Você solicitou a recuperação de senha para sua conta no <strong>CRM + AI da EvidenS Clinic</strong>.</p>
                  <p>Clique no botão abaixo para criar uma nova senha:</p>
                  <div class="button-container">
                    <a href="${recoveryUrl}" class="button">🔐 Redefinir Senha</a>
                  </div>
                  <p style="font-size: 14px; color: #64748b;">Ou copie e cole este link no seu navegador:</p>
                  <div class="link-text">${recoveryUrl}</div>
                  <div class="footer">
                    <p style="margin: 0 0 10px 0;">⏰ Este link expira em 1 hora</p>
                    <p style="margin: 0 0 20px 0; font-size: 13px;">Se você não solicitou esta recuperação, pode ignorar este email. Sua senha permanecerá inalterada.</p>
                    <p style="margin: 0; font-weight: 600; color: #64748b;">EvidenS Clinic - Sistema de Gestão de Clientes</p>
                  </div>
                </div>
              </div>
            </body>
          </html>
        `;
        break;

      case "email_change":
        subject = "📧 Confirme a mudança de email - EvidenS Clinic CRM";
        const emailChangeUrl = `${supabaseUrl}/auth/v1/verify?token=${token_hash}&type=email_change&redirect_to=${encodeURIComponent(redirect_to || "/")}`;
        html = `
          <!DOCTYPE html>
          <html>
            <head>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <style>${baseStyles}</style>
            </head>
            <body>
              <div class="container">
                <div class="card">
                  <div class="logo">
                    <p class="logo-text">🦷 EvidenS Clinic</p>
                  </div>
                  <h1>Confirme seu novo email 📧</h1>
                  <p>Olá,</p>
                  <p>Você solicitou a alteração do email da sua conta no <strong>CRM + AI da EvidenS Clinic</strong>.</p>
                  <p>Para confirmar este novo endereço de email, clique no botão abaixo:</p>
                  <div class="button-container">
                    <a href="${emailChangeUrl}" class="button">✓ Confirmar Novo Email</a>
                  </div>
                  <p style="font-size: 14px; color: #64748b;">Ou copie e cole este link no seu navegador:</p>
                  <div class="link-text">${emailChangeUrl}</div>
                  <div class="footer">
                    <p style="margin: 0 0 10px 0;">⏰ Este link expira em 24 horas</p>
                    <p style="margin: 0 0 20px 0; font-size: 13px;">Se você não solicitou esta alteração, entre em contato conosco imediatamente.</p>
                    <p style="margin: 0; font-weight: 600; color: #64748b;">EvidenS Clinic - Sistema de Gestão de Clientes</p>
                  </div>
                </div>
              </div>
            </body>
          </html>
        `;
        break;

      case "reauthentication":
        subject = "🔒 Confirmação de identidade - EvidenS Clinic CRM";
        const reauthUrl = `${supabaseUrl}/auth/v1/verify?token=${token_hash}&type=reauthentication&redirect_to=${encodeURIComponent(redirect_to || "/")}`;
        html = `
          <!DOCTYPE html>
          <html>
            <head>
              <meta charset="utf-8">
              <meta name="viewport" content="width=device-width, initial-scale=1.0">
              <style>${baseStyles}</style>
            </head>
            <body>
              <div class="container">
                <div class="card">
                  <div class="logo">
                    <p class="logo-text">🦷 EvidenS Clinic</p>
                  </div>
                  <h1>Confirmação de Identidade 🔒</h1>
                  <p>Olá,</p>
                  <p>Por motivos de segurança, precisamos confirmar sua identidade no <strong>CRM + AI da EvidenS Clinic</strong>.</p>
                  <p>Clique no botão abaixo para confirmar que é você:</p>
                  <div class="button-container">
                    <a href="${reauthUrl}" class="button">✓ Confirmar Identidade</a>
                  </div>
                  <p style="font-size: 14px; color: #64748b;">Ou copie e cole este link no seu navegador:</p>
                  <div class="link-text">${reauthUrl}</div>
                  ${token ? `
                  <p style="font-size: 14px; color: #64748b; text-align: center; margin-top: 30px;">Ou use este código de verificação:</p>
                  <div class="code">${token}</div>
                  ` : ''}
                  <div class="footer">
                    <p style="margin: 0 0 10px 0;">⏰ Este link expira em 15 minutos</p>
                    <p style="margin: 0 0 20px 0; font-size: 13px;">Se você não está tentando acessar uma área restrita, pode ignorar este email.</p>
                    <p style="margin: 0; font-weight: 600; color: #64748b;">EvidenS Clinic - Sistema de Gestão de Clientes</p>
                  </div>
                </div>
              </div>
            </body>
          </html>
        `;
        break;

      default:
        console.log("[send-auth-email] Unsupported email type:", emailType);
        return new Response(JSON.stringify({ skipped: true, reason: "unsupported_type" }), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
    }

    const { data: emailData, error } = await sendEmail(user.email, subject, html);

    console.log("[send-auth-email] ✅ Email sent successfully:", emailData);

    return new Response(
      JSON.stringify({ success: true, emailId: emailData?.id }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error: any) {
    console.error("[send-auth-email] ❌ Error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
