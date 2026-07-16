// DOMAIN CREATED / DNS SETUP TEMPLATE
export function domainCreatedTemplate(data) {
  return {
    subject: `Domain Setup Required - ${data.tenantName}`,
    html: `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Domain Setup</title>
</head>

<body style="margin:0;padding:0;background:#f5f5f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;">

<table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f5;">
<tr>
<td align="center" style="padding:20px 10px;">

<table width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background:#ffffff;border-radius:12px;box-shadow:0 4px 16px rgba(0,0,0,0.08);">

<!-- HEADER -->
<tr>
<td style="background:linear-gradient(135deg,#0ea5e9,#2563eb);padding:32px 24px;text-align:center;border-radius:12px 12px 0 0;">
  <h1 style="margin:0;font-size:24px;color:#fff;font-weight:700;">${data.tenantName}</h1>
  <p style="margin:8px 0 0;color:#dbeafe;font-size:14px;">Domain Configuration Required</p>
</td>
</tr>

<!-- CONTENT -->
<tr>
<td style="padding:32px 24px;">

<h2 style="margin:0 0 16px;font-size:20px;color:#111827;">Your Domain Was Added 🎉</h2>

<p style="margin:0 0 20px;font-size:15px;color:#4b5563;line-height:1.6;">
To start sending emails from your domain, please add the DNS record below in your domain provider panel.
</p>

<!-- DNS CARD -->
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f9fafb;border:1px solid #e5e7eb;border-radius:10px;margin-bottom:24px;">
<tr>
<td style="padding:20px;">

<table width="100%" style="margin-bottom:12px;">
<tr>
<td style="font-size:13px;color:#6b7280;">Record Type</td>
</tr>
<tr>
<td style="font-size:16px;font-weight:600;color:#111827;">${data.recordType}</td>
</tr>
</table>

<table width="100%" style="margin-bottom:12px;">
<tr>
<td style="font-size:13px;color:#6b7280;">Host / Name</td>
</tr>
<tr>
<td style="font-size:16px;font-weight:600;color:#111827;">${data.hostName}</td>
</tr>
</table>

<table width="100%">
<tr>
<td style="font-size:13px;color:#6b7280;">Value / Target</td>
</tr>
<tr>
<td style="font-size:16px;font-weight:600;color:#111827;font-family:monospace;word-break:break-all;">
${data.value}
</td>
</tr>
</table>

</td>
</tr>
</table>

<!-- INFO BOX -->
<table width="100%" style="background:#ecfeff;border-left:4px solid #06b6d4;border-radius:8px;margin-bottom:24px;">
<tr>
<td style="padding:16px;font-size:14px;color:#0e7490;">
DNS changes may take up to 24 hours to propagate.
</td>
</tr>
</table>

<!-- SUPPORT -->
<table width="100%" style="border-top:1px solid #e5e7eb;padding-top:20px;">
<tr>
<td style="font-size:13px;color:#6b7280;">
Need help? Contact support:<br>
Email: <a href="mailto:${data.smtpFromEmail}" style="color:#2563eb;text-decoration:none;">${data.smtpFromEmail}</a><br>
WhatsApp: ${data.tenantWhatsapp || 'Contact Admin'}
</td>
</tr>
</table>

</td>
</tr>

<!-- FOOTER -->
<tr>
<td style="background:#f9fafb;padding:20px;text-align:center;border-radius:0 0 12px 12px;">
<p style="margin:0;font-size:12px;color:#9ca3af;">
© ${new Date().getFullYear()} ${data.tenantName}. All rights reserved.
</p>
</td>
</tr>

</table>
</td>
</tr>
</table>

</body>
</html>
`,
  };
}
