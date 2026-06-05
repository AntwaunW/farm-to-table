// Connects to MongoDB Atlas using Mongoose
// MONGO_URI must be set in the .env file
// If the connection fails, the process exits — the app cannot run without a database

const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`Error: ${error.message}`);
    // Exit immediately so nodemon or the process manager knows to restart / alert
    process.exit(1);
  }
};

module.exports = connectDB;
