export const verificationTokenEmailTemplate = `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html dir="ltr" lang="en">
  <head>
    <meta content="text/html; charset=UTF-8" http-equiv="Content-Type" />
    <meta name="x-apple-disable-message-reformatting" />
  </head>
  <body style="background-color:rgb(245,248,245);margin:0;padding:0">
    <table border="0" width="100%" cellpadding="0" cellspacing="0" role="presentation" align="center">
      <tbody>
        <tr>
          <td style='background-color:rgb(245,248,245);font-family:-apple-system,BlinkMacSystemFont,"Segoe UI","Roboto","Helvetica Neue",sans-serif;color:rgb(33,33,33)'>

            <!-- Hidden preview text -->
            <div style="display:none;overflow:hidden;line-height:1px;opacity:0;max-height:0;max-width:0" data-skip-in-text="true">
              Your NutriAi verification code is inside
            </div>

            <table align="center" width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation"
              style="max-width:560px;padding:20px;margin:0 auto;background-color:rgb(238,242,238)">
              <tbody>
                <tr style="width:100%">
                  <td>
                    <table align="center" width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation"
                      style="background-color:rgb(255,255,255);border-radius:12px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,0.08)">
                      <tbody>
                        <tr>
                          <td>

                            <!-- Header with brand color -->
                            <table align="center" width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation"
                              style="background-color:rgb(15,26,15);padding:28px 20px;text-align:center">
                              <tbody>
                                <tr>
                                  <td>
                                    <!-- SVG Logo inline -->
                                    <div style="display:inline-block;margin-bottom:10px">
                                      <svg width="44" height="40" viewBox="0 0 120 110" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <ellipse cx="60" cy="72" rx="38" ry="24" fill="#2d7a2d"/>
                                        <path d="M46 62 C42 52 36 44 34 32" stroke="#22a84a" stroke-width="3" stroke-linecap="round"/>
                                        <path d="M40 50 C36 44 30 40 26 34" stroke="#22a84a" stroke-width="2.5" stroke-linecap="round"/>
                                        <ellipse cx="33" cy="31" rx="7" ry="3.5" fill="#22a84a" transform="rotate(-30 33 31)"/>
                                        <path d="M58 60 C57 50 55 38 54 24" stroke="#e67e22" stroke-width="5" stroke-linecap="round"/>
                                        <path d="M62 60 C63 50 65 38 66 24" stroke="#e67e22" stroke-width="5" stroke-linecap="round"/>
                                        <path d="M55 24 C57 16 63 16 65 24" fill="#e67e22"/>
                                        <path d="M60 24 C58 14 52 8 48 6" stroke="#22a84a" stroke-width="2.5" stroke-linecap="round"/>
                                        <path d="M60 24 C62 12 68 8 72 5" stroke="#22a84a" stroke-width="2.5" stroke-linecap="round"/>
                                        <circle cx="36" cy="90" r="13" fill="#c0392b"/>
                                        <circle cx="36" cy="90" r="9" fill="#e74c3c"/>
                                        <circle cx="84" cy="90" r="13" fill="#c0392b"/>
                                        <circle cx="84" cy="90" r="9" fill="#e74c3c"/>
                                      </svg>
                                    </div>
                                    <div>
                                      <span style="font-size:26px;font-weight:900;color:rgb(255,255,255);letter-spacing:-0.03em;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif">
                                        Nutri<span style="color:rgb(34,197,94)">Ai</span>
                                      </span>
                                    </div>
                                    <p style="color:rgb(120,180,120);font-size:12px;margin:4px 0 0;letter-spacing:1.5px;text-transform:uppercase;font-weight:600">
                                      Your AI Nutrition Partner
                                    </p>
                                  </td>
                                </tr>
                              </tbody>
                            </table>

                            <!-- Body -->
                            <table align="center" width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation"
                              style="padding:32px 35px 24px">
                              <tbody>
                                <tr>
                                  <td>
                                    <h1 style="color:rgb(15,26,15);font-size:22px;font-weight:800;margin:0 0 12px;letter-spacing:-0.02em">
                                      Verify your email address
                                    </h1>
                                    <p style="font-size:14px;line-height:24px;color:rgb(80,100,80);margin:0 0 24px">
                                      Thanks for signing up for NutriAi! To complete your registration and start tracking your nutrition journey, please enter the verification code below.
                                    </p>
                                    <p style="font-size:14px;line-height:24px;color:rgb(80,100,80);margin:0 0 8px">
                                      If you didn&#x27;t create a NutriAi account, you can safely ignore this email.
                                    </p>

                                    <!-- Code box -->
                                    <table align="center" width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation"
                                      style="margin:28px 0">
                                      <tbody>
                                        <tr>
                                          <td style="text-align:center">
                                            <div style="display:inline-block;background:rgb(240,250,240);border:2px solid rgb(34,197,94);border-radius:12px;padding:20px 40px">
                                              <p style="font-size:11px;font-weight:800;color:rgb(100,140,100);margin:0 0 8px;letter-spacing:2px;text-transform:uppercase">
                                                Verification Code
                                              </p>
                                              <p style="font-size:42px;font-weight:900;color:rgb(15,26,15);margin:0;letter-spacing:8px;font-family:'Courier New',monospace">
                                                {verificationToken}
                                              </p>
                                              <p style="font-size:12px;color:rgb(130,160,130);margin:10px 0 0">
                                                Valid for <strong>15 minutes</strong>
                                              </p>
                                            </div>
                                          </td>
                                        </tr>
                                      </tbody>
                                    </table>

                                    <p style="font-size:13px;line-height:22px;color:rgb(130,150,130);margin:0;background:rgb(248,252,248);border-left:3px solid rgb(34,197,94);padding:12px 16px;border-radius:0 8px 8px 0">
                                      🔒 NutriAi will never ask you to share this code with anyone. If you did not request this, please ignore this email.
                                    </p>
                                  </td>
                                </tr>
                              </tbody>
                            </table>

                            <hr style="width:100%;border:none;border-top:1px solid rgb(230,240,230);margin:0" />

                            <!-- Footer -->
                            <table align="center" width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation"
                              style="padding:20px 35px">
                              <tbody>
                                <tr>
                                  <td>
                                    <p style="font-size:12px;line-height:20px;color:rgb(160,180,160);margin:0">
                                      NutriAi will never email you asking for your password or payment information.
                                    </p>
                                  </td>
                                </tr>
                              </tbody>
                            </table>

                          </td>
                        </tr>
                      </tbody>
                    </table>

                    <!-- Bottom footer -->
                    <p style="font-size:11px;line-height:20px;color:rgb(140,160,140);margin:20px 0 0;text-align:center;padding:0 20px">
                      &copy; 2026 NutriAi. All rights reserved.<br/>
                      Campus 15, KIIT University, Bhubaneswar, Odisha, India &mdash; 751024
                    </p>
                  </td>
                </tr>
              </tbody>
            </table>

          </td>
        </tr>
      </tbody>
    </table>
  </body>
</html>`;




