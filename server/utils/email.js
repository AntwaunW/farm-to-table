// Email utility — handles all outgoing emails via SendGrid
// Import this file anywhere you need to send an email
// Each function handles a specific type of email the app sends

const sgMail = require('@sendgrid/mail');

// -------------------------------------------------------------------
// 🎓 WHAT IS sgMail.setApiKey()?
// Think of this like showing your ID badge to get into the
// SendGrid building. Without this line SendGrid won't let us
// send any emails — it won't know who we are.
// We only need to do this once at the top of the file.
// -------------------------------------------------------------------
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

// Base URL for links inside emails — set CLIENT_URL in .env for each environment
// (falls back to localhost so local dev keeps working without extra setup)
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:3000';

// -------------------------------------------------------------------
// 🎓 HOW DO ALL THESE FUNCTIONS WORK?
// Each function below is responsible for one type of email.
// They all follow the same pattern:
// 1. Build a 'msg' object with to, from, subject, and html
// 2. Call sgMail.send(msg) to actually send it
// 3. If something goes wrong log the error but don't crash the app
//
// The 'html' field lets us use actual HTML to make nice looking
// emails — not just plain text.
// -------------------------------------------------------------------

// -------------------------------------------------------------------
// Welcome email — sent when a new user registers
// -------------------------------------------------------------------
const sendWelcomeEmail = async (user) => {
  const msg = {
    to: user.email,
    from: {
      email: process.env.SENDGRID_FROM_EMAIL,
      name: 'Cattle & Crop',
    },
    subject: 'Welcome to Cattle & Crop!',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #1b4332; padding: 24px; text-align: center;">
          <h1 style="color: #ffffff; margin: 0;">Cattle &amp; Crop</h1>
        </div>
        <div style="padding: 32px; background: #ffffff;">
          <h2 style="color: #1b1b1b;">Welcome, ${user.name}!</h2>
          <p style="color: #6b7280; line-height: 1.6;">
            Thanks for joining Cattle &amp; Crop. You now have access to fresh,
            locally grown food directly from Texas farms and ranchers.
          </p>
          ${user.role === 'farmer' ? `
            <p style="color: #6b7280; line-height: 1.6;">
              As a farmer, you can create your farm profile and start
              listing your products for local buyers to find.
            </p>
            <a href="${CLIENT_URL}/dashboard"
               style="display: inline-block; background: #2d6a4f; color: #ffffff;
                      padding: 12px 24px; border-radius: 8px; text-decoration: none;
                      margin-top: 16px;">
              Create your farm profile
            </a>
          ` : `
            <p style="color: #6b7280; line-height: 1.6;">
              Start browsing local farms and fresh products near you.
            </p>
            <a href="${CLIENT_URL}/browse"
               style="display: inline-block; background: #2d6a4f; color: #ffffff;
                      padding: 12px 24px; border-radius: 8px; text-decoration: none;
                      margin-top: 16px;">
              Browse farms
            </a>
          `}
        </div>
        <div style="padding: 16px; text-align: center; color: #6b7280; font-size: 12px;">
          <p>© 2026 Cattle &amp; Crop. All rights reserved.</p>
        </div>
      </div>
    `,
  };

  try {
    await sgMail.send(msg);
    console.log(`Welcome email sent to ${user.email}`);
  } catch (error) {
    // -------------------------------------------------------------------
    // 🎓 WHY DON'T WE THROW THE ERROR HERE?
    // If sending a welcome email fails we don't want the entire
    // registration process to fail for the user.
    // We log the error so we know about it, but we let the
    // registration succeed anyway.
    // Email is helpful but not critical — the user can still use the app.
    // -------------------------------------------------------------------
    console.error('Welcome email failed:', error.message);
  }
};

// -------------------------------------------------------------------
// Order confirmation — sent to consumer after placing an order
// -------------------------------------------------------------------
const sendOrderConfirmation = async (order, consumer) => {
  // Build the list of items as HTML
  const itemsHtml = order.items.map((item) => `
    <tr>
      <td style="padding: 8px; border-bottom: 1px solid #e5e7eb;">
        ${item.title}
      </td>
      <td style="padding: 8px; border-bottom: 1px solid #e5e7eb; text-align: center;">
        ${item.quantity} x ${item.unit}
      </td>
      <td style="padding: 8px; border-bottom: 1px solid #e5e7eb; text-align: right;">
        $${item.subtotal}
      </td>
    </tr>
  `).join('');

  const msg = {
    to: consumer.email,
    from: {
      email: process.env.SENDGRID_FROM_EMAIL,
      name: 'Cattle & Crop',
    },
    subject: 'Order confirmed — Cattle & Crop',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #1b4332; padding: 24px; text-align: center;">
          <h1 style="color: #ffffff; margin: 0;">Cattle &amp; Crop</h1>
        </div>
        <div style="padding: 32px; background: #ffffff;">
          <h2 style="color: #1b1b1b;">Order confirmed!</h2>
          <p style="color: #6b7280;">
            Hi ${consumer.name}, your order has been placed successfully.
          </p>

          <table style="width: 100%; border-collapse: collapse; margin: 24px 0;">
            <thead>
              <tr style="background: #f9fafb;">
                <th style="padding: 8px; text-align: left;">Item</th>
                <th style="padding: 8px; text-align: center;">Qty</th>
                <th style="padding: 8px; text-align: right;">Total</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHtml}
            </tbody>
            <tfoot>
              <tr>
                <td colspan="2" style="padding: 8px; font-weight: bold;">Total</td>
                <td style="padding: 8px; text-align: right; font-weight: bold;">
                  $${order.totalAmount}
                </td>
              </tr>
            </tfoot>
          </table>

          <div style="background: #f9fafb; padding: 16px; border-radius: 8px;">
            <p style="margin: 0; color: #6b7280; font-size: 14px;">
              <strong>Pickup:</strong>
              ${order.pickupDate
                ? new Date(order.pickupDate).toLocaleDateString()
                : 'To be confirmed'}
            </p>
            ${order.notes ? `
              <p style="margin: 8px 0 0; color: #6b7280; font-size: 14px;">
                <strong>Notes:</strong> ${order.notes}
              </p>
            ` : ''}
          </div>

          <a href="${CLIENT_URL}/orders"
             style="display: inline-block; background: #2d6a4f; color: #ffffff;
                    padding: 12px 24px; border-radius: 8px; text-decoration: none;
                    margin-top: 24px;">
            Track your order
          </a>
        </div>
        <div style="padding: 16px; text-align: center; color: #6b7280; font-size: 12px;">
          <p>© 2026 Cattle &amp; Crop. All rights reserved.</p>
        </div>
      </div>
    `,
  };

  try {
    await sgMail.send(msg);
    console.log(`Order confirmation sent to ${consumer.email}`);
  } catch (error) {
    console.error('Order confirmation email failed:', error.message);
  }
};

