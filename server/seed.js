// seed.js — populates the database with sample Texas farms and listings
// Run with: node seed.js
// To delete only the seed data once real users/farmers have joined: node seed.js --remove

require('dotenv').config();
const crypto = require('crypto');
const path = require('path');
const mongoose = require('mongoose');
const cloudinary = require('./config/cloudinary');
const Farm = require('./models/Farm');
const Listing = require('./models/Listing');
const User = require('./models/User');

// The single placeholder account used before each farm had its own seed
// farmer — deleted on reseed so it doesn't linger as an orphan
const LEGACY_SEED_FARMER_EMAIL = 'seedfarmer@farmtable.dev';

const SEED_IMAGES_DIR = path.join(__dirname, '..', 'client', 'src', 'images.jpg');

// ─── Connect to MongoDB ───────────────────────────────────────────────────────
const connectDB = async () => {
  const conn = await mongoose.connect(process.env.MONGO_URI, {
    tls: true,
    tlsAllowInvalidCertificates: false,
  });
  console.log(`MongoDB Connected: ${conn.connection.host}`);
};

// Uploads one local seed image to Cloudinary. A stable public_id (the
// filename, minus extension) means reseeding overwrites the same asset
// instead of piling up duplicates every time this script runs.
const uploadSeedImage = async (filename) => {
  const result = await cloudinary.uploader.upload(
    path.join(SEED_IMAGES_DIR, filename),
    {
      folder: 'cattle-and-crop/seed',
      public_id: path.parse(filename).name,
      overwrite: true,
    }
  );
  return result.secure_url;
};

// Finds or creates a dedicated seed farmer account by a stable email, so
// reseeding is idempotent and each farm has its own distinct-looking owner
// instead of one shared "Seed Farmer" placeholder.
const findOrCreateSeedFarmer = async (name, email) => {
  let farmer = await User.findOne({ email });

  if (!farmer) {
    // Nothing should ever need to log into this account — it only exists to
    // satisfy the required `owner` field on Farm/Listing — so its password
    // is a random value that's never written down anywhere.
    const bcrypt = require('bcryptjs');
    const randomPassword = crypto.randomBytes(16).toString('hex');
    const hashed = await bcrypt.hash(randomPassword, 10);
    farmer = await User.create({
      name,
      email,
      password: hashed,
      role: 'farmer',
      isSeed: true,
    });
  } else if (!farmer.isSeed) {
    // Found an account from before the isSeed flag existed — flag it now so
    // seed.js --remove can find and delete it later
    farmer.isSeed = true;
    await farmer.save();
  }

  return farmer;
};

// ─── Seed Data ────────────────────────────────────────────────────────────────

