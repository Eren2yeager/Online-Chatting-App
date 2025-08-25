import mongoose from 'mongoose';

const FriendRequestSchema = new mongoose.Schema({
  // User sending the request
  from: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  // User receiving the request
  to: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  // Request status
  status: {
    type: String,
    enum: ['pending', 'accepted', 'rejected', 'cancelled'],
    default: 'pending'
  },
  // Optional message with the request
  message: {
    type: String,
    maxlength: 200,
    default: ''
  }
}, {
  timestamps: true,
});

// Indexes for faster queries
FriendRequestSchema.index({ from: 1, to: 1 }, { unique: true });
FriendRequestSchema.index({ to: 1, status: 1 });
FriendRequestSchema.index({ from: 1, status: 1 });

// Prevent duplicate requests
FriendRequestSchema.pre('save', async function(next) {
  if (this.isNew) {
    const existingRequest = await mongoose.model('FriendRequest').findOne({
      $or: [
        { from: this.from, to: this.to },
        { from: this.to, to: this.from }
      ]
    });
    
    if (existingRequest) {
      throw new Error('Friend request already exists between these users');
    }
  }
  next();
});

export default mongoose.models.FriendRequest || mongoose.model('FriendRequest', FriendRequestSchema);