// -------------------------------------------------------------------
// New order alert — sent to farmer when they receive an order
// -------------------------------------------------------------------
const sendNewOrderAlert = async (order, farmer, farm) => {
  const itemsHtml = order.items.map((item) => `
    <li style="margin-bottom: 8px; color: #6b7280;">
      ${item.title} — ${item.quantity} x ${item.unit} ($${item.subtotal})
    </li>
  `).join('');

  const msg = {
    to: farmer.email,
    from: {
      email: process.env.SENDGRID_FROM_EMAIL,
      name: 'Cattle & Crop',
    },
    subject: `New order received — ${farm.farmName} 🌿`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #1b4332; padding: 24px; text-align: center;">
          <h1 style="color: #ffffff; margin: 0;">Cattle &amp; Crop</h1>
        </div>
        <div style="padding: 32px; background: #ffffff;">
          <h2 style="color: #1b1b1b;">You have a new order!</h2>
          <p style="color: #6b7280;">
            Hi ${farmer.name}, someone just placed an order from ${farm.farmName}.
          </p>

          <div style="background: #f9fafb; padding: 16px; border-radius: 8px; margin: 24px 0;">
            <p style="margin: 0 0 8px; font-weight: bold;">Order details:</p>
            <ul style="margin: 0; padding-left: 20px;">
              ${itemsHtml}
            </ul>
            <p style="margin: 16px 0 0; font-weight: bold;">
              Total payout: $${order.farmerPayout}
            </p>
          </div>

          <p style="color: #6b7280; font-size: 14px;">
            Log in to your dashboard to confirm this order.
          </p>

          <a href="${CLIENT_URL}/dashboard"
             style="display: inline-block; background: #2d6a4f; color: #ffffff;
                    padding: 12px 24px; border-radius: 8px; text-decoration: none;
                    margin-top: 8px;">
            View order
          </a>
        </div>
        <div style="padding: 16px; text-align: center; color: #6b7280; font-size: 12px;">
          <p>© 2026 Cattle &amp; Crop. All rights reserved.</p>
        </div>
      </div>
    `,
  };

  try {
    await sgMail.send(msg);
    console.log(`New order alert sent to ${farmer.email}`);
  } catch (error) {
    console.error('New order alert email failed:', error.message);
  }
};

// -------------------------------------------------------------------
// Contact form — sent to the business inbox when a visitor submits
// the contact page form. Set CONTACT_EMAIL in .env to your inbox.
// -------------------------------------------------------------------
const sendContactEmail = async ({ name, email, phone, subject, message }) => {
  const to = process.env.CONTACT_EMAIL || process.env.SENDGRID_FROM_EMAIL;

  const msg = {
    to,
    from: {
      email: process.env.SENDGRID_FROM_EMAIL,
      name: 'Cattle & Crop',
    },
    replyTo: { email, name },
    subject: `Contact: ${subject || 'General inquiry'} — from ${name}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #1b4332; padding: 24px; text-align: center;">
          <h1 style="color: #ffffff; margin: 0;">Cattle &amp; Crop</h1>
          <p style="color: rgba(255,255,255,0.7); margin: 8px 0 0; font-size: 14px;">New contact form submission</p>
        </div>
        <div style="padding: 32px; background: #ffffff;">
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 8px 0; font-weight: 600; color: #1b1b1b; width: 120px;">Name</td>
              <td style="padding: 8px 0; color: #6b7280;">${name}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; font-weight: 600; color: #1b1b1b;">Email</td>
              <td style="padding: 8px 0; color: #6b7280;"><a href="mailto:${email}">${email}</a></td>
            </tr>
            ${phone ? `
            <tr>
              <td style="padding: 8px 0; font-weight: 600; color: #1b1b1b;">Phone</td>
              <td style="padding: 8px 0; color: #6b7280;">${phone}</td>
            </tr>` : ''}
            <tr>
              <td style="padding: 8px 0; font-weight: 600; color: #1b1b1b;">Subject</td>
              <td style="padding: 8px 0; color: #6b7280;">${subject || 'Not specified'}</td>
            </tr>
          </table>
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;" />
          <h3 style="color: #1b1b1b; margin: 0 0 12px;">Message</h3>
          <p style="color: #6b7280; line-height: 1.7; white-space: pre-wrap;">${message}</p>
          <p style="margin-top: 24px; font-size: 13px; color: #9ca3af;">
            Reply directly to this email to respond to ${name}.
          </p>
        </div>
        <div style="padding: 16px; text-align: center; color: #6b7280; font-size: 12px;">
          <p>© 2026 Cattle &amp; Crop. All rights reserved.</p>
        </div>
      </div>
    `,
  };

  try {
    await sgMail.send(msg);
    console.log(`Contact form email sent from ${email}`);
  } catch (error) {
    console.error('Contact email failed:', error.message);
    throw error;
  }
};

module.exports = {
  sendWelcomeEmail,
  sendOrderConfirmation,
  sendNewOrderAlert,
  sendContactEmail,
};