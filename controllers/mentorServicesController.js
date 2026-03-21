// controllers/mentorServicesController.js
// Handles all CRUD for MentorService, MentorCoupon, and custom profile sections
// Keeps mentorController.js clean by separating new Topmate-style features

const MentorService = require('../models/MentorService');
const MentorCoupon = require('../models/MentorCoupon');
const MentorProfile = require('../models/MentorProfile');
const User = require('../models/User');
const path = require('path');
const fs = require('fs');

// ═══════════════════════════════════════════════════════════════════════════
// MENTOR SERVICE CRUD
// ═══════════════════════════════════════════════════════════════════════════

/**
 * POST /api/mentor/services
 * Create a new service offering for the logged-in mentor
 */
exports.createService = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;

    // Get or create mentor profile
    const mentorProfile = await MentorProfile.findOne({ userId });
    if (!mentorProfile) {
      return res
        .status(404)
        .json({ error: 'Mentor profile not found. Please complete your mentor profile first.' });
    }

    // Check user is actually a mentor
    const user = await User.findById(userId);
    if (!user || !['Mentor', 'Admin'].includes(user.role)) {
      return res.status(403).json({ error: 'Only mentors can create services' });
    }

    const {
      serviceType,
      title,
      description,
      detailedDescription,
      coverImage,
      emoji,
      price,
      currency,
      duration,
      responseTime,
      sessionCount,
      subscriptionMonths,
      capacity,
      scheduledAt,
      courseUrl,
      referralCompanies,
      includes,
      weeklyLimit,
      sortOrder,
      isFeatured,
    } = req.body;

    // Derive isFree
    const isFree = !price || Number(price) === 0;

    const service = new MentorService({
      mentorId: userId,
      mentorProfileId: mentorProfile._id,
      serviceType,
      title,
      description,
      detailedDescription,
      coverImage: coverImage || '',
      emoji: emoji || '',
      price: Number(price) || 0,
      currency: currency || 'INR',
      isFree,
      duration: Number(duration) || 60,
      responseTime,
      sessionCount: Number(sessionCount) || 1,
      subscriptionMonths: Number(subscriptionMonths) || 1,
      capacity: capacity ? Number(capacity) : null,
      scheduledAt: scheduledAt || null,
      courseUrl,
      referralCompanies: referralCompanies || [],
      includes: includes || [],
      weeklyLimit: weeklyLimit ? Number(weeklyLimit) : null,
      sortOrder: Number(sortOrder) || 0,
      isFeatured: Boolean(isFeatured),
    });

    await service.save();
    res.status(201).json({ success: true, message: 'Service created successfully', service });
  } catch (error) {
    console.error('createService error:', error);
    if (error.name === 'ValidationError') {
      return res.status(400).json({ error: error.message });
    }
    res.status(500).json({ error: 'Failed to create service' });
  }
};

/**
 * GET /api/mentor/services/my
 * Get all services for the logged-in mentor (for dashboard, includes inactive)
 */
exports.getMyServices = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const services = await MentorService.getForMentor(userId, true); // include inactive
    res.json({ success: true, services });
  } catch (error) {
    console.error('getMyServices error:', error);
    res.status(500).json({ error: 'Failed to fetch services', details: error.message });
  }
};

/**
 * GET /api/mentor/services/:mentorId
 * Get active services for a mentor — public endpoint
 */
exports.getMentorServices = async (req, res) => {
  try {
    const { mentorId } = req.params;
    const services = await MentorService.getForMentor(mentorId, false); // active only
    res.json({ success: true, services });
  } catch (error) {
    console.error('getMentorServices error:', error);
    res.status(500).json({ error: 'Failed to fetch services' });
  }
};

/**
 * PUT /api/mentor/services/:serviceId
 * Update a service (only by owning mentor)
 */
