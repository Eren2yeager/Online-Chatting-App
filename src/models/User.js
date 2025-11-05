import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 50
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    index: true
  },
  emailVerified: {
    type: Date,
  },
  // Primary profile image
  image: {
    type: String,
    default: '/user.jpg'
  },
  // Unique handle for friending and sharing
  handle: {
    type: String,
    unique: true,
    required: true,
    trim: true,
    minlength: 3,
    maxlength: 20,
    match: /^[a-zA-Z0-9_-]+$/,
    index: true
  },
  // User bio/description
  bio: {
    type: String,
    maxlength: 200,
    default: ''
  },
  // Online status
  status: {
    type: String,
    enum: ['online', 'offline'],
    default: 'offline'
  },
  // Last seen timestamp
  lastSeen: {
    type: Date,
    default: Date.now
  },
  // Friends list
  friends: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  // Blocked users
  blocked: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }]
}, {
  timestamps: true,
});

/**
 * Why do we use indexes here?
 * 
 * Indexes are used in MongoDB (and thus in Mongoose schemas) to improve the speed of data retrieval operations on a database collection.
 * By creating indexes on fields that are frequently queried (such as handle and email), 
 * we ensure that lookups, searches, and uniqueness checks on these fields are much faster, especially as the user base grows.
 * 
 * - handle: Indexed for quick user lookup by handle (e.g., for friending, sharing, or searching users).
 * - email: Indexed for fast authentication and to enforce uniqueness.
 */


// Generate unique handle if not provided
UserSchema.pre('save', async function(next) {
  if (!this.handle) {
    let handle = this.name.toLowerCase().replace(/[^a-z0-9]/g, '');
    let counter = 1;
    let originalHandle = handle;
    
    while (await mongoose.model('User').findOne({ handle })) {
      handle = `${originalHandle}${counter}`;
      counter++;
    }
    this.handle = handle;
  }
  
  next();
});

export default mongoose.models.User || mongoose.model('User', UserSchema);
