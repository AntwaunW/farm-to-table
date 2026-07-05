// Entry point for the Express backend server
// Loads environment variables, connects to MongoDB, registers middleware and routes,
// then starts listening on the configured port

const path = require('path');
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const connectDB = require('./config/db');

// Always load .env from the server/ directory, regardless of where the process is started from
dotenv.config({ path: path.join(__dirname, '.env') });

// Connect to MongoDB before the server starts handling requests
connectDB();

const app = express();

// Allow cross-origin requests from the React frontend (localhost:3000 in dev)
app.use(cors({
  origin: [
    'http://localhost:3000',
    'https://cattle-and-crop.vercel.app',
    'https://www.cattleandcrop.com',
    'https://cattleandcrop.com',
  ],
  credentials: true,
}));

// Stripe webhooks require the raw request body to verify the signature
// This MUST be registered before express.json() or the body will be parsed and the signature check will fail
app.use('/api/payments/webhook', express.raw({ type: 'application/json' }));

// Parse incoming JSON request bodies for all other routes
app.use(express.json());

// API Routes
const ordersRouter = require('./routes/orders'); // Order placement and management
app.use('/api/auth', require('./routes/auth'));         // Register, login, get current user
app.use('/api/farms', require('./routes/farms'));       // Farm profile CRUD
app.use('/api/listings', require('./routes/listings')); // Product listing CRUD
app.use('/api/orders', ordersRouter);
app.use('/api/payments', require('./routes/payments')); // Stripe payment flow and webhooks
app.use('/api/upload', require('./routes/upload'));   // Image upload to Cloudinary
app.use('/api/reviews', require('./routes/reviews')); // Farm reviews by consumers
app.use('/api/contact', require('./routes/contact')); // Contact form submissions

// Periodically cancels abandoned quick-sale (in-person) orders so their
// reserved inventory isn't locked up forever if the customer never pays
ordersRouter.startQuickSaleExpirySweep();

// Simple health check — confirms the API server is running
app.get('/', (req, res) => {
  res.send('Cattle & Crop API running');
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