exports.updateService = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const { serviceId } = req.params;

    const service = await MentorService.findById(serviceId);
    if (!service) return res.status(404).json({ error: 'Service not found' });
    if (service.mentorId.toString() !== userId.toString()) {
      return res.status(403).json({ error: 'Not authorised to update this service' });
    }

    const allowedFields = [
      'title',
      'description',
      'detailedDescription',
      'coverImage',
      'emoji',
      'price',
      'currency',
      'duration',
      'responseTime',
      'sessionCount',
      'subscriptionMonths',
      'capacity',
      'scheduledAt',
      'courseUrl',
      'referralCompanies',
      'includes',
      'weeklyLimit',
      'sortOrder',
      'isFeatured',
    ];

    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) {
        service[field] = req.body[field];
      }
    });

    // Recalculate isFree
    service.isFree = !service.price || Number(service.price) === 0;

    await service.save();
    res.json({ success: true, message: 'Service updated', service });
  } catch (error) {
    console.error('updateService error:', error);
    res.status(500).json({ error: 'Failed to update service' });
  }
};

/**
 * PUT /api/mentor/services/:serviceId/toggle
 * Toggle a service active/inactive
 */
exports.toggleService = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const { serviceId } = req.params;

    const service = await MentorService.findById(serviceId);
    if (!service) return res.status(404).json({ error: 'Service not found' });
    if (service.mentorId.toString() !== userId.toString()) {
      return res.status(403).json({ error: 'Not authorised' });
    }

    service.isActive = !service.isActive;
    await service.save();
    res.json({
      success: true,
      isActive: service.isActive,
      message: `Service ${service.isActive ? 'activated' : 'deactivated'}`,
    });
  } catch (error) {
    console.error('toggleService error:', error);
    res.status(500).json({ error: 'Failed to toggle service' });
  }
};

/**
 * DELETE /api/mentor/services/:serviceId
 * Delete a service (only by owning mentor)
 */
exports.deleteService = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const { serviceId } = req.params;

    const service = await MentorService.findById(serviceId);
    if (!service) return res.status(404).json({ error: 'Service not found' });
    if (service.mentorId.toString() !== userId.toString()) {
      return res.status(403).json({ error: 'Not authorised' });
    }

    await service.deleteOne();
    res.json({ success: true, message: 'Service deleted' });
  } catch (error) {
    console.error('deleteService error:', error);
    res.status(500).json({ error: 'Failed to delete service' });
  }
};

/**
 * PUT /api/mentor/services/reorder
 * Bulk reorder services (drag-and-drop)
 * Body: { order: [{ serviceId, sortOrder }] }
 */
exports.reorderServices = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const { order } = req.body;

    if (!Array.isArray(order)) return res.status(400).json({ error: 'order must be an array' });

    const updateOps = order.map(({ serviceId, sortOrder }) =>
      MentorService.findOneAndUpdate(
        { _id: serviceId, mentorId: userId },
        { sortOrder },
        { new: true }
      )
    );

    await Promise.all(updateOps);
    res.json({ success: true, message: 'Services reordered' });
  } catch (error) {
    console.error('reorderServices error:', error);
    res.status(500).json({ error: 'Failed to reorder services' });
  }
};

// ═══════════════════════════════════════════════════════════════════════════
// MENTOR PUBLIC PROFILE (by handle or id)
// ═══════════════════════════════════════════════════════════════════════════

/**
 * GET /api/mentor/profile/:handle
 * Full public mentor profile — profile + services + reviews + custom sections
 */
