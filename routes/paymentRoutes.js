// routes/paymentRoutes.js — Stripe payment integration
const express = require('express');
const router = express.Router();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { verifyToken, isMentor, isAdmin } = require('../middleware/auth');
const MentorBooking = require('../models/MentorBooking');
const MentorProfile = require('../models/MentorProfile');
const MentorService = require('../models/MentorService');
const MentorCoupon = require('../models/MentorCoupon');
const SystemSettings = require('../models/SystemSettings');
const User = require('../models/User');
const { sendEmailFast } = require('../config/mailHelper');
const crypto = require('crypto');
const PDFDocument = require('pdfkit');
const mongoose = require('mongoose');

const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:5173';
const PLATFORM_FEE_PCT = Number(process.env.PLATFORM_FEE_PERCENT || 15);
const CURRENCY = process.env.STRIPE_CURRENCY || 'inr';

// ─── Helper: Jitsi link ────────────────────────────────────────────────────────
const generateJitsiLink = bookingId => {
  const shortId = bookingId.replace('BK-', '').substring(0, 12);
  return `https://meet.jit.si/SkillPilot${shortId}#config.prejoinConfig.enabled=false`;
};

// ─── Helper: Google Calendar URL ──────────────────────────────────────────────
const googleCalendarUrl = (booking, mentorName, serviceName) => {
  const start = new Date(booking.scheduledAt);
  const end = new Date(start.getTime() + booking.duration * 60000);
  const fmt = d => d.toISOString().replace(/-|:|\.\d+/g, '');
  return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${encodeURIComponent(`Mentorship: ${serviceName} with ${mentorName}`)}&dates=${fmt(start)}/${fmt(end)}&details=${encodeURIComponent(`Meeting: ${booking.meetingLink || ''}`)}&sf=true&output=xml`;
};

// ─── Helper: Premium HTML email ────────────────────────────────────────────────
const buildBookingEmail = ({
  userName,
  mentorName,
  mentorImg,
  serviceName,
  scheduledAt,
  duration,
  bookingId,
  meetingLink,
  paidAmount,
  isFree,
  calUrl,
}) => {
  const date = new Date(scheduledAt).toLocaleDateString('en-IN', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  const time = new Date(scheduledAt).toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
  });
  return `<!DOCTYPE html><html><head><meta charset="utf-8"/></head><body style="margin:0;padding:0;background:#f4f4f5;font-family:'Segoe UI',Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:40px 20px;">
<table width="580" style="background:#ffffff;border-radius:20px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
  <tr><td style="background:linear-gradient(135deg,#1d2b3e 0%,#004944 100%);padding:40px;text-align:center;">
    <h1 style="color:#ffffff;margin:0;font-size:28px;font-weight:800;letter-spacing:-0.5px;">✅ Booking Confirmed!</h1>
    <p style="color:#9cf2e8;margin:8px 0 0;font-size:15px;">Your mentorship session is locked in</p>
  </td></tr>
  <tr><td style="padding:40px;">
    <div style="display:flex;align-items:center;gap:16px;margin-bottom:32px;padding:20px;background:#f8fafc;border-radius:12px;">
      ${mentorImg ? `<img src="${mentorImg}" width="60" height="60" style="border-radius:50%;object-fit:cover;" alt="${mentorName}"/>` : `<div style="width:60px;height:60px;border-radius:50%;background:#004944;display:flex;align-items:center;justify-content:center;color:white;font-size:24px;font-weight:700;">${mentorName[0]}</div>`}
      <div><p style="margin:0;font-weight:700;font-size:18px;color:#1d2b3e;">${mentorName}</p><p style="margin:4px 0 0;color:#64748b;font-size:13px;">Your Mentor</p></div>
    </div>
    <table width="100%" style="border-collapse:collapse;margin-bottom:32px;">
      <tr><td style="padding:14px 16px;background:#f8fafc;border-radius:8px 8px 0 0;border-bottom:1px solid #e2e8f0;">
        <p style="margin:0;font-size:11px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:1px;">Service</p>
        <p style="margin:4px 0 0;font-size:15px;font-weight:600;color:#1d2b3e;">${serviceName}</p>
      </td></tr>
      <tr><td style="padding:14px 16px;background:#f8fafc;border-bottom:1px solid #e2e8f0;">
        <p style="margin:0;font-size:11px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:1px;">Date & Time</p>
        <p style="margin:4px 0 0;font-size:15px;font-weight:600;color:#1d2b3e;">${date} at ${time}</p>
      </td></tr>
      <tr><td style="padding:14px 16px;background:#f8fafc;border-bottom:1px solid #e2e8f0;">
        <p style="margin:0;font-size:11px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:1px;">Duration</p>
        <p style="margin:4px 0 0;font-size:15px;font-weight:600;color:#1d2b3e;">${duration} minutes</p>
      </td></tr>
      <tr><td style="padding:14px 16px;background:#f8fafc;border-radius:0 0 8px 8px;">
        <p style="margin:0;font-size:11px;font-weight:700;color:#64748b;text-transform:uppercase;letter-spacing:1px;">Amount Paid</p>
        <p style="margin:4px 0 0;font-size:15px;font-weight:600;color:#1d2b3e;">${isFree ? '🎉 FREE' : `₹${paidAmount}`}</p>
      </td></tr>
    </table>
    ${meetingLink ? `<div style="text-align:center;margin-bottom:24px;"><a href="${meetingLink}" style="display:inline-block;padding:16px 40px;background:linear-gradient(135deg,#004944,#1d2b3e);color:#ffffff;text-decoration:none;border-radius:12px;font-weight:700;font-size:16px;">🎥 Join Jitsi Meeting</a></div>` : ''}
    <div style="text-align:center;margin-bottom:32px;">
      <a href="${calUrl}" style="display:inline-block;padding:10px 24px;border:2px solid #1d2b3e;color:#1d2b3e;text-decoration:none;border-radius:8px;font-weight:600;font-size:13px;">📅 Add to Google Calendar</a>
    </div>
    <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:10px;padding:16px;text-align:center;">
      <p style="margin:0;font-size:12px;color:#166534;">Booking ID: <strong>${bookingId}</strong></p>
    </div>
  </td></tr>
  <tr><td style="background:#f8fafc;padding:24px;text-align:center;border-top:1px solid #e2e8f0;">
    <p style="margin:0;font-size:12px;color:#94a3b8;">SkillPilot Mentorship Platform · <a href="${FRONTEND_URL}" style="color:#004944;">skillpilot.app</a></p>
  </td></tr>
</table></td></tr></table></body></html>`;
};

// ─── 1. Create Stripe Checkout Session ─────────────────────────────────────────
// POST /api/payments/create-checkout-session
router.post('/create-checkout-session', verifyToken, async (req, res) => {
  try {
    const { mentorProfileId, serviceId, couponCode, scheduledAt, notes, topics } = req.body;
    const userId = req.user._id;

    if (!mentorProfileId || !serviceId || !scheduledAt) {
      return res.status(400).json({ error: 'mentorProfileId, serviceId, scheduledAt required' });
    }

    const [mentorProfile, service] = await Promise.all([
      MentorProfile.findById(mentorProfileId).populate('userId', 'name email'),
      MentorService.findById(serviceId),
    ]);

    if (!mentorProfile || !service)
      return res.status(404).json({ error: 'Mentor or service not found' });
    if (!service.isActive) return res.status(400).json({ error: 'Service not available' });

    const user = await User.findById(userId).select('name email');
    const mentorId = mentorProfile.userId._id;

    if (mentorId.toString() === userId.toString()) {
      return res.status(400).json({ error: 'Cannot book yourself' });
    }

    // Calculate pricing
    let originalPrice = service.price || 0;
    let finalPrice = originalPrice;
    let couponId = null;

    if (couponCode && originalPrice > 0) {
      const result = await MentorCoupon.validateCoupon({
        code: couponCode,
        mentorId,
        serviceId,
        userId,
        originalPrice,
      });
      if (result.valid) {
        finalPrice = result.finalPrice;
        couponId = result.couponId;
      }
    }

    // Build Stripe metadata to reconstruct booking on webhook/confirm
    const meta = {
      userId: userId.toString(),
      mentorProfileId,
      mentorId: mentorId.toString(),
      serviceId,
      couponCode: couponCode || '',
      couponId: couponId ? couponId.toString() : '',
      scheduledAt,
      duration: String(service.duration || 60),
      notes: notes || '',
      topics: JSON.stringify(topics || []),
      originalPrice: String(originalPrice),
      finalPrice: String(finalPrice),
    };

    const mentorHandle = mentorProfile.handle || mentorProfile._id.toString();

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',
      customer_email: user.email,
      line_items: [
        {
          price_data: {
            currency: CURRENCY,
            unit_amount: Math.round(finalPrice * 100), // paise
            product_data: {
              name: service.title,
              description: `Mentorship session with ${mentorProfile.displayName} · ${service.duration || 60} mins`,
              images: mentorProfile.profileImage ? [mentorProfile.profileImage] : [],
            },
          },
          quantity: 1,
        },
      ],
      metadata: meta,
      success_url: `${FRONTEND_URL}/mentor/${mentorHandle}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${FRONTEND_URL}/mentor/${mentorHandle}/checkout?cancelled=true`,
    });

    res.json({ url: session.url, sessionId: session.id });
  } catch (err) {
    console.error('Stripe checkout error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ─── 2. Confirm Booking after Stripe redirect ──────────────────────────────────
// POST /api/payments/confirm-booking
router.post('/confirm-booking', verifyToken, async (req, res) => {
  try {
    const { sessionId } = req.body;
    if (!sessionId) return res.status(400).json({ error: 'sessionId required' });

    // Check if booking already created by webhook
    const existing = await MentorBooking.findOne({ stripeSessionId: sessionId })
      .populate('mentorProfileId', 'displayName profileImage handle')
      .populate('serviceId', 'title duration');

    if (existing) {
      return res.json({ booking: existing, alreadyExists: true });
    }

    // Webhook hasn't fired yet — verify and create ourselves
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    if (session.payment_status !== 'paid') {
      return res.status(402).json({ error: 'Payment not completed' });
    }

    const booking = await createBookingFromSession(session);
    await booking.populate('mentorProfileId', 'displayName profileImage handle');
    await booking.populate('serviceId', 'title duration');
    res.json({ booking });
  } catch (err) {
    console.error('Confirm booking error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ─── Shared helper: create booking from Stripe session metadata ───────────────
async function createBookingFromSession(session) {
  const meta = session.metadata;

  // Check idempotency
  const exists = await MentorBooking.findOne({ stripeSessionId: session.id });
  if (exists) return exists;

  const settings = await SystemSettings.getSettings();
  const originalPrice = Number(meta.originalPrice);
  const finalPrice = Number(meta.finalPrice);
  const platformFee = Math.round((finalPrice * PLATFORM_FEE_PCT) / 100);
  const mentorEarning = finalPrice - platformFee;

  const booking = new MentorBooking({
    userId: meta.userId,
    mentorId: meta.mentorId,
    mentorProfileId: meta.mentorProfileId,
    serviceId: meta.serviceId || undefined,
    couponId: meta.couponId || undefined,
    scheduledAt: new Date(meta.scheduledAt),
    duration: Number(meta.duration),
    remark: meta.notes || '',
    topics: JSON.parse(meta.topics || '[]'),
    isFree: false,
    originalPrice,
    paidAmount: finalPrice,
    platformFee,
    mentorEarning,
    stripeSessionId: session.id,
    stripePaymentIntentId: session.payment_intent,
    paymentStatus: 'paid',
    status: settings.bookingSettings?.autoConfirmBookings ? 'confirmed' : 'pending',
  });

  booking.meetingLink = generateJitsiLink(booking.bookingId);
  booking.meetingLinkSentAt = new Date();

  const saved = await booking.save();

  // Send premium emails
  const [user, mentorProfile] = await Promise.all([
    User.findById(meta.userId).select('name email'),
    MentorProfile.findById(meta.mentorProfileId).populate('userId', 'name email'),
  ]);
  const service = await MentorService.findById(meta.serviceId).select('title');
  const serviceName = service?.title || 'Mentorship Session';
  const calUrl = googleCalendarUrl(saved, mentorProfile.displayName, serviceName);

  // Email to student
  sendEmailFast(user.email, {
    subject: `✅ Booking Confirmed — ${serviceName} with ${mentorProfile.displayName}`,
    html: buildBookingEmail({
      userName: user.name,
      mentorName: mentorProfile.displayName,
      mentorImg: mentorProfile.profileImage,
      serviceName,
      scheduledAt: saved.scheduledAt,
      duration: saved.duration,
      bookingId: saved.bookingId,
      meetingLink: saved.meetingLink,
      paidAmount: finalPrice,
      isFree: false,
      calUrl,
    }),
    text: `Booking Confirmed! ${serviceName} with ${mentorProfile.displayName}. Join: ${saved.meetingLink}`,
  }).catch(console.error);

  // Email to mentor
  sendEmailFast(mentorProfile.userId.email, {
    subject: `📅 New Booking — ${serviceName} from ${user.name}`,
    html: buildBookingEmail({
      userName: mentorProfile.displayName,
      mentorName: user.name,
      mentorImg: null,
      serviceName,
      scheduledAt: saved.scheduledAt,
      duration: saved.duration,
      bookingId: saved.bookingId,
      meetingLink: saved.meetingLink,
      paidAmount: finalPrice,
      isFree: false,
      calUrl,
    }),
    text: `New booking from ${user.name}. ${serviceName} on ${new Date(meta.scheduledAt).toLocaleDateString()}`,
  }).catch(console.error);

  return saved;
}

// ─── 3. Stripe Webhook ──────────────────────────────────────────────────────────
// POST /api/payments/webhook  (raw body — set in index.js)
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event;
  try {
    event =
      webhookSecret && webhookSecret !== 'whsec_placeholder_run_stripe_listen_to_get_this'
        ? stripe.webhooks.constructEvent(req.body, sig, webhookSecret)
        : JSON.parse(req.body);
  } catch (err) {
    console.error('Webhook signature error:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        if (session.payment_status === 'paid') {
          await createBookingFromSession(session);
        }
        break;
      }
      case 'payment_intent.payment_failed': {
        const pi = event.data.object;
        const booking = await MentorBooking.findOne({ stripePaymentIntentId: pi.id });
        if (booking) {
          booking.paymentStatus = 'failed';
          booking.status = 'cancelled';
          await booking.save();
        }
        break;
      }
      case 'charge.refunded': {
        const charge = event.data.object;
        const booking = await MentorBooking.findOne({
          stripePaymentIntentId: charge.payment_intent,
        });
        if (booking) {
          booking.paymentStatus = 'refunded';
          booking.status = 'cancelled';
          booking.cancelledBy = 'admin';
          booking.cancelledAt = new Date();
          await booking.save();
        }
        break;
      }
    }
    res.json({ received: true });
  } catch (err) {
    console.error('Webhook handler error:', err);
    res.status(500).json({ error: err.message });
  }
});

// ─── 4. PDF Invoice ─────────────────────────────────────────────────────────────
// GET /api/payments/invoice/:bookingId
router.get('/invoice/:bookingId', verifyToken, async (req, res) => {
  try {
    const { bookingId } = req.params;
    const userId = req.user._id;

    // Fix: Prevent CastError if bookingId is a readable string (BK-...) instead of ObjectId
    const isId = mongoose.Types.ObjectId.isValid(bookingId);
    const query = isId ? { $or: [{ _id: bookingId }, { bookingId }] } : { bookingId };

    const booking = await MentorBooking.findOne(query)
      .populate('userId', 'name email')
      .populate('mentorId', 'name email')
      .populate('mentorProfileId', 'displayName')
      .populate('serviceId', 'title');

    if (!booking) return res.status(404).json({ error: 'Booking not found' });

    // Only booking owner or mentor can download
    const isOwner = booking.userId._id.toString() === userId.toString();
    const isMentorUser = booking.mentorId._id.toString() === userId.toString();
    if (!isOwner && !isMentorUser) return res.status(403).json({ error: 'Access denied' });

    const doc = new PDFDocument({ margin: 50, size: 'A4' });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=invoice-${booking.bookingId}.pdf`);
    doc.pipe(res);

    // Header
    doc.fillColor('#1d2b3e').fontSize(28).font('Helvetica-Bold').text('SKILLPILOT', 50, 50);
    doc.fillColor('#004944').fontSize(11).font('Helvetica').text('Mentorship Platform', 50, 85);
    doc
      .fillColor('#1d2b3e')
      .fontSize(22)
      .font('Helvetica-Bold')
      .text('INVOICE', 400, 50, { align: 'right' });
    doc
      .fillColor('#64748b')
      .fontSize(10)
      .font('Helvetica')
      .text(`#${booking.bookingId}`, 400, 80, { align: 'right' });

    doc.moveTo(50, 110).lineTo(545, 110).strokeColor('#e2e8f0').stroke();

    // Parties
    doc.fillColor('#1d2b3e').fontSize(11).font('Helvetica-Bold').text('Billed To:', 50, 130);
    doc.fillColor('#374151').fontSize(10).font('Helvetica').text(booking.userId.name, 50, 148);
    doc.text(booking.userId.email, 50, 163);

    doc.fillColor('#1d2b3e').fontSize(11).font('Helvetica-Bold').text('Mentor:', 350, 130);
    doc
      .fillColor('#374151')
      .fontSize(10)
      .font('Helvetica')
      .text(booking.mentorProfileId?.displayName || booking.mentorId.name, 350, 148);

    doc.moveTo(50, 195).lineTo(545, 195).strokeColor('#e2e8f0').stroke();

    // Session details
    const schedDate = new Date(booking.scheduledAt).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
    const schedTime = new Date(booking.scheduledAt).toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
    });

    doc
      .fillColor('#64748b')
      .fontSize(9)
      .font('Helvetica-Bold')
      .text('SERVICE', 50, 215)
      .text('DATE', 200, 215)
      .text('DURATION', 350, 215)
      .text('STATUS', 460, 215);
    doc.moveTo(50, 228).lineTo(545, 228).strokeColor('#e2e8f0').stroke();
    doc
      .fillColor('#1d2b3e')
      .fontSize(10)
      .font('Helvetica')
      .text(booking.serviceId?.title || 'Mentorship Session', 50, 240)
      .text(`${schedDate} ${schedTime}`, 200, 240)
      .text(`${booking.duration} min`, 350, 240)
      .text(booking.paymentStatus.toUpperCase(), 460, 240);

    doc.moveTo(50, 260).lineTo(545, 260).strokeColor('#e2e8f0').stroke();

    // Pricing
    doc
      .fillColor('#374151')
      .fontSize(10)
      .font('Helvetica')
      .text('Base Price', 350, 290)
      .text(`₹${booking.originalPrice}`, 450, 290, { align: 'right', width: 95 });
    if (booking.paidAmount < booking.originalPrice) {
      const disc = booking.originalPrice - booking.paidAmount;
      doc
        .fillColor('#059669')
        .text('Discount', 350, 308)
        .text(`-₹${disc}`, 450, 308, { align: 'right', width: 95 });
    }
    doc
      .fillColor('#374151')
      .text('Platform Fee', 350, 326)
      .text(`₹${booking.platformFee || 0}`, 450, 326, { align: 'right', width: 95 });
    doc.moveTo(350, 345).lineTo(545, 345).strokeColor('#1d2b3e').stroke();
    doc
      .fillColor('#1d2b3e')
      .fontSize(13)
      .font('Helvetica-Bold')
      .text('TOTAL', 350, 358)
      .text(`₹${booking.paidAmount}`, 450, 358, { align: 'right', width: 95 });

    // Footer
    doc.moveTo(50, 700).lineTo(545, 700).strokeColor('#e2e8f0').stroke();
    doc
      .fillColor('#94a3b8')
      .fontSize(9)
      .font('Helvetica')
      .text('SkillPilot · This is a computer generated invoice.', 50, 715, {
        align: 'center',
        width: 495,
      });

    doc.end();
  } catch (err) {
    console.error('Invoice error:', err);
    res.status(500).json({ error: 'Failed to generate invoice' });
  }
});

