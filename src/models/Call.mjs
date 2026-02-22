import mongoose from 'mongoose';

const CallParticipantSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  status: {
    type: String,
    enum: ['calling', 'ringing', 'joined', 'left', 'rejected', 'missed', 'busy'],
    default: 'calling',
  },
  joinedAt: {
    type: Date,
  },
  leftAt: {
    type: Date,
  },
}, { _id: false });

const CallSchema = new mongoose.Schema({
  // Unique room identifier for Socket.IO
  roomId: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },
  // Call type: direct (1-to-1) or group (multiple participants)
  type: {
    type: String,
    enum: ['direct', 'group'],
    default: 'direct',
  },
  // Media type: audio or video
  callType: {
    type: String,
    enum: ['audio', 'video'],
    default: 'video',
  },
  // User who initiated the call
  initiator: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  // All participants in the call
  participants: [CallParticipantSchema],
  // Overall call status
  status: {
    type: String,
    enum: ['pending', 'active', 'ended', 'cancelled'],
    default: 'pending',
  },
  // When the call was initiated
  startedAt: {
    type: Date,
    default: Date.now,
  },
  // When the call actually connected (first person joined)
  connectedAt: {
    type: Date,
  },
  // When the call ended
  endedAt: {
    type: Date,
  },
  // Call duration in seconds
  duration: {
    type: Number,
    default: 0,
  },
  // Optional: Link to a chat if call is from a chat
  chatId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Chat',
  },
}, {
  timestamps: true,
});

// Index for efficient queries
CallSchema.index({ 'participants.userId': 1, createdAt: -1 });
CallSchema.index({ status: 1, createdAt: -1 });
CallSchema.index({ roomId: 1 });

// Calculate duration before saving
CallSchema.pre('save', function(next) {
  if (this.connectedAt && this.endedAt) {
    this.duration = Math.floor((this.endedAt - this.connectedAt) / 1000);
  }
  next();
});

// Method to add a participant
CallSchema.methods.addParticipant = function(userId, status = 'ringing') {
  const existing = this.participants.find(p => p.userId.toString() === userId.toString());
  if (!existing) {
    this.participants.push({ userId, status });
  }
  return this;
};

// Method to update participant status
CallSchema.methods.updateParticipantStatus = function(userId, status, timestamp = new Date()) {
  const participant = this.participants.find(p => p.userId.toString() === userId.toString());
  if (participant) {
    participant.status = status;
    if (status === 'joined' && !participant.joinedAt) {
      participant.joinedAt = timestamp;
      // Set connectedAt if this is the first person to join
      if (!this.connectedAt) {
        this.connectedAt = timestamp;
        this.status = 'active';
      }
    } else if (['left', 'rejected'].includes(status) && !participant.leftAt) {
      participant.leftAt = timestamp;
    }
  }
  return this;
};

// Method to check if call should end (all participants left)
CallSchema.methods.shouldEnd = function() {
  const activeParticipants = this.participants.filter(p => 
    ['joined', 'ringing', 'calling'].includes(p.status)
  );
  return activeParticipants.length === 0;
};

// Method to get active participants
CallSchema.methods.getActiveParticipants = function() {
  return this.participants.filter(p => p.status === 'joined');
};

// Static method to find active call for a user
CallSchema.statics.findActiveCallForUser = async function(userId) {
  const calls = await this.find({
    'participants.userId': userId,
    status: { $in: ['pending', 'active'] },
  }).sort({ createdAt: -1 });
  
  // Filter to only return calls where this specific user has an active status
  for (const call of calls) {
    const participant = call.participants.find(p => p.userId.toString() === userId.toString());
    if (participant && ['calling', 'ringing', 'joined'].includes(participant.status)) {
      return call;
    }
  }
  
  return null;
};

// Static method to get call history for a user
CallSchema.statics.getCallHistory = async function(userId, limit = 50) {
  return this.find({
    'participants.userId': userId,
  })
  .sort({ createdAt: -1 })
  .limit(limit)
  .populate('initiator', 'name image handle')
  .populate('participants.userId', 'name image handle');
};

const Call = mongoose.models.Call || mongoose.model('Call', CallSchema);

export default Call;