exports.getMentorPublicProfile = async (req, res) => {
  try {
    const { handle } = req.params;

    // Try to find by handle first, fall back to userId
    let profile = await MentorProfile.findOne({ handle, isVisible: true }).populate(
      'userId',
      'name email imageUrl mentorBadge mentorStatus jobTitle company'
    );

    // Fallback: treat handle as mongoose ObjectId or userId
    if (!profile && handle.match(/^[0-9a-fA-F]{24}$/)) {
      profile = await MentorProfile.findOne({
        $or: [{ _id: handle }, { userId: handle }],
        isVisible: true,
      }).populate('userId', 'name email imageUrl mentorBadge mentorStatus jobTitle company');
    }

    if (!profile) return res.status(404).json({ error: 'Mentor not found' });

    // Fetch active services, sorted by sortOrder
    let services = await MentorService.find({
      mentorId: profile.userId._id,
      isActive: true,
    }).sort({ sortOrder: 1, createdAt: 1 });

    // ── FALLBACK: synthesise services from pricingPlans when no MentorService docs exist ──
    if (services.length === 0 && profile.pricingPlans && profile.pricingPlans.length > 0) {
      const sessionCounts = { '1 Month': 4, '3 Months': 12, '6 Months': 24 };
      services = profile.pricingPlans.map((plan, idx) => ({
        _id: `plan_${idx}`,
        serviceType: 'one_on_one',
        title: `1-on-1 Mentorship — ${plan.duration}`,
        description:
          plan.features && plan.features.length > 0
            ? plan.features.join(' • ')
            : `Personal ${plan.duration} mentorship plan with ${profile.displayName}`,
        price: plan.price,
        currency: 'INR',
        isFree: plan.price === 0,
        duration: 60,
        sessionCount: sessionCounts[plan.duration] || 1,
        includes: plan.features || [],
        sortOrder: idx,
        isActive: true,
        isFeatured: idx === 0,
        _synthetic: true,
      }));
    }

    // Also prepend a free Discovery Call if trialSession is enabled
    if (profile.trialSession && profile.trialSession.available) {
      const hasDiscovery = services.some(s => s.serviceType === 'discovery_call');
      if (!hasDiscovery) {
        services = [
          {
            _id: 'trial_session',
            serviceType: 'discovery_call',
            title: 'Free Discovery Call',
            description:
              profile.trialSession.description ||
              '30-minute intro call to discuss your goals and how I can help you.',
            price: profile.trialSession.price || 0,
            currency: 'INR',
            isFree: !profile.trialSession.price || profile.trialSession.price === 0,
            duration: 30,
            includes: ['Goal discussion', 'Personalised roadmap', 'Q&A'],
            sortOrder: -1,
            isActive: true,
            isFeatured: true,
            _synthetic: true,
          },
          ...services,
        ];
      }
    }

    // Group services by category for the frontend
    const groupedServices = {
      live: services.filter(s =>
        [
          'one_on_one',
          'quick_chat',
          'mock_interview',
          'career_guidance',
          'discovery_call',
          'coaching_series',
        ].includes(s.serviceType)
      ),
      async: services.filter(s =>
        ['priority_dm', 'resume_review', 'portfolio_review', 'ama'].includes(s.serviceType)
      ),
      group: services.filter(s => ['workshop', 'webinar'].includes(s.serviceType)),
      products: services.filter(s => ['course', 'referral', 'custom'].includes(s.serviceType)),
    };

    res.json({
      success: true,
      profile: {
        ...profile.toObject(),
        services,
        groupedServices,
      },
    });
  } catch (error) {
    console.error('getMentorPublicProfile error:', error);
    res.status(500).json({ error: 'Failed to fetch mentor profile' });
  }
};

/**
 * GET /api/mentor/search
 * Search & filter mentors
 * Query params: q, domain, serviceType, minRating, maxPrice, minPrice, menteeType, sort, page, limit
 */