// ─── 5. Mentor Earnings Analytics ──────────────────────────────────────────────
// GET /api/payments/earnings
router.get('/earnings', verifyToken, isMentor, async (req, res) => {
  try {
    const mentorId = req.user._id;
    const now = new Date();

    // Last 6 months range
    const sixMonthsAgo = new Date(now);
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const bookings = await MentorBooking.find({
      mentorId,
      paymentStatus: 'paid',
      scheduledAt: { $gte: sixMonthsAgo },
    }).populate('serviceId', 'title serviceType');

    // Monthly breakdown
    const monthlyMap = {};
    const serviceMap = {};
    let totalEarnings = 0;

    bookings.forEach(b => {
      const monthKey = new Date(b.scheduledAt).toLocaleDateString('en-IN', {
        month: 'short',
        year: '2-digit',
      });
      monthlyMap[monthKey] = (monthlyMap[monthKey] || 0) + (b.mentorEarning || b.paidAmount);
      const svcLabel = b.serviceId?.title || 'General';
      serviceMap[svcLabel] = (serviceMap[svcLabel] || 0) + (b.mentorEarning || b.paidAmount);
      totalEarnings += b.mentorEarning || b.paidAmount;
    });

    // This month vs last month
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const thisMonthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);

    const thisMonthTotal = bookings
      .filter(
        b => new Date(b.scheduledAt) >= thisMonthStart && new Date(b.scheduledAt) <= thisMonthEnd
      )
      .reduce((s, b) => s + (b.mentorEarning || b.paidAmount), 0);

    const lastMonthTotal = bookings
      .filter(
        b => new Date(b.scheduledAt) >= lastMonthStart && new Date(b.scheduledAt) <= lastMonthEnd
      )
      .reduce((s, b) => s + (b.mentorEarning || b.paidAmount), 0);

    const growth =
      lastMonthTotal > 0
        ? Math.round(((thisMonthTotal - lastMonthTotal) / lastMonthTotal) * 100)
        : null;

    const pendingCount = await MentorBooking.countDocuments({
      mentorId,
      status: { $in: ['pending', 'confirmed'] },
      paymentStatus: 'paid',
    });

    const monthlyData = Object.entries(monthlyMap).map(([month, amount]) => ({ month, amount }));
    const serviceData = Object.entries(serviceMap).map(([name, amount]) => ({ name, amount }));

    res.json({
      totalEarnings,
      thisMonth: thisMonthTotal,
      lastMonth: lastMonthTotal,
      growthPercent: growth,
      pendingPayouts: pendingCount,
      monthlyData,
      serviceData,
      platformFeePct: PLATFORM_FEE_PCT,
    });
  } catch (err) {
    console.error('Earnings error:', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;

// ────────────────────────────────────────────────────────────────────────────
// 6. Payment History (role-aware)
// GET /api/payments/history
// Query params: page, limit, status, search, dateFrom, dateTo
// ────────────────────────────────────────────────────────────────────────────
router.get('/history', verifyToken, async (req, res) => {
  try {
    const { role, _id: userId } = req.user;
    const { page = 1, limit = 20, status, search, dateFrom, dateTo } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    // Base query — only paid transactions
    const query = { paymentStatus: { $in: ['paid', 'refunded', 'failed'] } };

    if (role === 'Admin') {
      // Admin sees everything — no extra filter
    } else if (role === 'Mentor') {
      query.mentorId = userId;
    } else {
      // Student / default User
      query.userId = userId;
    }

    // Optional status filter
    if (status && status !== 'all') query.paymentStatus = status;

    // Optional date range
    if (dateFrom || dateTo) {
      query.createdAt = {};
      if (dateFrom) query.createdAt.$gte = new Date(dateFrom);
      if (dateTo) query.createdAt.$lte = new Date(dateTo + 'T23:59:59Z');
    }

    // Build populate chain
    let q = MentorBooking.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit))
      .populate('userId', 'name email imageUrl')
      .populate('mentorId', 'name email imageUrl')
      .populate('mentorProfileId', 'displayName profileImage handle')
      .populate('serviceId', 'title serviceType duration price')
      .populate('couponId', 'code discountType discountValue');

    let [bookings, total] = await Promise.all([q, MentorBooking.countDocuments(query)]);

    // Optional search on student/mentor name or booking ID
    if (search) {
      const s = search.toLowerCase();
      bookings = bookings.filter(
        b =>
          b.bookingId?.toLowerCase().includes(s) ||
          b.userId?.name?.toLowerCase().includes(s) ||
          b.mentorProfileId?.displayName?.toLowerCase().includes(s) ||
          b.mentorId?.name?.toLowerCase().includes(s) ||
          b.serviceId?.title?.toLowerCase().includes(s)
      );
    }

    // Summary stats (for the current filtered set — use all docs)
    const allFiltered = await MentorBooking.find(query).select(
      'paidAmount mentorEarning platformFee paymentStatus'
    );
    const summary = {
      totalTransactions: total,
      totalRevenue: allFiltered
        .filter(b => b.paymentStatus === 'paid')
        .reduce((s, b) => s + (b.paidAmount || 0), 0),
      totalRefunded: allFiltered
        .filter(b => b.paymentStatus === 'refunded')
        .reduce((s, b) => s + (b.paidAmount || 0), 0),
      platformRevenue: allFiltered
        .filter(b => b.paymentStatus === 'paid')
        .reduce((s, b) => s + (b.platformFee || 0), 0),
      mentorRevenue: allFiltered
        .filter(b => b.paymentStatus === 'paid')
        .reduce((s, b) => s + (b.mentorEarning || 0), 0),
    };

    res.json({
      transactions: bookings,
      summary,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        pages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (err) {
    console.error('Payment history error:', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