const seedData = async () => {
  try {
    // Refuse to run against production unless the caller explicitly opts in with --force
    if (process.env.NODE_ENV === 'production' && !process.argv.includes('--force')) {
      console.error(
        'Refusing to run seed.js with NODE_ENV=production. ' +
        'Re-run with --force if this is really what you want.'
      );
      process.exit(1);
    }

    await connectDB();

    // Step 1 — Clear only previously-seeded farms/listings so this is safe to
    // re-run at any point without touching real farmers' data
    await Farm.deleteMany({ isSeed: true });
    await Listing.deleteMany({ isSeed: true });
    console.log('Cleared existing seed farms and listings...');

    // Each farm now has its own seed farmer account (see below), so the old
    // single shared placeholder is no longer used — remove it if present
    await User.deleteOne({ email: LEGACY_SEED_FARMER_EMAIL });

    // Step 2 — Upload the local sample photos to Cloudinary once, keyed by
    // what they actually depict, so they can be assigned to matching farms
    console.log('Uploading seed farm photos...');
    const images = {
      produceCrate: await uploadSeedImage('Social_media_food_promo.jpg'),
      tomatoHarvest: await uploadSeedImage('social_media_promo_v8.jpg'),
      cornStalk: await uploadSeedImage('social_media_promo_v9.jpg'),
      strawberries: await uploadSeedImage('social_media_promo_v11.jpg'),
      chickenFlock: await uploadSeedImage('social_media_v3.jpg'),
      sheepChickens: await uploadSeedImage('social_media_promo_v2.jpg'),
      tractorField: await uploadSeedImage('social_media_promo.jpg'),
    };
    console.log('Seed photos uploaded.');

    // Step 3 — Find or create a dedicated farmer account for each farm
    const wyatt = await findOrCreateSeedFarmer('Wyatt Coleman', 'wyatt.coleman.seed@farmtable.dev');
    const bettySue = await findOrCreateSeedFarmer('Betty Sue Whitfield', 'bettysue.whitfield.seed@farmtable.dev');
    const maria = await findOrCreateSeedFarmer('Maria Delgado', 'maria.delgado.seed@farmtable.dev');
    const robert = await findOrCreateSeedFarmer('Robert Hensley', 'robert.hensley.seed@farmtable.dev');
    console.log('Seed farmer accounts ready...');

    // Step 4 — Create sample Texas farms, each with its own owner and photos
    // that actually match what the farm sells (Hill Country Honey Co. has no
    // dedicated photo since none of the source images show bees or hives —
    // it falls back to the app's existing placeholder icon instead)
    const farms = await Farm.insertMany([
      {
        owner: wyatt._id,
        isSeed: true,
        farmName: 'Lone Star Grass Farm',
        description:
          'Run by fourth-generation rancher Wyatt Coleman in the Texas Hill Country, we raise 100% grass-fed, pasture-raised Angus beef with no hormones or antibiotics. Our cattle roam freely on 400 acres of native Texas grasses.',
        location: { city: 'Fredericksburg', state: 'TX', zip: '78624' },
        photos: [images.tractorField],
        category: ['beef'],
        subscriptionTier: 'pro',
        rating: 4.8,
        isActive: true,
      },
      {
        owner: bettySue._id,
        isSeed: true,
        farmName: 'Hill Country Honey Co.',
        description:
          'Beekeeper Betty Sue Whitfield has tended hives in the Texas Hill Country for over 20 years, producing raw, unfiltered wildflower honey. Our bees pollinate native wildflowers including bluebonnets, Indian paintbrush, and cedar.',
        location: { city: 'Kerrville', state: 'TX', zip: '78028' },
        photos: [],
        category: ['honey'],
        subscriptionTier: 'pro',
        rating: 4.9,
        isActive: true,
      },
      {
        owner: maria._id,
        isSeed: true,
        farmName: 'Rio Grande Valley Fresh',
        description:
          'Maria Delgado grows certified organic produce in the fertile Rio Grande Valley, where the warm South Texas climate means seasonal vegetables, citrus, and herbs year-round. Straight from her fields to your table.',
        location: { city: 'McAllen', state: 'TX', zip: '78501' },
        photos: [images.produceCrate, images.tomatoHarvest, images.cornStalk, images.strawberries],
        category: ['produce'],
        subscriptionTier: 'free',
        rating: 4.6,
        isActive: true,
      },
      {
        owner: robert._id,
        isSeed: true,
        farmName: 'Central Texas Dairy',
        description:
          'Robert Hensley runs a small-batch raw dairy outside Waco, producing fresh whole milk, cream, and artisan cheeses from pasture-raised Jersey cows never treated with rBST. Farm pickup available daily.',
        location: { city: 'Waco', state: 'TX', zip: '76701' },
        photos: [images.chickenFlock, images.sheepChickens],
        category: ['dairy', 'eggs'],
        subscriptionTier: 'free',
        rating: 4.7,
        isActive: true,
      },
    ]);

    console.log(`Created ${farms.length} farms...`);

    // Step 5 — Create sample listings tied to the farms above
    await Listing.insertMany([
      // Lone Star Grass Farm listings
      {
        farm: farms[0]._id,
        owner: wyatt._id,
        isSeed: true,
        title: 'Grass-Fed Ground Beef',
        description:
          '100% grass-fed and grass-finished ground beef. Rich in Omega-3s and CLA. Perfect for burgers, tacos, or chili. Packaged in 1 lb vacuum-sealed portions.',
        category: 'beef',
        pricePerUnit: 12,
        unit: 'lb',
        quantityAvailable: 80,
        photos: [],
        harvestDate: new Date('2025-05-15'),
        isAvailable: true,
      },
      {
        farm: farms[0]._id,
        owner: wyatt._id,
        isSeed: true,
        title: 'Quarter Beef Share',
        description:
          'Reserve a quarter of a whole grass-fed Angus beef. Includes all cuts: ribeye, sirloin, ground beef, brisket, and more. Processed and vacuum-sealed at a USDA-inspected facility.',
        category: 'beef',
        pricePerUnit: 850,
        unit: 'quarter',
        quantityAvailable: 6,
        photos: [],
        isAvailable: true,
      },

      // Hill Country Honey listings
      {
        farm: farms[1]._id,
        owner: bettySue._id,
        isSeed: true,
        title: 'Raw Wildflower Honey',
        description:
          'Unfiltered, unheated raw honey harvested from Texas Hill Country wildflowers. Loaded with natural enzymes, pollen, and antioxidants. Rich amber color with a complex floral flavor.',
        category: 'honey',
        pricePerUnit: 18,
        unit: 'each',
        quantityAvailable: 40,
        photos: [],
        harvestDate: new Date('2025-04-20'),
        isAvailable: true,
      },

      // Rio Grande Valley listings
      {
        farm: farms[2]._id,
        owner: maria._id,
        isSeed: true,
        title: 'Seasonal Veggie Bundle',
        description:
          'Weekly harvest bundle featuring whatever is freshest from our fields. Typically includes 6-8 varieties of vegetables such as tomatoes, squash, peppers, greens, and herbs.',
        category: 'produce',
        pricePerUnit: 35,
        unit: 'bundle',
        quantityAvailable: 20,
        photos: [],
        harvestDate: new Date('2025-06-01'),
        isAvailable: true,
      },
      {
        farm: farms[2]._id,
        owner: maria._id,
        isSeed: true,
        title: 'Texas Ruby Red Grapefruit',
        description:
          'Famously sweet Ruby Red grapefruit grown in the Rio Grande Valley, the only region in the world where true Ruby Reds are grown. Tree-ripened and hand-picked.',
        category: 'produce',
        pricePerUnit: 22,
        unit: 'bundle',
        quantityAvailable: 30,
        photos: [],
        harvestDate: new Date('2025-05-28'),
        isAvailable: true,
      },

      // Central Texas Dairy listings
      {
        farm: farms[3]._id,
        owner: robert._id,
        isSeed: true,
        title: 'Fresh Whole Milk',
        description:
          'Non-homogenized whole milk from pasture-raised Jersey cows. Rich, creamy, and full of natural flavor. Cream rises to the top — shake before serving. Available for farm pickup only.',
        category: 'dairy',
        pricePerUnit: 8,
        unit: 'gallon',
        quantityAvailable: 25,
        photos: [],
        harvestDate: new Date('2025-06-07'),
        isAvailable: true,
      },
      {
        farm: farms[3]._id,
        owner: robert._id,
        isSeed: true,
        title: 'Farm Fresh Eggs',
        description:
          'Free-range eggs from hens raised on pasture and supplemented with non-GMO feed. Deep orange yolks and rich flavor. Collected daily and never washed to preserve the natural bloom.',
        category: 'eggs',
        pricePerUnit: 7,
        unit: 'dozen',
        quantityAvailable: 50,
        photos: [],
        harvestDate: new Date('2025-06-08'),
        isAvailable: true,
      },
    ]);

    console.log('Created 7 listings...');
    console.log('✅ Database seeded successfully!');
    process.exit(0);

  } catch (error) {
    console.error(`Seed error: ${error.message}`);
    process.exit(1);
  }
};