exports.searchMentors = async (req, res) => {
  try {
    const {
      q,
      domain,
      serviceType,
      minRating,
      maxPrice,
      minPrice,
      menteeType,
      city,
      language,
      sort = 'featured',
      page = 1,
      limit = 20,
    } = req.query;

    const query = { isVisible: true };

    // Full-text search on tags, expertise, display name
    if (q) {
      const searchRegex = new RegExp(q, 'i');
      query.$or = [
        { displayName: searchRegex },
        { expertise: searchRegex },
        { searchTags: searchRegex },
        { tagline: searchRegex },
      ];
    }

    if (domain) {
      query.targetingDomains = { $in: Array.isArray(domain) ? domain : [domain] };
    }

    if (menteeType) {
      query.preferredMenteeType = menteeType;
    }

    if (minRating) {
      query.averageRating = { $gte: Number(minRating) };
    }

    if (city) {
      query['location.city'] = new RegExp(city, 'i');
    }

    if (language) {
      query.languages = { $in: Array.isArray(language) ? language : [language] };
    }

    // Sort options
    let sortObj = {};
    switch (sort) {
      case 'rating':
        sortObj = { averageRating: -1, totalReviews: -1 };
        break;
      case 'bookings':
        sortObj = { totalMentees: -1 };
        break;
      case 'newest':
        sortObj = { createdAt: -1 };
        break;
      case 'price_asc':
        sortObj = { 'pricingPlans.price': 1 };
        break;
      default:
        sortObj = { featured: -1, averageRating: -1, totalMentees: -1 }; // featured first
    }

    const skip = (Number(page) - 1) * Number(limit);

    let mentorProfiles = await MentorProfile.find(query)
      .sort(sortObj)
      .skip(skip)
      .limit(Number(limit))
      .populate('userId', 'name email imageUrl mentorBadge mentorStatus');

    // If filtering by service type, filter after fetching (or use aggregation for perf)
    // For simplicity here we do post-filter; for large datasets use aggregation
    let results = mentorProfiles;
    if (serviceType) {
      let serviceTypes = serviceType;
      if (typeof serviceType === 'string') {
        serviceTypes = serviceType
          .split(',')
          .map(s => s.trim())
          .filter(Boolean);
      }

      const mentorIds = mentorProfiles.map(p => p.userId._id);
      const queryService =
        Array.isArray(serviceTypes) && serviceTypes.length > 0
          ? { $in: [].concat(serviceTypes) }
          : serviceType;

      const matchingServices = await MentorService.find({
        mentorId: { $in: mentorIds },
        serviceType: queryService,
        isActive: true,
      }).distinct('mentorId');

      const matchingSet = new Set(matchingServices.map(id => id.toString()));
      results = mentorProfiles.filter(p => matchingSet.has(p.userId._id.toString()));
    }

    // Price filter: check against their cheapest service
    let filtered = results;
    if (minPrice || maxPrice) {
      const mentorIds = results.map(p => p.userId._id);
      const priceQuery = {
        mentorId: { $in: mentorIds },
        isActive: true,
      };

      if (maxPrice !== undefined && Number(maxPrice) === 0) {
        priceQuery.isFree = true;
      } else {
        priceQuery.isFree = false;
        if (minPrice) priceQuery.price = { ...(priceQuery.price || {}), $gte: Number(minPrice) };
        if (maxPrice) priceQuery.price = { ...(priceQuery.price || {}), $lte: Number(maxPrice) };
      }

      const affordable = await MentorService.find(priceQuery).distinct('mentorId');
      const affordableSet = new Set(affordable.map(id => id.toString()));
      filtered = results.filter(p => affordableSet.has(p.userId._id.toString()));
    }

    // Attach starting price + top service type to each mentor card
    const mentorIds = filtered.map(p => p.userId._id);
    const cheapestServices = await MentorService.aggregate([
      { $match: { mentorId: { $in: mentorIds }, isActive: true, isFree: false } },
      { $sort: { price: 1 } },
      {
        $group: {
          _id: '$mentorId',
          startingPrice: { $first: '$price' },
          currency: { $first: '$currency' },
          topService: { $first: '$serviceType' },
        },
      },
    ]);

    const priceMap = {};
    cheapestServices.forEach(s => {
      priceMap[s._id.toString()] = s;
    });

    const enriched = filtered.map(profile => {
      const obj = profile.toObject();
      const priceInfo = priceMap[profile.userId._id.toString()];
      return {
        ...obj,
        startingPrice: priceInfo?.startingPrice ?? 0,
        currency: priceInfo?.currency ?? 'INR',
        topServiceType: priceInfo?.topService ?? null,
      };
    });

    const total = await MentorProfile.countDocuments(query);

    // Fetch unique domains available in database for visible mentors
    const availableDomains = await MentorProfile.distinct('targetingDomains', { isVisible: true });

    res.json({
      success: true,
      mentors: enriched,
      availableDomains: availableDomains.filter(Boolean),
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(total / Number(limit)),
      },
    });
  } catch (error) {
    console.error('searchMentors error:', error);
    res.status(500).json({ error: 'Search failed' });
  }
};

// ═══════════════════════════════════════════════════════════════════════════
// COUPON MANAGEMENT
// ═══════════════════════════════════════════════════════════════════════════

/**
 * POST /api/mentor/coupons
 * Create a discount coupon
 */
