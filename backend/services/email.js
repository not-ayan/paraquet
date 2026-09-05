const { Resend } = require('resend');

const apiKey = process.env.RESEND_API_KEY;
const fromEmail = process.env.RESEND_FROM_EMAIL || 'Tezpur University Equipment Desk <onboarding@resend.dev>';
const portalUrl = process.env.PORTAL_URL || 'http://localhost:3000';

const resend = new Resend(apiKey);

/**
 * Clean, branded transactional HTML email template wrapper
 */
function renderEmailLayout({ title, badge, badgeColor, badgeBg, greeting, message, details = [], ctaText, ctaUrl, alertBox }) {
  const detailsHtml = details.length > 0 ? `
    <table style="width: 100%; border-collapse: collapse; margin: 20px 0; background: #f8fafc; border-radius: 8px; overflow: hidden; border: 1px solid #e2e8f0;">
      <tbody>
        ${details.map(([label, value]) => `
          <tr style="border-bottom: 1px solid #e2e8f0;">
            <td style="padding: 10px 14px; font-size: 13px; color: #64748b; font-weight: 600; width: 35%;">${label}</td>
            <td style="padding: 10px 14px; font-size: 13px; color: #0f172a; font-weight: 600;">${value}</td>
          </tr>
        `).join('')}
      </tbody>
    </table>
  ` : '';

  const alertHtml = alertBox ? `
    <div style="margin: 18px 0; padding: 14px; border-radius: 8px; background: ${alertBox.bg || '#fff5f5'}; border: 1px solid ${alertBox.border || '#fecdd3'}; color: ${alertBox.color || '#9f1239'}; font-size: 13px; line-height: 1.5;">
      <strong>${alertBox.title || 'Notice'}:</strong> ${alertBox.text}
    </div>
  ` : '';

  const ctaHtml = ctaText && ctaUrl ? `
    <div style="margin: 26px 0 10px 0; text-align: center;">
      <a href="${ctaUrl}" style="background: #0f172a; color: #ffffff; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-size: 14px; font-weight: 700; display: inline-block;">
        ${ctaText} &rarr;
      </a>
    </div>
  ` : '';

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="margin: 0; padding: 24px; background-color: #f1f5f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1e293b;">
        <div style="max-width: 580px; margin: 0 auto; background: #ffffff; border-radius: 14px; overflow: hidden; border: 1px solid #e2e8f0; box-shadow: 0 4px 12px rgba(0,0,0,0.04);">
          <!-- Header -->
          <div style="background: #0f172a; padding: 22px 28px; display: flex; align-items: center; justify-content: space-between;">
            <div style="color: #ffffff; font-size: 16px; font-weight: 800; letter-spacing: -0.02em;">
              TEZPUR UNIVERSITY <span style="font-size: 11px; background: rgba(99, 102, 241, 0.3); color: #a5b4fc; padding: 2px 6px; border-radius: 4px; font-family: monospace;">CAMPUS LENDING</span>
            </div>
          </div>

          <!-- Body Content -->
          <div style="padding: 30px 28px;">
            ${badge ? `
              <div style="margin-bottom: 12px;">
                <span style="display: inline-block; padding: 3px 10px; border-radius: 999px; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.04em; background: ${badgeBg || '#e0f2fe'}; color: ${badgeColor || '#0369a1'};">
                  ${badge}
                </span>
              </div>
            ` : ''}

            <h1 style="margin: 0 0 12px 0; font-size: 20px; font-weight: 800; color: #0f172a; letter-spacing: -0.02em;">
              ${title}
            </h1>

            ${greeting ? `<p style="margin: 0 0 12px 0; font-size: 14px; color: #475569;">Hello ${greeting},</p>` : ''}

            <p style="margin: 0 0 16px 0; font-size: 14px; line-height: 1.55; color: #334155;">
              ${message}
            </p>

            ${alertHtml}
            ${detailsHtml}
            ${ctaHtml}
          </div>

          <!-- Footer -->
          <div style="padding: 16px 28px; background: #f8fafc; border-top: 1px solid #e2e8f0; font-size: 11px; color: #94a3b8; text-align: center;">
            Automated notification from Tezpur University Equipment Lending Portal (Tezpur University, Assam) &bull; Please do not reply directly to this email.
          </div>
        </div>
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

  const html = renderEmailLayout({
    title: `Reservation Request: ${equipmentName}`,
    badge: 'Request Submitted',
    badgeBg: '#fef3c7',
    badgeColor: '#b45309',
    greeting: userName,
    message: `Your loan reservation request for <strong>${equipmentName}</strong> has been received and is currently under review by our campus equipment administrators.`,
    details: [
      ['Equipment', equipmentName],
      ['Category', equipment?.category || 'General'],
      ['Loan Period', `${startStr} – ${endStr}`],
      ['Pickup Location', booking.location || 'Tezpur University, Assam (Central Hub)'],
      ['Status', 'Pending Admin Approval'],
    ],
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
      ['Pickup Location', booking.location || 'Tezpur University, Assam (Central Hub)'],
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
    ctaUrl: `${portalUrl}/catalogue`,
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
      ['Drop-off Location', booking.location || 'Tezpur University, Assam (Central Hub)'],
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
      ['Return Location', booking.location || 'Tezpur University, Assam (Central Hub)'],
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
