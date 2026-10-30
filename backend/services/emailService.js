const nodemailer = require("nodemailer");

let transporter;

function getTransporter() {
  if (transporter) return transporter;

  const { SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS } = process.env;
  if (!SMTP_HOST || !SMTP_PORT || !SMTP_USER || !SMTP_PASS) {
    return null;
  }

  transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: Number(SMTP_PORT),
    secure: Number(SMTP_PORT) === 465,
    auth: { user: SMTP_USER, pass: SMTP_PASS },
  });

  return transporter;
}

function escapeHtml(value = "") {
  return String(value).replace(/[&<>"']/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  })[character]);
}

exports.sendOrderReceipt = async ({ user, order }) => {
  const mailer = getTransporter();
  if (!mailer || !user?.email) {
    return { sent: false, reason: "Email service is not configured" };
  }

  const rows = order.items.map((item) => {
    const lineTotal = Number(item.price) * Number(item.quantity);
    return `
      <tr>
        <td style="padding:10px;border-bottom:1px solid #eee">${escapeHtml(item.name)}</td>
        <td style="padding:10px;text-align:center;border-bottom:1px solid #eee">${item.quantity} ${escapeHtml(item.unit || "")}</td>
        <td style="padding:10px;text-align:right;border-bottom:1px solid #eee">₹${lineTotal.toFixed(2)}</td>
      </tr>`;
  }).join("");

  const createdAt = new Date(order.createdAt || Date.now()).toLocaleString("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Kolkata",
  });
  const deliveryAt = new Date(order.deliveryTime).toLocaleString("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Kolkata",
  });

  await mailer.sendMail({
    from: process.env.MAIL_FROM || process.env.SMTP_USER,
    to: user.email,
    subject: `MealMate order receipt - ${order.orderId}`,
    text: [
      `Hello ${user.name},`,
      "Thank you for ordering from MealMate.",
      `Order ID: ${order.orderId}`,
      `Order date: ${createdAt}`,
      ...order.items.map((item) => `${item.name} x ${item.quantity} = ₹${(item.price * item.quantity).toFixed(2)}`),
      `Total: ₹${Number(order.totalAmount).toFixed(2)}`,
      `Estimated delivery: ${deliveryAt}`,
      "This is an order confirmation for a demo checkout; no online payment was processed.",
    ].join("\n"),
    html: `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:auto;color:#1f2937">
        <div style="background:#16834a;color:white;padding:24px;border-radius:12px 12px 0 0">
          <h1 style="margin:0">MealMate</h1>
          <p style="margin:8px 0 0">Your order has been placed!</p>
        </div>
        <div style="padding:24px;border:1px solid #eee;border-top:0;border-radius:0 0 12px 12px">
          <p>Hello ${escapeHtml(user.name)}, thank you for ordering with MealMate.</p>
          <p><strong>Order ID:</strong> ${escapeHtml(order.orderId)}<br>
          <strong>Order date:</strong> ${escapeHtml(createdAt)}<br>
          <strong>Estimated delivery:</strong> ${escapeHtml(deliveryAt)}</p>
          <table style="width:100%;border-collapse:collapse">
            <thead><tr><th align="left">Item</th><th>Qty</th><th align="right">Amount</th></tr></thead>
            <tbody>${rows}</tbody>
          </table>
          <h2 style="text-align:right">Total: ₹${Number(order.totalAmount).toFixed(2)}</h2>
          <p style="font-size:12px;color:#6b7280">Demo checkout confirmation only. No online payment was processed.</p>
        </div>
      </div>`,
  });

  return { sent: true };
};