exports.createCoupon = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const {
      code,
      discountType,
      discountValue,
      maxDiscountCap,
      appliesTo,
      specificServiceIds,
      maxUses,
      perUserLimit,
      validFrom,
      validUntil,
    } = req.body;

    // Validate the code is uppercase-friendly
    const normalizedCode = code?.trim().toUpperCase();
    if (!normalizedCode) return res.status(400).json({ error: 'Coupon code is required' });

    const coupon = new MentorCoupon({
      mentorId: userId,
      code: normalizedCode,
      discountType,
      discountValue: Number(discountValue),
      maxDiscountCap: maxDiscountCap ? Number(maxDiscountCap) : null,
      appliesTo: appliesTo || 'all_services',
      specificServiceIds: specificServiceIds || [],
      maxUses: maxUses ? Number(maxUses) : null,
      perUserLimit: Number(perUserLimit) || 1,
      validFrom: validFrom || Date.now(),
      validUntil: validUntil || null,
    });

    await coupon.save();
    res.status(201).json({ success: true, message: 'Coupon created', coupon });
  } catch (error) {
    console.error('createCoupon error:', error);
    if (error.code === 11000) {
      return res.status(400).json({ error: 'You already have a coupon with this code' });
    }
    res.status(500).json({ error: 'Failed to create coupon' });
  }
};

/**
 * GET /api/mentor/coupons
 * Get all coupons (with redemption stats) for a mentor
 */
exports.getMyCoupons = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const coupons = await MentorCoupon.find({ mentorId: userId })
      .sort({ createdAt: -1 })
      .populate('specificServiceIds', 'title serviceType price');

    res.json({ success: true, coupons });
  } catch (error) {
    console.error('getMyCoupons error:', error);
    res.status(500).json({ error: 'Failed to fetch coupons' });
  }
};

/**
 * PUT /api/mentor/coupons/:id
 * Update a coupon
 */
exports.updateCoupon = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const coupon = await MentorCoupon.findOne({ _id: req.params.id, mentorId: userId });
    if (!coupon) return res.status(404).json({ error: 'Coupon not found' });

    const fields = [
      'discountType',
      'discountValue',
      'maxDiscountCap',
      'appliesTo',
      'specificServiceIds',
      'maxUses',
      'perUserLimit',
      'validFrom',
      'validUntil',
      'isActive',
    ];
    fields.forEach(f => {
      if (req.body[f] !== undefined) coupon[f] = req.body[f];
    });

    await coupon.save();
    res.json({ success: true, message: 'Coupon updated', coupon });
  } catch (error) {
    console.error('updateCoupon error:', error);
    res.status(500).json({ error: 'Failed to update coupon' });
  }
};

/**
 * DELETE /api/mentor/coupons/:id
 * Delete a coupon
 */
exports.deleteCoupon = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const coupon = await MentorCoupon.findOne({ _id: req.params.id, mentorId: userId });
    if (!coupon) return res.status(404).json({ error: 'Coupon not found' });
    await coupon.deleteOne();
    res.json({ success: true, message: 'Coupon deleted' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete coupon' });
  }
};

/**
 * POST /api/coupons/validate
 * Public endpoint — validate a coupon code at checkout
 * Body: { code, mentorId, serviceId, userId }
 */
exports.validateCoupon = async (req, res) => {
  try {
    const { code, mentorId, serviceId } = req.body;
    const userId = req.user?._id || req.user?.id || req.body.userId;

    if (!code || !mentorId || !serviceId) {
      return res.status(400).json({ error: 'code, mentorId, and serviceId are required' });
    }

    // Get service to know original price
    const service = await MentorService.findById(serviceId);
    if (!service || !service.isActive) {
      return res.status(404).json({ error: 'Service not found or inactive' });
    }

    const result = await MentorCoupon.validateCoupon({
      code,
      mentorId,
      serviceId,
      userId,
      originalPrice: service.price,
    });

    if (!result.valid) {
      return res.status(400).json({ success: false, ...result });
    }

    res.json({ success: true, ...result });
  } catch (error) {
    console.error('validateCoupon error:', error);
    res.status(500).json({ error: 'Coupon validation failed' });
  }
};

// ═══════════════════════════════════════════════════════════════════════════
// CUSTOM PROFILE SECTIONS
// ═══════════════════════════════════════════════════════════════════════════

/**
 * POST /api/mentor/profile/sections
 * Add a custom content section to mentor profile
 */
exports.addCustomSection = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const profile = await MentorProfile.findOne({ userId });
    if (!profile) return res.status(404).json({ error: 'Mentor profile not found' });

    const { title, content, images, sortOrder } = req.body;
    profile.customSections.push({
      title,
      content,
      images: images || [],
      sortOrder: Number(sortOrder) || profile.customSections.length,
      isVisible: true,
    });

    await profile.save();
    const newSection = profile.customSections[profile.customSections.length - 1];
    res.status(201).json({ success: true, message: 'Section added', section: newSection });
  } catch (error) {
    console.error('addCustomSection error:', error);
    res.status(500).json({ error: 'Failed to add section' });
  }
};

