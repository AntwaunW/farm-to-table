// User model — shared by both farmers and consumers
// Role determines what parts of the app the user can access
// Passwords are hashed automatically via a pre-save hook — never stored in plain text

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Please add a name'],
    trim: true,
  },
  email: {
    type: String,
    required: [true, 'Please add an email'],
    unique: true,
    lowercase: true,
    match: [/^\S+@\S+\.\S+$/, 'Please add a valid email'],
  },
  password: {
    type: String,
    required: [true, 'Please add a password'],
    minlength: 6,
    // select: false means password is excluded from all query results by default
    // Use .select('+password') when you need to compare it (e.g. login)
    select: false,
  },
  role: {
    type: String,
    enum: ['farmer', 'consumer'],
    required: [true, 'Please select a role'],
  },
  location: {
    city: { type: String },
    state: { type: String },
    zip: { type: String },
  },
  avatar: {
    type: String,
    default: '',
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Hash password before saving to the database
// The guard prevents re-hashing when other fields are updated
UserSchema.pre('save', async function () {
  if (!this.isModified('password')) {
    return;
  }

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Compares the plain-text password the user entered with the stored bcrypt hash
// Used in the login route after fetching the user with .select('+password')
UserSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', UserSchema);
