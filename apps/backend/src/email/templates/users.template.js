// user Created TEMPLATE
export function userCreatedTemplate(data) {
  return {
    subject: `Welcome to ${data.tenantName} - Account Created`,
    html: `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>Welcome to ${data.tenantName}</title>
  <!--[if mso]>
  <style type="text/css">
    body, table, td {font-family: Arial, sans-serif !important;}
  </style>
  <![endif]-->
</head>

<body style="margin:0; padding:0; background-color:#f5f5f5; font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
  
  <!-- Wrapper -->
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#f5f5f5;">
    <tr>
      <td align="center" style="padding:20px 10px;">
        
        <!-- Main Container -->
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:600px; background:#ffffff; border-radius:12px; box-shadow:0 4px 16px rgba(0,0,0,0.08);">
          
          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding:32px 24px; text-align:center; border-radius:12px 12px 0 0;">
              <h1 style="margin:0; font-size:26px; color:#ffffff; font-weight:700; letter-spacing:-0.5px;">
                ${data.tenantName}
              </h1>
              <p style="margin:8px 0 0; font-size:14px; color:#e0e7ff; font-weight:500;">
                Welcome to the Team
              </p>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding:32px 24px;">
              
              <!-- Welcome Message -->
              <h2 style="margin:0 0 16px; font-size:22px; color:#1a1a1a; font-weight:600;">
                Hello ${data.userName || 'there'}! 👋
              </h2>
              
              <p style="margin:0 0 24px; font-size:15px; line-height:1.6; color:#4a4a4a;">
                Your user account has been created. Use the credentials below to access your account.
              </p>

              <!-- Credentials Card -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f9fafb; border:1px solid #e5e7eb; border-radius:10px; margin-bottom:20px;">
                <tr>
                  <td style="padding:20px;">
                    
                    <!-- user ID -->
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:12px;">
                      <tr>
                        <td style="font-size:13px; color:#6b7280; padding-bottom:4px;">user ID</td>
                      </tr>
                      <tr>
                        <td style="font-size:16px; color:#111827; font-weight:600;">${data.userNumber}</td>
                      </tr>
                    </table>

                   

                    <!-- Password -->
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                      <tr>
                        <td style="font-size:13px; color:#6b7280; padding-bottom:4px;">Temporary Password</td>
                      </tr>
                      <tr>
                        <td style="font-size:16px; color:#111827; font-weight:600; font-family:monospace; background:#ffffff; padding:8px 12px; border-radius:6px; display:inline-block;">${data.password}</td>
                      </tr>
                    </table>

                    <!-- Transaction Pin -->
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
                      <tr>
                        <td style="font-size:13px; color:#6b7280; padding-bottom:4px;">Temporary Transaction Pin</td>
                      </tr>
                      <tr>
                        <td style="font-size:16px; color:#111827; font-weight:600; font-family:monospace; background:#ffffff; padding:8px 12px; border-radius:6px; display:inline-block;">${data.transactionPin}</td>
                      </tr>
                    </table>

                  </td>
                </tr>
              </table>

              <!-- Security Alert -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#fef3c7; border-left:4px solid #f59e0b; border-radius:8px; margin-bottom:24px;">
                <tr>
                  <td style="padding:16px; font-size:14px; line-height:1.5; color:#92400e;">
                    <strong>🔒 Security Notice:</strong> Please change your password immediately after your first login.
                  </td>
                </tr>
              </table>

              <!-- CTA Button -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:24px;">
                <tr>
                  <td align="center">
                    <a href="${data.loginUrl}/login" 
                       style="display:inline-block; background:linear-gradient(135deg, #667eea 0%, #764ba2 100%); color:#ffffff; text-decoration:none; padding:14px 32px; border-radius:8px; font-size:15px; font-weight:600; box-shadow:0 4px 12px rgba(102,126,234,0.4);">
                      Sign In Now →
                    </a>
                  </td>
                </tr>
              </table>

              <!-- Support Info -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-top:1px solid #e5e7eb; padding-top:20px;">
                <tr>
                  <td style="font-size:13px; color:#6b7280; line-height:1.6;">
                    <strong style="color:#374151;">Need Help?</strong><br>
                    Email: <a href="mailto:${data.smtpFromEmail}" style="color:#667eea; text-decoration:none;">${data.smtpFromEmail}</a><br>
                    WhatsApp: ${data.tenantWhatsapp || 'Contact Admin'}
                  </td>
                </tr>
              </table>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#f9fafb; padding:20px 24px; text-align:center; border-radius:0 0 12px 12px; border-top:1px solid #e5e7eb;">
              <p style="margin:0; font-size:12px; color:#9ca3af; line-height:1.5;">
                © ${new Date().getFullYear()} ${data.tenantName}. All rights reserved.<br>
              </p>
            </td>
          </tr>

        </table>

        <!-- Email Client Support Text -->
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:600px; margin-top:16px;">
          <tr>
            <td style="text-align:center; font-size:11px; color:#9ca3af;">
              If the button doesn't work, copy this link:<br>
              <a href="${data.loginUrl || '#'}" style="color:#667eea; word-break:break-all;">${data.loginUrl || '#'}</a>
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

// user ACTIVATED TEMPLATE
export function userActivatedTemplate(data) {
  return {
    subject: `Account Activated - ${data.tenantName}`,
    html: `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>Account Activated</title>
</head>

<body style="margin:0; padding:0; background-color:#f5f5f5; font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
  
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#f5f5f5;">
    <tr>
      <td align="center" style="padding:20px 10px;">
        
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:600px; background:#ffffff; border-radius:12px; box-shadow:0 4px 16px rgba(0,0,0,0.08);">
          
          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg, #059669 0%, #10b981 100%); padding:32px 24px; text-align:center; border-radius:12px 12px 0 0;">
              
              <h1 style="margin:0; font-size:26px; color:#ffffff; font-weight:700; letter-spacing:-0.5px;">
                ${data.tenantName}
              </h1>
              <p style="margin:8px 0 0; font-size:14px; color:#d1fae5; font-weight:500;">
                Account Activated
              </p>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding:32px 24px;">
              
              <h2 style="margin:0 0 16px; font-size:22px; color:#1a1a1a; font-weight:600;">
                Welcome Back! 🎉
              </h2>
              
              <p style="margin:0 0 24px; font-size:15px; line-height:1.6; color:#4a4a4a;">
                Great news! Your user account has been successfully activated. You now have full access to the platform and can start using all features.
              </p>

              <!-- Status Card -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#ecfdf5; border:1px solid #a7f3d0; border-radius:10px; margin-bottom:24px;">
                <tr>
                  <td style="padding:20px; text-align:center;">
                    <div style="font-size:14px; color:#065f46; font-weight:600;">
                      ✓ Account Status: <span style="color:#059669;">ACTIVE</span>
                    </div>
                  </td>
                </tr>
              </table>

              <!-- CTA Button -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:24px;">
                <tr>
                  <td align="center">
                    <a href="${data.loginUrl || '#'}" 
                       style="display:inline-block; background:linear-gradient(135deg, #059669 0%, #10b981 100%); color:#ffffff; text-decoration:none; padding:14px 32px; border-radius:8px; font-size:15px; font-weight:600; box-shadow:0 4px 12px rgba(5,150,105,0.4);">
                      Access Dashboard →
                    </a>
                  </td>
                </tr>
              </table>

              <!-- Support Info -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-top:1px solid #e5e7eb; padding-top:20px;">
                <tr>
                  <td style="font-size:13px; color:#6b7280; line-height:1.6;">
                    <strong style="color:#374151;">Need Assistance?</strong><br>
                    Email: <a href="mailto:${data.smtpFromEmail}" style="color:#059669; text-decoration:none;">${data.smtpFromEmail}</a><br>
                    WhatsApp: ${data.tenantWhatsapp || 'Contact Support'}
                  </td>
                </tr>
              </table>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#f9fafb; padding:20px 24px; text-align:center; border-radius:0 0 12px 12px; border-top:1px solid #e5e7eb;">
              <p style="margin:0; font-size:12px; color:#9ca3af; line-height:1.5;">
                © ${new Date().getFullYear()} ${data.tenantName}. All rights reserved.<br>
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

// user INACTIVE TEMPLATE
export function userInactiveTemplate(data) {
  return {
    subject: `Account Status Update - ${data.tenantName}`,
    html: `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>Account Inactive</title>
</head>

<body style="margin:0; padding:0; background-color:#f5f5f5; font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
  
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#f5f5f5;">
    <tr>
      <td align="center" style="padding:20px 10px;">
        
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:600px; background:#ffffff; border-radius:12px; box-shadow:0 4px 16px rgba(0,0,0,0.08);">
          
          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg, #f59e0b 0%, #fbbf24 100%); padding:32px 24px; text-align:center; border-radius:12px 12px 0 0;">
              <h1 style="margin:0; font-size:26px; color:#ffffff; font-weight:700; letter-spacing:-0.5px;">
                ${data.tenantName}
              </h1>
              <p style="margin:8px 0 0; font-size:14px; color:#fef3c7; font-weight:500;">
                Account Status Update
              </p>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding:32px 24px;">
              
              <h2 style="margin:0 0 16px; font-size:22px; color:#1a1a1a; font-weight:600;">
                Account Inactive
              </h2>
              
              <p style="margin:0 0 24px; font-size:15px; line-height:1.6; color:#4a4a4a;">
                Your user account has been marked as inactive. This means your access to the platform is currently restricted.
              </p>

              <!-- Status Card -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#fffbeb; border:1px solid #fde68a; border-radius:10px; margin-bottom:20px;">
                <tr>
                  <td style="padding:20px; text-align:center;">
                    <div style="font-size:14px; color:#92400e; font-weight:600;">
                      ⏸ Account Status: <span style="color:#f59e0b;">INACTIVE</span>
                    </div>
                  </td>
                </tr>
              </table>

              ${
                data.actionReason
                  ? `
              <!-- Reason Box -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#fef3c7; border-left:4px solid #f59e0b; border-radius:8px; margin-bottom:24px;">
                <tr>
                  <td style="padding:16px; font-size:14px; line-height:1.5; color:#92400e;">
                    <strong>Reason:</strong> ${data.actionReason}
                  </td>
                </tr>
              </table>
              `
                  : ''
              }

              <!-- Info Box -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f9fafb; border:1px solid #e5e7eb; border-radius:8px; margin-bottom:24px;">
                <tr>
                  <td style="padding:18px; font-size:14px; line-height:1.6; color:#4a4a4a;">
                    <strong style="color:#1a1a1a;">What to do next?</strong><br>
                    Please contact your administrator or HR department for assistance in reactivating your account.
                  </td>
                </tr>
              </table>

              <!-- Support Info -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-top:1px solid #e5e7eb; padding-top:20px;">
                <tr>
                  <td style="font-size:13px; color:#6b7280; line-height:1.6;">
                    <strong style="color:#374151;">Contact Support</strong><br>
                    Email: <a href="mailto:${data.smtpFromEmail}" style="color:#f59e0b; text-decoration:none;">${data.smtpFromEmail}</a><br>
                    WhatsApp: ${data.tenantWhatsapp || 'Contact Admin'}
                  </td>
                </tr>
              </table>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#f9fafb; padding:20px 24px; text-align:center; border-radius:0 0 12px 12px; border-top:1px solid #e5e7eb;">
              <p style="margin:0; font-size:12px; color:#9ca3af; line-height:1.5;">
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

// user SUSPENDED TEMPLATE
export function userSuspendedTemplate(data) {
  return {
    subject: `Important: Account Suspended - ${data.tenantName}`,
    html: `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>Account Suspended</title>
</head>

<body style="margin:0; padding:0; background-color:#f5f5f5; font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
  
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#f5f5f5;">
    <tr>
      <td align="center" style="padding:20px 10px;">
        
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:600px; background:#ffffff; border-radius:12px; box-shadow:0 4px 16px rgba(0,0,0,0.08);">
          
          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg, #dc2626 0%, #ef4444 100%); padding:32px 24px; text-align:center; border-radius:12px 12px 0 0;">
              
              <h1 style="margin:0; font-size:26px; color:#ffffff; font-weight:700; letter-spacing:-0.5px;">
                ${data.tenantName}
              </h1>
              <p style="margin:8px 0 0; font-size:14px; color:#fee2e2; font-weight:500;">
                Account Suspended
              </p>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding:32px 24px;">
              
              <h2 style="margin:0 0 16px; font-size:22px; color:#1a1a1a; font-weight:600;">
                Account Suspended
              </h2>
              
              <p style="margin:0 0 24px; font-size:15px; line-height:1.6; color:#4a4a4a;">
                Your user account has been suspended due to administrative action or policy violation. Access to the platform has been temporarily restricted.
              </p>

              <!-- Status Card -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#fee2e2; border:1px solid #fca5a5; border-radius:10px; margin-bottom:20px;">
                <tr>
                  <td style="padding:20px; text-align:center;">
                    <div style="font-size:14px; color:#7f1d1d; font-weight:600;">
                      ⛔ Account Status: <span style="color:#dc2626;">SUSPENDED</span>
                    </div>
                  </td>
                </tr>
              </table>

              ${
                data.actionReason
                  ? `
              <!-- Reason Box -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#fef2f2; border-left:4px solid #dc2626; border-radius:8px; margin-bottom:24px;">
                <tr>
                  <td style="padding:16px; font-size:14px; line-height:1.5; color:#7f1d1d;">
                    <strong>Suspension Reason:</strong><br>
                    ${data.actionReason}
                  </td>
                </tr>
              </table>
              `
                  : ''
              }

              <!-- Warning Box -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f9fafb; border:1px solid #e5e7eb; border-radius:8px; margin-bottom:24px;">
                <tr>
                  <td style="padding:18px; font-size:14px; line-height:1.6; color:#4a4a4a;">
                    <strong style="color:#1a1a1a;">⚠️ Important Notice</strong><br>
                    Your access is temporarily restricted. Please contact your administrator or support team immediately for clarification and next steps.
                  </td>
                </tr>
              </table>

              <!-- Support Info -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-top:1px solid #e5e7eb; padding-top:20px;">
                <tr>
                  <td style="font-size:13px; color:#6b7280; line-height:1.6;">
                    <strong style="color:#374151;">Contact Support Immediately</strong><br>
                    Email: <a href="mailto:${data.smtpFromEmail}" style="color:#dc2626; text-decoration:none;">${data.smtpFromEmail}</a><br>
                    WhatsApp: ${data.tenantWhatsapp || 'Contact Admin'}
                  </td>
                </tr>
              </table>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#f9fafb; padding:20px 24px; text-align:center; border-radius:0 0 12px 12px; border-top:1px solid #e5e7eb;">
              <p style="margin:0; font-size:12px; color:#9ca3af; line-height:1.5;">
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

// user DELETED TEMPLATE
export function userDeletedTemplate(data) {
  return {
    subject: `Account Deleted - ${data.tenantName}`,
    html: `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta http-equiv="X-UA-Compatible" content="IE=edge">
  <title>Account Deleted</title>
</head>

<body style="margin:0; padding:0; background-color:#f5f5f5; font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;">
  
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#f5f5f5;">
    <tr>
      <td align="center" style="padding:20px 10px;">
        
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:600px; background:#ffffff; border-radius:12px; box-shadow:0 4px 16px rgba(0,0,0,0.08);">
          
          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg, #dc2626 0%, #ef4444 100%); padding:32px 24px; text-align:center; border-radius:12px 12px 0 0;">
              <h1 style="margin:0; font-size:26px; color:#ffffff; font-weight:700; letter-spacing:-0.5px;">
                ${data.tenantName}
              </h1>
              <p style="margin:8px 0 0; font-size:14px; color:#fee2e2; font-weight:500;">
                Account Status Update
              </p>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding:32px 24px;">
              
              <h2 style="margin:0 0 16px; font-size:22px; color:#1a1a1a; font-weight:600;">
                Account Deleted
              </h2>
              
              <p style="margin:0 0 24px; font-size:15px; line-height:1.6; color:#4a4a4a;">
                Your user account has been permanently deleted from the platform. You no longer have access to this account or its associated data.
              </p>

              <!-- Status Card -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#fef2f2; border:1px solid #fecaca; border-radius:10px; margin-bottom:20px;">
                <tr>
                  <td style="padding:20px; text-align:center;">
                    <div style="font-size:14px; color:#991b1b; font-weight:600;">
                      🗑 Account Status: <span style="color:#dc2626;">DELETED</span>
                    </div>
                  </td>
                </tr>
              </table>

              ${
                data.actionReason
                  ? `
              <!-- Reason Box -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#fee2e2; border-left:4px solid #dc2626; border-radius:8px; margin-bottom:24px;">
                <tr>
                  <td style="padding:16px; font-size:14px; line-height:1.5; color:#7f1d1d;">
                    <strong>Reason:</strong> ${data.actionReason}
                  </td>
                </tr>
              </table>
              `
                  : ''
              }

              <!-- Info Box -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f9fafb; border:1px solid #e5e7eb; border-radius:8px; margin-bottom:24px;">
                <tr>
                  <td style="padding:18px; font-size:14px; line-height:1.6; color:#4a4a4a;">
                    <strong style="color:#1a1a1a;">What to do next?</strong><br>
                    If you believe this action was taken in error or need further clarification, please contact your administrator or support team immediately.
                  </td>
                </tr>
              </table>

              <!-- Support Info -->
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-top:1px solid #e5e7eb; padding-top:20px;">
                <tr>
                  <td style="font-size:13px; color:#6b7280; line-height:1.6;">
                    <strong style="color:#374151;">Contact Support</strong><br>
                    Email: <a href="mailto:${data.smtpFromEmail}" style="color:#dc2626; text-decoration:none;">${data.smtpFromEmail}</a><br>
                    WhatsApp: ${data.tenantWhatsapp || 'Contact Admin'}
                  </td>
                </tr>
              </table>

            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#f9fafb; padding:20px 24px; text-align:center; border-radius:0 0 12px 12px; border-top:1px solid #e5e7eb;">
              <p style="margin:0; font-size:12px; color:#9ca3af; line-height:1.5;">
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