export const WELCOME_EMAIL_TEMPLATE = `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html dir="ltr" lang="en">
  <head>
    <meta content="text/html; charset=UTF-8" http-equiv="Content-Type" />
    <meta name="x-apple-disable-message-reformatting" />
  </head>
  <body style="background-color:rgb(245,248,245);margin:0;padding:0">
    <table border="0" width="100%" cellpadding="0" cellspacing="0" role="presentation" align="center">
      <tbody>
        <tr>
          <td style="background-color:rgb(245,248,245);font-family:-apple-system,BlinkMacSystemFont,'Segoe UI','Roboto','Helvetica Neue',sans-serif">

            <!-- Hidden preview text -->
            <div style="display:none;overflow:hidden;line-height:1px;opacity:0;max-height:0;max-width:0" data-skip-in-text="true">
              Welcome to NutriAi — your AI nutrition journey starts now!
            </div>

            <table align="center" width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation"
              style="max-width:560px;margin:0 auto;padding:20px;background-color:rgb(238,242,238)">
              <tbody>
                <tr style="width:100%">
                  <td>
                    <table align="center" width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation"
                      style="background-color:rgb(255,255,255);border-radius:12px;overflow:hidden;box-shadow:0 4px 20px rgba(0,0,0,0.08)">
                      <tbody>
                        <tr>
                          <td>

                            <!-- Header -->
                            <table align="center" width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation"
                              style="background-color:rgb(15,26,15);padding:28px 20px;text-align:center">
                              <tbody>
                                <tr>
                                  <td>
                                    <div style="display:inline-block;margin-bottom:10px">
                                      <svg width="44" height="40" viewBox="0 0 120 110" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <ellipse cx="60" cy="72" rx="38" ry="24" fill="#2d7a2d"/>
                                        <path d="M46 62 C42 52 36 44 34 32" stroke="#22a84a" stroke-width="3" stroke-linecap="round"/>
                                        <path d="M40 50 C36 44 30 40 26 34" stroke="#22a84a" stroke-width="2.5" stroke-linecap="round"/>
                                        <ellipse cx="33" cy="31" rx="7" ry="3.5" fill="#22a84a" transform="rotate(-30 33 31)"/>
                                        <path d="M58 60 C57 50 55 38 54 24" stroke="#e67e22" stroke-width="5" stroke-linecap="round"/>
                                        <path d="M62 60 C63 50 65 38 66 24" stroke="#e67e22" stroke-width="5" stroke-linecap="round"/>
                                        <path d="M55 24 C57 16 63 16 65 24" fill="#e67e22"/>
                                        <path d="M60 24 C58 14 52 8 48 6" stroke="#22a84a" stroke-width="2.5" stroke-linecap="round"/>
                                        <path d="M60 24 C62 12 68 8 72 5" stroke="#22a84a" stroke-width="2.5" stroke-linecap="round"/>
                                        <circle cx="36" cy="90" r="13" fill="#c0392b"/>
                                        <circle cx="36" cy="90" r="9" fill="#e74c3c"/>
                                        <circle cx="84" cy="90" r="13" fill="#c0392b"/>
                                        <circle cx="84" cy="90" r="9" fill="#e74c3c"/>
                                      </svg>
                                    </div>
                                    <div>
                                      <span style="font-size:26px;font-weight:900;color:rgb(255,255,255);letter-spacing:-0.03em;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif">
                                        Nutri<span style="color:rgb(34,197,94)">Ai</span>
                                      </span>
                                    </div>
                                    <p style="color:rgb(120,180,120);font-size:12px;margin:4px 0 0;letter-spacing:1.5px;text-transform:uppercase;font-weight:600">
                                      Your AI Nutrition Partner
                                    </p>
                                  </td>
                                </tr>
                              </tbody>
                            </table>

                            <!-- Body -->
                            <table align="center" width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation"
                              style="padding:32px 35px 24px">
                              <tbody>
                                <tr>
                                  <td>
                                    <h1 style="color:rgb(15,26,15);font-size:22px;font-weight:800;margin:0 0 16px;letter-spacing:-0.02em">
                                      Welcome to NutriAi, {name}! 🎉
                                    </h1>
                                    <p style="font-size:14px;line-height:24px;color:rgb(80,100,80);margin:0 0 16px">
                                      Your account is all set. We&#x27;re thrilled to have you on board — NutriAi uses AI to help you track your meals, hit your macro goals, and build lasting healthy habits.
                                    </p>
                                    <p style="font-size:14px;line-height:24px;color:rgb(80,100,80);margin:0 0 28px">
                                      Here&#x27;s what you can do right now:
                                    </p>

                                    <!-- Feature list -->
                                    <table width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation" style="margin-bottom:28px">
                                      <tbody>
                                        <tr>
                                          <td style="padding:10px 0;border-bottom:1px solid rgb(240,248,240)">
                                            <span style="font-size:20px;margin-right:10px">🎯</span>
                                            <span style="font-size:14px;color:rgb(50,80,50);font-weight:600">Set your fitness goal</span>
                                            <span style="font-size:13px;color:rgb(120,150,120);display:block;margin-left:32px">Lose weight, build muscle, or maintain — we&#x27;ll build your plan</span>
                                          </td>
                                        </tr>
                                        <tr>
                                          <td style="padding:10px 0;border-bottom:1px solid rgb(240,248,240)">
                                            <span style="font-size:20px;margin-right:10px">🔍</span>
                                            <span style="font-size:14px;color:rgb(50,80,50);font-weight:600">Search any food instantly</span>
                                            <span style="font-size:13px;color:rgb(120,150,120);display:block;margin-left:32px">Type a dish name and get accurate macros in seconds</span>
                                          </td>
                                        </tr>
                                        <tr>
                                          <td style="padding:10px 0">
                                            <span style="font-size:20px;margin-right:10px">📊</span>
                                            <span style="font-size:14px;color:rgb(50,80,50);font-weight:600">Track your daily progress</span>
                                            <span style="font-size:13px;color:rgb(120,150,120);display:block;margin-left:32px">See calories, protein, carbs and fat at a glance</span>
                                          </td>
                                        </tr>
                                      </tbody>
                                    </table>

                                    <!-- CTA Button -->
                                    <table align="center" width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation"
                                      style="text-align:center;margin-bottom:28px">
                                      <tbody>
                                        <tr>
                                          <td>
                                            <a href="${process.env.CLIENT_URL || 'http://localhost:5173'}"
                                              style="display:inline-block;background:#000000;color:#ffffff;font-size:15px;font-weight:800;text-decoration:none;padding:14px 36px;border-radius:10px;letter-spacing:0.02em"
                                              target="_blank">
                                              Start Tracking Now &rsaquo;
                                            </a>
                                          </td>
                                        </tr>
                                      </tbody>
                                    </table>

                                    <p style="font-size:14px;line-height:24px;color:rgb(80,100,80);margin:0">
                                      Happy tracking,<br/>
                                      <strong style="color:rgb(15,26,15)">The NutriAi Team</strong>
                                    </p>
                                  </td>
                                </tr>
                              </tbody>
                            </table>

                            <hr style="width:100%;border:none;border-top:1px solid rgb(230,240,230);margin:0" />

                            <!-- Footer -->
                            <table align="center" width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation"
                              style="padding:20px 35px">
                              <tbody>
                                <tr>
                                  <td>
                                    <p style="font-size:12px;line-height:20px;color:rgb(160,180,160);margin:0">
                                      You&#x27;re receiving this email because you created a NutriAi account. If this wasn&#x27;t you, please ignore this email.
                                    </p>
                                  </td>
                                </tr>
                              </tbody>
                            </table>

                          </td>
                        </tr>
                      </tbody>
                    </table>

                    <!-- Bottom footer -->
                    <p style="font-size:11px;line-height:20px;color:rgb(140,160,140);margin:20px 0 0;text-align:center;padding:0 20px">
                      &copy; 2026 NutriAi. All rights reserved.<br/>
                      Campus 15, KIIT University, Bhubaneswar, Odisha, India &mdash; 751024
                    </p>

                  </td>
                </tr>
              </tbody>
            </table>
          </td>
        </tr>
      </tbody>
    </table>
  </body>
</html>`;