/**
 * PUT /api/mentor/profile/sections/:sectionId
 * Update a custom section
 */
exports.updateCustomSection = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const profile = await MentorProfile.findOne({ userId });
    if (!profile) return res.status(404).json({ error: 'Mentor profile not found' });

    const section = profile.customSections.id(req.params.sectionId);
    if (!section) return res.status(404).json({ error: 'Section not found' });

    const { title, content, images, sortOrder, isVisible } = req.body;
    if (title !== undefined) section.title = title;
    if (content !== undefined) section.content = content;
    if (images !== undefined) section.images = images;
    if (sortOrder !== undefined) section.sortOrder = sortOrder;
    if (isVisible !== undefined) section.isVisible = isVisible;

    await profile.save();
    res.json({ success: true, message: 'Section updated', section });
  } catch (error) {
    console.error('updateCustomSection error:', error);
    res.status(500).json({ error: 'Failed to update section' });
  }
};

/**
 * DELETE /api/mentor/profile/sections/:sectionId
 * Delete a custom section
 */
exports.deleteCustomSection = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const profile = await MentorProfile.findOne({ userId });
    if (!profile) return res.status(404).json({ error: 'Mentor profile not found' });

    profile.customSections = profile.customSections.filter(
      s => s._id.toString() !== req.params.sectionId
    );

    await profile.save();
    res.json({ success: true, message: 'Section deleted' });
  } catch (error) {
    console.error('deleteCustomSection error:', error);
    res.status(500).json({ error: 'Failed to delete section' });
  }
};

/**
 * POST /api/mentor/profile/upload-image
 * Upload an image for a custom section
 * Uses multer — expects a 'file' field in multipart/form-data
 */
exports.uploadSectionImage = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No image file provided' });

    // Build URL from uploads path
    const imageUrl = `${process.env.BACKEND_URL || ''}/uploads/${req.file.filename}`;
    res.json({ success: true, imageUrl, filename: req.file.filename });
  } catch (error) {
    console.error('uploadSectionImage error:', error);
    res.status(500).json({ error: 'Image upload failed' });
  }
};

// ═══════════════════════════════════════════════════════════════════════════
// ADMIN — MENTOR APPLICATION APPROVAL
// ═══════════════════════════════════════════════════════════════════════════

/**
 * GET /api/admin/mentor-applications
 * List all mentor applications: pending, approved, rejected
 * Admin only
 */
exports.adminListMentorApplications = async (req, res) => {
  try {
    const { status = 'pending', page = 1, limit = 20 } = req.query;

    // Query users who applied to be mentors
    const userQuery = { role: 'Mentor' };
    if (status !== 'all') userQuery.mentorStatus = status;

    const skip = (Number(page) - 1) * Number(limit);
    const total = await User.countDocuments(userQuery);

    const users = await User.find(userQuery)
      .select('name email imageUrl mentorStatus createdAt mentorAppliedAt mentorRejectionReason')
      .sort({ mentorAppliedAt: -1, createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    // Attach mentor profiles
    const userIds = users.map(u => u._id);
    const profiles = await MentorProfile.find({ userId: { $in: userIds } }).select(
      'handle displayName tagline expertise targetingDomains jobTitle company isVisible'
    );

    const profileMap = {};
    profiles.forEach(p => {
      profileMap[p.userId.toString()] = p;
    });

    const applications = users.map(u => ({
      ...u.toObject(),
      mentorProfile: profileMap[u._id.toString()] || null,
    }));

    res.json({
      success: true,
      applications,
      pagination: { total, page: Number(page), totalPages: Math.ceil(total / Number(limit)) },
    });
  } catch (error) {
    console.error('adminListMentorApplications error:', error);
    res.status(500).json({ error: 'Failed to list applications' });
  }
};

/**
 * POST /api/admin/mentor-applications/:userId/approve
 * Approve a mentor application — sets mentorStatus = 'approved' and isVisible = true on profile
 * Admin only
 */
exports.adminApproveMentor = async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId);
    if (!user || user.role !== 'Mentor') {
      return res.status(404).json({ error: 'Mentor application not found' });
    }

    user.mentorStatus = 'approved';
    user.mentorApprovedAt = new Date();
    user.mentorRejectionReason = undefined;
    await user.save();

    // Make the profile visible
    await MentorProfile.findOneAndUpdate({ userId }, { isVisible: true });

    res.json({
      success: true,
      message: `${user.name}'s mentor application approved. Their profile is now live.`,
    });
  } catch (error) {
    console.error('adminApproveMentor error:', error);
    res.status(500).json({ error: 'Failed to approve application' });
  }
};

