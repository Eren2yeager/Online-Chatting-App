import mongoose from 'mongoose';

const MessageSchema = new mongoose.Schema({
  // Chat this message belongs to
  chatId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Chat',
    required: true,
  },
  // Message sender
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  // Message type
  type: {
    type: String,
    enum: ['text', 'image', 'video', 'file', 'system'],
    default: 'text',
  },
  // Text content (for text messages)
  text: {
    type: String,
    trim: true,
    maxlength: 2000
  },
  // Structured metadata for system messages
  system: {
    event: { type: String, enum: ['member_added', 'member_removed', 'member_joined_via_invite', 'name_changed', 'image_changed', 'admin_promoted', 'admin_demoted', 'call_started', 'call_ended'], default: undefined },
    targets: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    previous: { type: mongoose.Schema.Types.Mixed },
    next: { type: mongoose.Schema.Types.Mixed },
    callId: { type: mongoose.Schema.Types.ObjectId, ref: 'Call' },
    callDuration: { type: Number },
    callType: { type: String, enum: ['audio', 'video'] },
  },
  // Media attachments (for image/video/file messages)
  media: [{
    url: {
      type: String,
      required: true
    },
    publicId: {
      type: String,
      required: true
    },
    width: Number,
    height: Number,
    mime: String,
    size: Number,
    filename: String
  }],
  // Message reactions
  reactions: [{
    emoji: {
      type: String,
      required: true
    },
    by: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  // Reply to another message
  replyTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Message'
  },
  // Users who have deleted this message for themselves
  deletedFor: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  // Users who have received the message
  deliveredTo: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  // Users who have read the message
  readBy: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }],
  // Whether message is deleted for everyone (tombstone)
  isDeleted: {
    type: Boolean,
    default: false
  },
  // Track if message was edited
  editedAt: {
    type: Date,
    default: null
  }
}, {
  timestamps: true,
});

// Indexes for faster queries
MessageSchema.index({ chatId: 1, createdAt: -1 });
MessageSchema.index({ sender: 1 });
MessageSchema.index({ 'reactions.by': 1 });

// Ensure unique reactions per user per message
MessageSchema.pre('save', function(next) {
  if (this.reactions) {
    const seen = new Set();
    this.reactions = this.reactions.filter(reaction => {
      const key = `${reaction.emoji}-${reaction.by}`;
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    });
  }
  next();
});

export default mongoose.models.Message || mongoose.model('Message', MessageSchema);
