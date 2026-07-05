// Farm routes — CRUD for farm profiles
// Public: GET all farms, GET single farm
// Private (farmer only): POST create, PUT update, DELETE deactivate

const express = require('express');
const router = express.Router();
const zipcodes = require('zipcodes');
const Farm = require('../models/Farm');
const { protect, authorizeRoles } = require('../middleware/auth');

// Shared by GET / and GET /near — category can be a comma-separated list
// (e.g. "beef,dairy"); returns null when there's nothing to filter on
const parseCategories = (category) => {
  if (!category) return null;
  const categories = category.split(',').filter(Boolean);
  return categories.length > 0 ? categories : null;
};

const EARTH_RADIUS_MILES = 3958.8;
const toRadians = (deg) => (deg * Math.PI) / 180;

// Great-circle distance between two lat/lng points, in miles
const haversineMiles = (lat1, lng1, lat2, lng2) => {
  const dLat = toRadians(lat2 - lat1);
  const dLng = toRadians(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRadians(lat1)) * Math.cos(toRadians(lat2)) * Math.sin(dLng / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return EARTH_RADIUS_MILES * c;
};

// @route   GET /api/farms
// @desc    Get all active farms — supports filtering by category (comma-separated
//          for multi-select), city, and state, plus a sort order
// @access  Public
router.get('/', async (req, res) => {
  try {
    const { category, city, state, sort } = req.query;

    // Only return active farms (isActive: true excludes soft-deleted farms)
    let query = { isActive: true };

    // $in matches a farm that sells ANY of the selected categories
    const categories = parseCategories(category);
    if (categories) query.category = { $in: categories };
    if (city) query['location.city'] = new RegExp(city, 'i');   // case-insensitive
    if (state) query['location.state'] = new RegExp(state, 'i');

    // Default to newest first; support rating and name as alternate sort orders
    let sortOption = { createdAt: -1 };
    if (sort === 'rating') sortOption = { rating: -1 };
    else if (sort === 'name') sortOption = { farmName: 1 };

    const farms = await Farm.find(query)
      .populate('owner', 'name email') // Attach owner name and email to each farm
      .sort(sortOption);

    res.status(200).json({ success: true, count: farms.length, farms });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/farms/near
// @desc    Find active farms within a radius (miles) of a point, sorted by
//          distance. The point can be given directly as lat/lng (browser
//          Geolocation) or as a ZIP code (manual fallback), resolved to a
//          centroid via the offline `zipcodes` dataset. Distance is computed
//          with the Haversine formula against each farm's own ZIP centroid —
//          a few miles of accuracy is plenty for "farms near me"; no paid
//          geocoding API needed. Registered before GET /:id so "near" is
//          never swallowed as an :id value.
// @access  Public
router.get('/near', async (req, res) => {
  try {
    const { lat, lng, zip, radius, category } = req.query;

    let originLat;
    let originLng;

    if (lat && lng) {
      originLat = parseFloat(lat);
      originLng = parseFloat(lng);
    } else if (zip) {
      const origin = zipcodes.lookup(zip);
      if (!origin) {
        return res.status(400).json({ message: 'ZIP code not recognized' });
      }
      originLat = origin.latitude;
      originLng = origin.longitude;
    } else {
      return res.status(400).json({ message: 'Provide either lat/lng or a zip code' });
    }

    const radiusMiles = parseFloat(radius) || 50;

    let query = { isActive: true };
    const categories = parseCategories(category);
    if (categories) query.category = { $in: categories };

    const farms = await Farm.find(query).populate('owner', 'name email');

    const withDistance = farms
      .map((farm) => {
        const farmZip = zipcodes.lookup(farm.location.zip);
        if (!farmZip) return null; // can't place this farm on the map — skip it
        const distance = haversineMiles(originLat, originLng, farmZip.latitude, farmZip.longitude);
        return { farm, distance };
      })
      .filter((entry) => entry !== null && entry.distance <= radiusMiles)
      .sort((a, b) => a.distance - b.distance);

    const results = withDistance.map(({ farm, distance }) => {
      const farmObj = farm.toObject();
      farmObj.distance = Math.round(distance * 10) / 10;
      return farmObj;
    });

    res.status(200).json({ success: true, count: results.length, farms: results });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/farms/:id
// @desc    Get a single farm by ID
// @access  Public
router.get('/:id', async (req, res) => {
  try {
    const farm = await Farm.findById(req.params.id)
      .populate('owner', 'name email');

    if (!farm) {
      return res.status(404).json({ message: 'Farm not found' });
    }

    res.status(200).json({ success: true, farm });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/farms
// @desc    Create a new farm profile for the logged-in farmer
// @access  Private (farmers only)
router.post('/', protect, authorizeRoles('farmer'), async (req, res) => {
  try {
    const { farmName, description, location, category, photos } = req.body;

    // Enforce the one-farm-per-farmer rule
    const existingFarm = await Farm.findOne({ owner: req.user.id });
    if (existingFarm) {
      return res.status(400).json({ message: 'You already have a farm profile' });
    }

    const farm = await Farm.create({
      owner: req.user.id,
      farmName,
      description,
      location,
      category,
      photos,
    });

    res.status(201).json({ success: true, farm });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/farms/:id
// @desc    Update a farm's details
// @access  Private (farm owner only)
router.put('/:id', protect, authorizeRoles('farmer'), async (req, res) => {
  try {
    let farm = await Farm.findById(req.params.id);

    if (!farm) {
      return res.status(404).json({ message: 'Farm not found' });
    }

    // Make sure only the farm's owner can edit it
    if (farm.owner.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to update this farm' });
    }

    // Whitelist editable fields — keeps a farmer from self-assigning rating/owner/isActive
    // (photos have their own dedicated /:id/photos endpoint, so they're excluded here too)
    const { farmName, description, location, category } = req.body;
    const updates = {};
    if (farmName !== undefined) updates.farmName = farmName;
    if (description !== undefined) updates.description = description;
    if (location !== undefined) updates.location = location;
    if (category !== undefined) updates.category = category;

    farm = await Farm.findByIdAndUpdate(req.params.id, updates, {
      new: true,           // Return the updated document
      runValidators: true, // Run schema validators on the updated fields
    });

    res.status(200).json({ success: true, farm });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/farms/:id
// @desc    Deactivate a farm (soft delete — sets isActive to false)
// @access  Private (farm owner only)
router.delete('/:id', protect, authorizeRoles('farmer'), async (req, res) => {
  try {
    const farm = await Farm.findById(req.params.id);

    if (!farm) {
      return res.status(404).json({ message: 'Farm not found' });
    }

    // Make sure only the farm's owner can deactivate it
    if (farm.owner.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to delete this farm' });
    }

    // Soft delete — the farm document stays in the DB but won't appear in public listings
    await Farm.findByIdAndUpdate(req.params.id, { isActive: false });

    res.status(200).json({ success: true, message: 'Farm deactivated successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/farms/:id/photos
// @desc    Add one photo URL to this farm's gallery (photos array)
//          The URL comes from Cloudinary after the frontend uploads it
//          via the /api/upload route — we just store the resulting URL here
// @access  Private (farm owner only)
router.post('/:id/photos', protect, authorizeRoles('farmer'), async (req, res) => {
  try {
    const { photoUrl } = req.body;

    if (!photoUrl) {
      return res.status(400).json({ message: 'Photo URL is required' });
    }

    const farm = await Farm.findById(req.params.id);

    if (!farm) {
      return res.status(404).json({ message: 'Farm not found' });
    }

    // Only the farm's owner can add photos
    if (farm.owner.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    // Cap the gallery at 12 photos so Cloudinary storage stays reasonable
    if (farm.photos.length >= 12) {
      return res.status(400).json({ message: 'Gallery limit of 12 photos reached' });
    }

    farm.photos.push(photoUrl);
    await farm.save();

    res.json({ success: true, photos: farm.photos });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/farms/:id/photos
// @desc    Remove a specific photo URL from this farm's gallery
//          The client sends the URL to remove in the request body
// @access  Private (farm owner only)
router.delete('/:id/photos', protect, authorizeRoles('farmer'), async (req, res) => {
  try {
    const { photoUrl } = req.body;

    if (!photoUrl) {
      return res.status(400).json({ message: 'Photo URL is required' });
    }

    const farm = await Farm.findById(req.params.id);

    if (!farm) {
      return res.status(404).json({ message: 'Farm not found' });
    }

    // Only the farm's owner can remove photos
    if (farm.owner.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    // Filter out the URL to remove — this handles duplicates too
    farm.photos = farm.photos.filter((p) => p !== photoUrl);
    await farm.save();

    res.json({ success: true, photos: farm.photos });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