/**
 * POST /api/admin/mentor-applications/:userId/reject
 * Reject a mentor application — stores rejection reason in user record
 * Body: { reason }
 * Admin only
 */
exports.adminRejectMentor = async (req, res) => {
  try {
    const { userId } = req.params;
    const { reason = 'Application does not meet requirements at this time.' } = req.body;

    const user = await User.findById(userId);
    if (!user || user.role !== 'Mentor') {
      return res.status(404).json({ error: 'Mentor application not found' });
    }

    user.mentorStatus = 'rejected';
    user.mentorRejectionReason = reason;
    await user.save();

    // Hide the profile
    await MentorProfile.findOneAndUpdate({ userId }, { isVisible: false });

    res.json({ success: true, message: `${user.name}'s application rejected.`, reason });
  } catch (error) {
    console.error('adminRejectMentor error:', error);
    res.status(500).json({ error: 'Failed to reject application' });
  }
};

/**
 * GET /api/mentor/my-status
 * Returns the logged-in user's own mentorStatus + basic profile info
 * Used by the frontend to show pending / approved / rejected banners
 */
exports.getMyMentorStatus = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const user = await User.findById(userId).select(
      'name mentorStatus mentorAppliedAt mentorApprovedAt mentorRejectionReason'
    );
    const profile = await MentorProfile.findOne({ userId }).select('handle displayName isVisible');

    res.json({
      success: true,
      mentorStatus: user?.mentorStatus || null,
      mentorAppliedAt: user?.mentorAppliedAt,
      mentorApprovedAt: user?.mentorApprovedAt,
      rejectionReason: user?.mentorRejectionReason,
      profile: profile || null,
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch mentor status' });
  }
};

// Submit application to become a mentor
exports.applyToBeMentor = async (req, res) => {
  try {
    const userId = req.user?.id || req.user?._id;

    const existingProfile = await MentorProfile.findOne({ userId });
    if (existingProfile) {
      return res.status(400).json({
        success: false,
        message: 'Mentor application already submitted or profile exists',
      });
    }

    const {
      displayName,
      handle,
      tagline,
      bio,
      city,
      country,
      profileImage,
      languages,
      jobTitle,
      company,
      yearsExp,
      linkedIn,
      github,
      twitter,
      portfolio,
      expertise,
      targetingDomains,
      searchTags,
      menteeType,
      referralsAvailable,
      topCompanies,
    } = req.body;

    // Check if handle is already taken
    if (handle) {
      const existingHandle = await MentorProfile.findOne({ handle });
      if (existingHandle) {
        return res.status(400).json({ success: false, message: 'This handle is already taken' });
      }
    }

    const newProfile = new MentorProfile({
      userId,
      displayName: displayName || 'Mentor',
      handle,
      tagline,
      bio,
      location: { city, country },
      profileImage,
      languages: languages || ['English'],
      expertise: expertise || [],
      targetingDomains: targetingDomains || [],
      preferredMenteeType: menteeType || [],
      referralsInTopCompanies: referralsAvailable,
      topCompanies: topCompanies || [],
      socialLinks: {
        linkedin: linkedIn,
        github,
        twitter,
        portfolio,
      },
      approvalStatus: 'pending',
      isVisible: false,
      isActive: false,
    });

    await newProfile.save();

    await User.findByIdAndUpdate(userId, {
      jobTitle,
      companiesJoined: company,
      experience: yearsExp,
      imageUrl: profileImage,
    });

    res.status(201).json({
      success: true,
      message: 'Mentor application submitted successfully and is pending approval.',
    });
  } catch (error) {
    console.error('Error in applyToBeMentor:', error);
    res.status(500).json({ success: false, message: 'Server error', error: error.message });
  }
};