// ─── Remove Seed Data ─────────────────────────────────────────────────────────
// Deletes only documents flagged isSeed: true (farms, listings, and the
// dedicated seed farmer users) — real farmers/listings/users are never touched.
// Run once real users have joined and the demo data is no longer needed:
//   node seed.js --remove

const removeSeedData = async () => {
  try {
    if (process.env.NODE_ENV === 'production' && !process.argv.includes('--force')) {
      console.error(
        'Refusing to run seed.js --remove with NODE_ENV=production. ' +
        'Re-run with --force if this is really what you want.'
      );
      process.exit(1);
    }

    await connectDB();

    const { deletedCount: listingsRemoved } = await Listing.deleteMany({ isSeed: true });
    const { deletedCount: farmsRemoved } = await Farm.deleteMany({ isSeed: true });
    const { deletedCount: usersRemoved } = await User.deleteMany({ isSeed: true });

    console.log(
      `Removed ${farmsRemoved} seed farm(s), ${listingsRemoved} seed listing(s), ` +
      `and ${usersRemoved} seed user(s).`
    );
    process.exit(0);
  } catch (error) {
    console.error(`Seed removal error: ${error.message}`);
    process.exit(1);
  }
};

if (process.argv.includes('--remove')) {
  removeSeedData();
} else {
  seedData();
}
