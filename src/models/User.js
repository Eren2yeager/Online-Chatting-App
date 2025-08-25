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
    trim: true
  },
  emailVerified: {
    type: Date,
  },
  image: {
    type: String,
  },
  // Unique handle for friending and sharing
  handle: {
    type: String,
    unique: true,
    required: true,
    trim: true,
    minlength: 3,
    maxlength: 20,
    match: /^[a-zA-Z0-9_-]+$/
  },
  // User bio/description
  bio: {
    type: String,
    maxlength: 200,
    default: ''
  },
  // User avatar URL
  avatar: {
    type: String,
    default: ''
  },
  // Online status
  status: {
    type: String,
    enum: ['online', 'away', 'busy', 'offline'],
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
  }],
  // Invite code for QR sharing
  inviteCode: {
    type: String,
    unique: true,
    required: true
  }
}, {
  timestamps: true,
});

// Index for faster queries
UserSchema.index({ handle: 1 });
UserSchema.index({ email: 1 });
UserSchema.index({ inviteCode: 1 });

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
  
  if (!this.inviteCode) {
    this.inviteCode = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  }
  
  next();
});

export default mongoose.models.User || mongoose.model('User', UserSchema);
