require('dotenv').config();
const { Resend } = require('resend');

const apiKey = process.env.RESEND_API_KEY || 're_fallback';
const fromEmail = process.env.RESEND_FROM_EMAIL || 'Tezpur University Equipment Desk <onboarding@resend.dev>';
const portalUrl = process.env.PORTAL_URL || 'http://localhost:3000';

const resend = new Resend(apiKey);

/**
 * Clean, branded transactional HTML email template wrapper
 * Follows Paraquet studio aesthetic: #F5F5F3 canvas, #FFFFFF card, #111110 typography, #E5E5E0 borders
 */
function renderEmailLayout({ title, badge, badgeColor, badgeBg, greeting, message, details = [], ctaText, ctaUrl, alertBox }) {
  const detailsHtml = details.length > 0 ? `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin: 22px 0; background-color: #F8F8F6; border-radius: 16px; border: 1px solid #EAEAE5; overflow: hidden;">
      <tbody>
        ${details.map(([label, value], idx) => `
          <tr style="${idx !== details.length - 1 ? 'border-bottom: 1px solid #ECECE8;' : ''}">
            <td style="padding: 12px 18px; font-size: 12px; color: #70706B; font-weight: 600; width: 38%; vertical-align: middle;">${label}</td>
            <td style="padding: 12px 18px; font-size: 13px; color: #111110; font-weight: 700; vertical-align: middle;">${value}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  ` : '';

  const alertHtml = alertBox ? `
    <div style="margin: 20px 0; padding: 16px; border-radius: 14px; background-color: ${alertBox.bg || '#FFFBEB'}; border: 1px solid ${alertBox.border || '#FDE68A'}; color: ${alertBox.color || '#92400E'}; font-size: 13px; line-height: 1.55;">
      <div style="font-weight: 700; margin-bottom: 4px; font-size: 13px;">${alertBox.title || 'Notice'}</div>
      <div style="font-size: 12px; opacity: 0.95;">${alertBox.text}</div>
    </div>
  ` : '';

  const ctaHtml = ctaText && ctaUrl ? `
    <div style="margin: 28px 0 12px 0; text-align: center;">
      <a href="${ctaUrl}" style="background-color: #111110; color: #FFFFFF !important; padding: 13px 28px; border-radius: 9999px; text-decoration: none; font-size: 13px; font-weight: 700; display: inline-block; letter-spacing: -0.01em; box-shadow: 0 2px 6px rgba(0,0,0,0.08);">
        ${ctaText} &rarr;
      </a>
    </div>
  ` : '';

  return `
    <!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <meta http-equiv="X-UA-Compatible" content="IE=edge">
        <title>${title}</title>
      </head>
      <body style="margin: 0; padding: 32px 16px; background-color: #F5F5F3; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; color: #111110; -webkit-font-smoothing: antialiased;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width: 560px; margin: 0 auto; background-color: #FFFFFF; border-radius: 24px; border: 1px solid #E5E5E0; overflow: hidden; box-shadow: 0 4px 20px rgba(0, 0, 0, 0.04);">
          
          <!-- Header Bar -->
          <tr>
            <td style="padding: 24px 32px 20px 32px; border-bottom: 1px solid #F0F0EC;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="left" style="vertical-align: middle;">
                    <span style="font-size: 20px; font-weight: 800; color: #111110; letter-spacing: -0.03em; text-decoration: none;">
                      paraquet
                    </span>
                  </td>
                  <td align="right" style="vertical-align: middle;">
                    <span style="display: inline-block; padding: 3px 10px; border-radius: 9999px; font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; background-color: #F5F5F3; color: #70706B; border: 1px solid #E5E5E0;">
                      Tezpur University
                    </span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Main Body -->
          <tr>
            <td style="padding: 32px 32px 28px 32px;">
              ${badge ? `
                <div style="margin-bottom: 14px;">
                  <span style="display: inline-block; padding: 4px 12px; border-radius: 9999px; font-size: 11px; font-weight: 700; letter-spacing: 0.01em; background-color: ${badgeBg || '#E8F5EB'}; color: ${badgeColor || '#1B7A42'}; border: 1px solid rgba(0,0,0,0.05);">
                    ${badge}
                  </span>
                </div>
              ` : ''}

              <h1 style="margin: 0 0 14px 0; font-size: 21px; font-weight: 800; color: #111110; letter-spacing: -0.025em; line-height: 1.25;">
                ${title}
              </h1>

              ${greeting ? `<p style="margin: 0 0 10px 0; font-size: 14px; font-weight: 600; color: #40403C;">Hello ${greeting},</p>` : ''}

              <p style="margin: 0 0 16px 0; font-size: 13.5px; line-height: 1.6; color: #555550;">
                ${message}
              </p>

              ${alertHtml}
              ${detailsHtml}
              ${ctaHtml}
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding: 20px 32px; background-color: #FAFAF8; border-top: 1px solid #F0F0EC; font-size: 11px; line-height: 1.55; color: #8E8E88; text-align: center;">
              <p style="margin: 0 0 6px 0; font-weight: 600; color: #70706B;">
                Tezpur University Equipment Desk &bull; Napaam, Tezpur, Assam 784028
              </p>
              <p style="margin: 0; color: #A1A19A;">
                Automated notification from the Paraquet campus network. Please do not reply directly to this email.
              </p>
            </td>
          </tr>

        </table>
      </body>
    </html>
  `;
}

/**
 * Helper to execute email dispatch safely via Resend
 */
async function sendEmail({ to, subject, html }) {
  if (!to) {
    console.warn('[Resend Email] No recipient email provided. Skipping email send.');
    return { success: false, reason: 'no_recipient' };
  }

  try {
    const payload = {
      from: fromEmail,
      to: [to],
      subject,
      html,
    };

    const res = await resend.emails.send(payload);
    if (res.error) {
      console.warn(`[Resend Email] Resend API notice for ${to}:`, res.error.message || res.error);
      return { success: false, error: res.error };
    }

    console.log(`[Resend Email] Delivered successfully to ${to}: id=${res.data?.id}`);
    return { success: true, id: res.data?.id };
  } catch (err) {
    console.warn(`[Resend Email] Error dispatching to ${to}:`, err.message);
    return { success: false, error: err.message };
  }
}

/**
 * 1. Booking Request Submitted
 */
async function sendBookingRequestedEmail({ user, equipment, booking }) {
  const userName = user?.name || 'Student';
  const equipmentName = equipment?.name || 'Equipment';
  const startStr = new Date(booking.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  const endStr = new Date(booking.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  const pickupLocation = booking.location || equipment?.location || 'Tezpur University, Assam (Central Lab)';

  const details = [
    ['Equipment', equipmentName],
    ['Category', equipment?.category || 'General'],
    ['Loan Period', `${startStr} – ${endStr}`],
    ['Pickup Location', pickupLocation],
  ];

  if (booking.purpose) {
    details.push(['Project Purpose', booking.purpose]);
  }
  details.push(['Status', 'Pending Admin Approval']);

  const html = renderEmailLayout({
    title: `Reservation Request: ${equipmentName}`,
    badge: 'Request Submitted',
    badgeBg: '#fef3c7',
    badgeColor: '#b45309',
    greeting: userName,
    message: `Your loan reservation request for <strong>${equipmentName}</strong> has been received and is currently under review by our campus equipment administrators.`,
    details,
    ctaText: 'View Booking Status',
    ctaUrl: `${portalUrl}/dashboard`,
  });

  return sendEmail({
    to: user?.email,
    subject: `📋 Request Received: ${equipmentName} Reservation`,
    html,
  });
}

/**
 * 2. Booking Approved
 */
async function sendBookingApprovedEmail({ user, equipment, booking }) {
  const userName = user?.name || 'Student';
  const equipmentName = equipment?.name || 'Equipment';
  const startStr = new Date(booking.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  const endStr = new Date(booking.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  const pickupLocation = booking.location || equipment?.location || 'Tezpur University, Assam (Central Lab)';

  const html = renderEmailLayout({
    title: `Booking Approved: ${equipmentName}`,
    badge: 'Approved',
    badgeBg: '#dcfce7',
    badgeColor: '#15803d',
    greeting: userName,
    message: `Great news! Your equipment reservation for <strong>${equipmentName}</strong> has been approved. You can pick up the item on your scheduled start date.`,
    alertBox: {
      bg: '#eff6ff',
      border: '#bfdbfe',
      color: '#1e40af',
      title: 'Pickup Instruction',
      text: 'When collecting the equipment at the desk, remember to capture a quick baseline inspection photo using the portal camera before taking custody.',
    },
    details: [
      ['Equipment', equipmentName],
      ['Pickup Window', `${startStr} – ${endStr}`],
      ['Pickup Location', pickupLocation],
      ['Max Duration', `${equipment?.maxBorrowDays || 3} Days`],
      ['Status', 'Approved (Awaiting Pickup)'],
    ],
    ctaText: 'Check-In & Pickup',
    ctaUrl: `${portalUrl}/dashboard`,
  });

  return sendEmail({
    to: user?.email,
    subject: `🎉 Booking Approved: ${equipmentName} Ready for Pickup`,
    html,
  });
}

/**
 * 3. Booking Rejected
 */
async function sendBookingRejectedEmail({ user, equipment, booking, reason }) {
  const userName = user?.name || 'Student';
  const equipmentName = equipment?.name || 'Equipment';

  const html = renderEmailLayout({
    title: `Booking Update: ${equipmentName}`,
    badge: 'Request Declined',
    badgeBg: '#fee2e2',
    badgeColor: '#b91c1c',
    greeting: userName,
    message: `Thank you for your reservation request. Unfortunately, your booking for <strong>${equipmentName}</strong> could not be accommodated at this time.`,
    alertBox: reason ? {
      bg: '#fff5f5',
      border: '#fecdd3',
      color: '#9f1239',
      title: 'Reason Provided',
      text: reason,
    } : undefined,
    details: [
      ['Equipment', equipmentName],
      ['Requested Dates', `${new Date(booking.startDate).toLocaleDateString()} – ${new Date(booking.endDate).toLocaleDateString()}`],
      ['Status', 'Rejected'],
    ],
    ctaText: 'Browse Available Equipment',
    ctaUrl: `${portalUrl}/equipment`,
  });

  return sendEmail({
    to: user?.email,
    subject: `Notice Regarding Your ${equipmentName} Reservation`,
    html,
  });
}

/**
 * 4. Pickup Confirmation (Loan Active)
 */
async function sendPickupConfirmedEmail({ user, equipment, booking }) {
  const userName = user?.name || 'Student';
  const equipmentName = equipment?.name || 'Equipment';
  const dueStr = new Date(booking.endDate).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });

  const html = renderEmailLayout({
    title: `Pickup Confirmed: ${equipmentName}`,
    badge: 'Loan Active',
    badgeBg: '#ede9fe',
    badgeColor: '#6d28d9',
    greeting: userName,
    message: `You have successfully collected <strong>${equipmentName}</strong> and your baseline handover photos have been recorded into our audit trail.`,
    alertBox: {
      bg: '#fffbeb',
      border: '#fde68a',
      color: '#92400e',
      title: 'Return Deadline',
      text: `Please return this item on or before <strong>${dueStr}</strong>. Late returns accrue an automated fee of ₹50/day.`,
    },
    details: [
      ['Equipment', equipmentName],
      ['Return Due Date', dueStr],
      ['Drop-off Location', booking.location || equipment?.location || 'Tezpur University, Assam (Central Lab)'],
      ['Condition Logged', (booking.pickupCondition?.condition || 'Good').toUpperCase()],
    ],
    ctaText: 'View Active Loan',
    ctaUrl: `${portalUrl}/dashboard`,
  });

  return sendEmail({
    to: user?.email,
    subject: `📤 Handover Complete: ${equipmentName} is Checked Out`,
    html,
  });
}

/**
 * 5. Return Confirmation
 */
async function sendReturnConfirmedEmail({ user, equipment, booking, aiVerdict, overdueFee = 0 }) {
  const userName = user?.name || 'Student';
  const equipmentName = equipment?.name || 'Equipment';
  const isFlagged = Boolean(aiVerdict?.flagged || booking.returnCondition?.aiFlagged);

  const statusBadge = isFlagged ? 'Under AI Review' : 'Return Completed';
  const badgeColor = isFlagged ? '#b45309' : '#15803d';
  const badgeBg = isFlagged ? '#fef3c7' : '#dcfce7';

  const details = [
    ['Equipment', equipmentName],
    ['Return Date', new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })],
    ['AI Similarity Score', `${Math.round((aiVerdict?.similarityScore || booking.returnCondition?.aiSimilarityScore || 0.9) * 100)}% Match`],
    ['Condition Check', isFlagged ? 'Discrepancy Flagged for Admin Review' : 'Verified Intact'],
  ];

  if (overdueFee > 0) {
    details.push(['Late Return Penalty', `₹${overdueFee}`]);
  }

  const alertBox = isFlagged ? {
    bg: '#fff5f5',
    border: '#fecdd3',
    color: '#9f1239',
    title: 'Gemini AI Vision Notice',
    text: aiVerdict?.detailedDiscrepancyReport || 'Physical discrepancies were detected between your pickup baseline and return photos. Our equipment team will review the photos.',
  } : {
    bg: '#f0fdf4',
    border: '#bbf7d0',
    color: '#15803d',
    title: 'Inspection Passed',
    text: 'Gemini Vision verified that the equipment matches the pickup baseline in satisfactory condition. Thank you for taking care of campus gear!',
  };

  const html = renderEmailLayout({
    title: `Return Receipt: ${equipmentName}`,
    badge: statusBadge,
    badgeBg,
    badgeColor,
    greeting: userName,
    message: `Your return check-in for <strong>${equipmentName}</strong> has been logged into the system.`,
    alertBox,
    details,
    ctaText: 'View Dashboard Receipt',
    ctaUrl: `${portalUrl}/dashboard`,
  });

  return sendEmail({
    to: user?.email,
    subject: isFlagged
      ? `⚠️ Return Logged with AI Review: ${equipmentName}`
      : `✅ Return Complete: ${equipmentName} Received`,
    html,
  });
}

/**
 * 6. Overdue / Delay Warning Alert
 */
async function sendOverdueWarningEmail({ user, equipment, booking, daysLate = 1, overdueFee = 50 }) {
  const userName = user?.name || 'Student';
  const equipmentName = equipment?.name || 'Equipment';
  const dueStr = new Date(booking.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

  const html = renderEmailLayout({
    title: `Overdue Equipment Notice: ${equipmentName}`,
    badge: 'Overdue Alert',
    badgeBg: '#fee2e2',
    badgeColor: '#b91c1c',
    greeting: userName,
    message: `Your loan for <strong>${equipmentName}</strong> was scheduled to be returned on <strong>${dueStr}</strong> and is currently <strong>${daysLate} ${daysLate === 1 ? 'day' : 'days'} overdue</strong>.`,
    alertBox: {
      bg: '#fff5f5',
      border: '#fecdd3',
      color: '#9f1239',
      title: 'Daily Late Penalty',
      text: `Late fees accrue at ₹50 per day. Current penalty: <strong>₹${overdueFee}</strong>. Please return the item promptly so other students can borrow it.`,
    },
    details: [
      ['Equipment', equipmentName],
      ['Original Due Date', dueStr],
      ['Days Past Due', `${daysLate} Days`],
      ['Accrued Penalty', `₹${overdueFee}`],
      ['Return Location', booking.location || equipment?.location || 'Tezpur University, Assam (Central Lab)'],
    ],
    ctaText: 'Start Return Process',
    ctaUrl: `${portalUrl}/dashboard`,
  });

  return sendEmail({
    to: user?.email,
    subject: `⚠️ URGENT: ${equipmentName} is Past Due (${daysLate}d Late)`,
    html,
  });
}

/**
 * 7. Condition Flag Resolution (Admin Verdict)
 */
async function sendConditionResolvedEmail({ user, equipment, booking, damageFee = 0, note = '' }) {
  const userName = user?.name || 'Student';
  const equipmentName = equipment?.name || 'Equipment';
  const hasFee = Number(damageFee) > 0;

  const html = renderEmailLayout({
    title: `Condition Inspection Resolved: ${equipmentName}`,
    badge: hasFee ? 'Damage Fee Applied' : 'Inspection Cleared',
    badgeBg: hasFee ? '#fee2e2' : '#dcfce7',
    badgeColor: hasFee ? '#b91c1c' : '#15803d',
    greeting: userName,
    message: hasFee
      ? `Our equipment administrators have reviewed the return photos for <strong>${equipmentName}</strong> and assessed a damage repair charge.`
      : `Our equipment administrators have reviewed the flagged return photos for <strong>${equipmentName}</strong> and cleared the incident with zero penalty.`,
    alertBox: note ? {
      bg: hasFee ? '#fff5f5' : '#f0fdf4',
      border: hasFee ? '#fecdd3' : '#bbf7d0',
      color: hasFee ? '#9f1239' : '#15803d',
      title: 'Administrator Note',
      text: note,
    } : undefined,
    details: [
      ['Equipment', equipmentName],
      ['Resolution Status', hasFee ? `Damage Fee of ₹${damageFee}` : 'Cleared — No Damage Fee'],
      ...(hasFee ? [['Damage Charge', `₹${damageFee}`]] : []),
    ],
    ctaText: 'View Incident Status',
    ctaUrl: `${portalUrl}/dashboard`,
  });

  return sendEmail({
    to: user?.email,
    subject: hasFee
      ? `Incident Notice: Damage Fee Applied for ${equipmentName}`
      : `Inspection Cleared: ${equipmentName} Return Finalized`,
    html,
  });
}

module.exports = {
  sendEmail,
  sendBookingRequestedEmail,
  sendBookingApprovedEmail,
  sendBookingRejectedEmail,
  sendPickupConfirmedEmail,
  sendReturnConfirmedEmail,
  sendOverdueWarningEmail,
  sendConditionResolvedEmail,
};
