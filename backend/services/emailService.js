const nodemailer = require("nodemailer");

let transporter;

function getTransporter() {
  const host = String(process.env.EMAIL_HOST || "smtp.gmail.com").trim();
  const user = String(process.env.EMAIL_USER || "").trim();
  let pass = String(process.env.EMAIL_PASS || "").trim();

  if (!user || !pass) {
    throw new Error("Email is not configured. Set EMAIL_USER and EMAIL_PASS in backend/.env.");
  }

  // Google App Passwords may be copied with spaces between character groups.
  if (host.toLowerCase() === "smtp.gmail.com") {
    pass = pass.replace(/\s+/g, "");
  }

  if (!transporter) {
    const port = Number(process.env.EMAIL_PORT || 465);
    transporter = nodemailer.createTransport({
      host,
      port,
      secure: String(process.env.EMAIL_SECURE ?? (port === 465)).trim().toLowerCase() === "true",
      auth: { user, pass },
    });
  }

  return transporter;
}

const sender = () => process.env.EMAIL_FROM || process.env.EMAIL_USER;

const esc = (value) =>
  String(value ?? "").replace(/[&<>"']/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  }[character]));

function isValidEmailAddress(value) {
  const email = String(value || "").trim();
  return email.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// SMTP 5xx responses indicate a permanent rejection (for example, 550 5.1.1).
// Leave 4xx/network errors retryable because they are usually temporary.
function isPermanentEmailError(error) {
  const responseCode = Number(error?.responseCode);
  return responseCode >= 500 && responseCode < 600;
}

function formatMoney(value) {
  return `₹${Number(value || 0).toFixed(2)}`;
}

function buildReceiptSvg({ customerName, orderId, deliveredAt, items, total }) {
  const itemRows = items.map((item, index) => {
    const y = 330 + index * 58;
    return `
      <text x="64" y="${y}" class="item">${esc(item.name)}</text>
      <text x="64" y="${y + 23}" class="muted">${esc(item.quantity)} ${esc(item.unit || "item")}</text>
      <text x="656" y="${y}" class="amount" text-anchor="end">${esc(formatMoney(item.amount))}</text>
      <line x1="64" y1="${y + 38}" x2="656" y2="${y + 38}" stroke="#e8e8e8"/>
    `;
  }).join("");

  const height = Math.max(600, 500 + items.length * 58);

  return `<svg xmlns="http://www.w3.org/2000/svg" width="720" height="${height}" viewBox="0 0 720 ${height}">
    <style>
      text{font-family:Arial,Helvetica,sans-serif}
      .muted{fill:#667085;font-size:16px}
      .item{fill:#202124;font-size:18px;font-weight:600}
      .amount{fill:#202124;font-size:18px;font-weight:600}
    </style>
    <rect width="720" height="${height}" rx="24" fill="#f4f7f2"/>
    <rect x="24" y="24" width="672" height="${height - 48}" rx="18" fill="#ffffff"/>
    <rect x="24" y="24" width="672" height="154" rx="18" fill="#176b45"/>
    <path d="M24 150h672v28H24z" fill="#176b45"/>
    <text x="64" y="78" fill="#ffffff" font-size="30" font-weight="700">MealMate</text>
    <text x="64" y="119" fill="#e8f5ec" font-size="19">Your order has been delivered!</text>
    <circle cx="628" cy="91" r="27" fill="#ffffff" opacity=".18"/>
    <path d="M615 91l9 9 18-20" fill="none" stroke="#ffffff" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>
    <text x="64" y="224" fill="#202124" font-size="23" font-weight="700">Delivery receipt</text>
    <text x="64" y="260" class="muted">Order ID: ${esc(orderId)}</text>
    <text x="64" y="287" class="muted">Delivered: ${esc(deliveredAt)}</text>
    <text x="64" y="314" class="muted">Customer: ${esc(customerName)}</text>
    ${itemRows}
    <line x1="64" y1="${height - 112}" x2="656" y2="${height - 112}" stroke="#d0d5dd" stroke-width="2"/>
    <text x="64" y="${height - 70}" fill="#202124" font-size="21" font-weight="700">Total paid</text>
    <text x="656" y="${height - 70}" fill="#176b45" font-size="25" font-weight="700" text-anchor="end">${esc(formatMoney(total))}</text>
    <text x="360" y="${height - 35}" fill="#667085" font-size="14" text-anchor="middle">Thank you for choosing MealMate!</text>
  </svg>`;
}

async function sendPasswordResetEmail({ to, name, resetUrl }) {
  await getTransporter().sendMail({
    from: sender(),
    to,
    subject: "Reset your MealMate password",
    text: `Hi ${name || "there"},\nUse this link within 30 minutes to reset your password:\n${resetUrl}\nIf you did not request this, ignore this email.`,
    html: `<div style="font-family:Arial,sans-serif;max-width:560px;margin:auto"><h2>Reset your MealMate password</h2><p>Hi ${esc(name || "there")},</p><p>This secure link expires in 30 minutes and can only be used once.</p><p><a href="${esc(resetUrl)}">Reset password</a></p><p>If you did not request this, ignore this email.</p></div>`,
  });
}

async function sendDeliveryReceiptEmail({ user, order }) {
  if (!isValidEmailAddress(user?.email)) {
    const error = new Error("Customer email is missing or has an invalid format.");
    error.code = "INVALID_RECIPIENT_ADDRESS";
    error.permanent = true;
    throw error;
  }

  const items = (order.items || []).map((item) => ({
    ...item,
    amount: Number(item.price || 0) * Number(item.quantity || 0),
  }));

  const deliveredAt = order.deliveredAt
    ? new Date(order.deliveredAt).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })
    : new Date().toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" });

  const customerName = user.name || "there";
  const orderId = order.orderId || "N/A";
  const total = Number(order.totalAmount || 0);
  const receiptSvg = buildReceiptSvg({ customerName, orderId, deliveredAt, items, total });
  const textItems = items.map((item) =>
    `- ${item.name}: ${item.quantity} ${item.unit || ""} — ${formatMoney(item.amount)}`
  ).join("\n");

  const rows = items.map((item) => `
    <tr>
      <td style="padding:12px 8px;border-bottom:1px solid #e8e8e8">${esc(item.name)}<br><span style="color:#667085;font-size:12px">${esc(item.quantity)} ${esc(item.unit || "item")}</span></td>
      <td style="padding:12px 8px;border-bottom:1px solid #e8e8e8;text-align:right;white-space:nowrap">${formatMoney(item.amount)}</td>
    </tr>
  `).join("");

  // Keep a fully HTML-rendered receipt as a fallback for email clients that block SVG.
  const html = `
    <div style="margin:0;padding:24px 12px;background:#f4f7f2;font-family:Arial,Helvetica,sans-serif;color:#202124">\n      <div style="max-width:620px;margin:0 auto 16px;text-align:center"><img src="cid:mealmate-delivery-receipt" alt="MealMate delivery receipt" style="display:block;width:100%;max-width:620px;height:auto;border:0"></div>
      <div style="max-width:620px;margin:0 auto;background:#fff;border-radius:16px;overflow:hidden">
        <div style="padding:28px 32px;background:#176b45;color:#fff">
          <div style="font-size:26px;font-weight:700">MealMate</div>
          <div style="margin-top:10px;font-size:18px">Your order has been delivered!</div>
        </div>
        <div style="padding:28px 32px">
          <h2 style="margin:0 0 18px;font-size:22px">Delivery receipt</h2>
          <p style="margin:6px 0;color:#475467">Hi ${esc(customerName)},</p>
          <p style="margin:6px 0;color:#475467">Order ID: <strong>${esc(orderId)}</strong></p>
          <p style="margin:6px 0;color:#475467">Delivered: ${esc(deliveredAt)}</p>
          <p style="margin:6px 0 22px;color:#176b45;font-weight:700">Status: Delivered</p>
          <table role="presentation" style="width:100%;border-collapse:collapse">
            <thead><tr><th align="left" style="padding:10px 8px;border-bottom:2px solid #d0d5dd">Item</th><th align="right" style="padding:10px 8px;border-bottom:2px solid #d0d5dd">Amount</th></tr></thead>
            <tbody>${rows}</tbody>
          </table>
          <div style="display:flex;justify-content:space-between;padding-top:20px;font-size:20px;font-weight:700">
            <span>Total paid</span><span style="color:#176b45">${formatMoney(total)}</span>
          </div>
          <p style="margin:28px 0 0;text-align:center;color:#667085">Thank you for choosing MealMate!</p>
        </div>
      </div>
    </div>`;

  await getTransporter().sendMail({
    from: sender(),
    to: user.email,
    subject: `Your MealMate delivery receipt — ${orderId}`,
    text: `Hi ${customerName}, your order is delivered.\nOrder: ${orderId}\nDelivered: ${deliveredAt}\n${textItems}\nTotal: ${formatMoney(total)}`,
    html,
    attachments: [
      {
        filename: `MealMate-Receipt-${String(orderId).replace(/[^a-zA-Z0-9_-]/g, "_")}.svg`,
        content: receiptSvg,
        contentType: "image/svg+xml",
        cid: "mealmate-delivery-receipt",
      },
    ],
  });
}

module.exports = {
  sendPasswordResetEmail,
  sendDeliveryReceiptEmail,
  isValidEmailAddress,
  isPermanentEmailError,
};