export const PASSWORD_RESET_EMAIL_TEMPLATE = `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html dir="ltr" lang="en">
  <head>
    <meta content="text/html; charset=UTF-8" http-equiv="Content-Type" />
    <meta name="x-apple-disable-message-reformatting" />
  </head>
  <body style="margin:0;padding:0;background-color:#f0f4f0">
    <table width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation">
      <tbody><tr><td align="center" style="padding:40px 16px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',sans-serif">

        <!-- Card -->
        <table width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation" style="max-width:480px;background:#ffffff;border-radius:16px;overflow:hidden">
          <tbody>

            <!-- Top accent bar -->
            <tr><td style="height:4px;background:linear-gradient(90deg,#16a34a,#22c55e,#4ade80)"></td></tr>

            <!-- Body -->
            <tr><td style="padding:44px 44px 36px">

              <!-- Brand -->
              <table width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation" style="margin-bottom:36px">
                <tbody><tr>
                  <td>
                    <span style="font-size:22px;font-weight:900;color:#0f1a0f;letter-spacing:-0.03em">Nutri<span style="color:#16a34a">Ai</span></span>
                  </td>
                  <td align="right">
                    <span style="font-size:11px;font-weight:700;color:#86a886;letter-spacing:1.5px;text-transform:uppercase">Password Reset</span>
                  </td>
                </tr></tbody>
              </table>

              <!-- Lock icon -->
              <table width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation" style="margin-bottom:28px">
                <tbody><tr><td align="center">
                  <div style="display:inline-block;width:64px;height:64px;background:#f0fdf4;border-radius:50%;text-align:center;line-height:64px;font-size:28px">🔐</div>
                </td></tr></tbody>
              </table>

              <!-- Heading -->
              <h1 style="margin:0 0 12px;font-size:24px;font-weight:800;color:#0f1a0f;text-align:center;letter-spacing:-0.02em">Reset your password</h1>
              <p style="margin:0 0 32px;font-size:14px;line-height:22px;color:#6b7f6b;text-align:center">
                Someone requested a password reset for your NutriAi account.<br/>This link expires in <strong style="color:#0f1a0f">1 hour</strong>.
              </p>

              <!-- CTA Button -->
              <table width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation" style="margin-bottom:32px">
                <tbody><tr><td align="center">
                  <a href="{resetURL}" target="_blank"
                    style="display:inline-block;background:#16a34a;color:#ffffff;font-size:15px;font-weight:800;text-decoration:none;padding:15px 48px;border-radius:50px;letter-spacing:0.01em">
                    Reset Password
                  </a>
                </td></tr></tbody>
              </table>

              <!-- Divider -->
              <table width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation" style="margin-bottom:24px">
                <tbody><tr>
                  <td style="border-top:1px solid #e8f0e8"></td>
                </tr></tbody>
              </table>

              <!-- Warning -->
              <table width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation" style="margin-bottom:24px">
                <tbody><tr>
                  <td style="background:#fffbeb;border-radius:8px;padding:14px 16px">
                    <p style="margin:0;font-size:12px;line-height:20px;color:#92740a">
                      <strong>Didn't request this?</strong> You can safely ignore this email — your password won't change.
                    </p>
                  </td>
                </tr></tbody>
              </table>

              <!-- Fallback link -->
              <p style="margin:0;font-size:11px;line-height:18px;color:#9eb09e;text-align:center">
                Button not working? Copy and paste this link:<br/>
                <span style="color:#16a34a;word-break:break-all">{resetURL}</span>
              </p>

            </td></tr>

            <!-- Footer -->
            <tr><td style="padding:20px 44px;background:#f8faf8;border-top:1px solid #eaf2ea">
              <p style="margin:0;font-size:11px;line-height:18px;color:#9eb09e;text-align:center">
                &copy; 2026 NutriAi &nbsp;&middot;&nbsp; Campus 15, KIIT University, Bhubaneswar, Odisha 751024<br/>
                NutriAi will never ask for your password via email.
              </p>
            </td></tr>

          </tbody>
        </table>

      </td></tr></tbody>
    </table>
  </body>
</html>`;