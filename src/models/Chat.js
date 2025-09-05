import mongoose from 'mongoose';

const ChatSchema = new mongoose.Schema({
  // Chat name (for group chats)
  name: {
    type: String,
    trim: true,
    maxlength: 50,
  },
  // Chat avatar (for group chats)
  avatar: {
    type: String,
    default: '/user.jpg',
  },
  // Chat description (for group chats)
  description: {
    type: String,
    trim: true,
    maxlength: 500,
    default: '',
  },
  // Privacy setting for group chats
  privacy: {
    type: String,
    enum: ['admin_only', 'member_invite'],
    default: 'admin_only',
  },
  // Whether this is a group chat or 1:1 chat
  isGroup: {
    type: Boolean,
    default: false,
  },
  // Chat participants
  participants: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  }],
  // Group admins (only for group chats)
  admins: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  }],
  // Last message for preview
  lastMessage: {
    content: String,
    type: {
      type: String,
      enum: ['text', 'image', 'video', 'file'],
      default: 'text',
    },
    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    createdAt: Date,
  },
  // Who created the chat
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  // Unread count per user
  unreadCounts: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    count: {
      type: Number,
      default: 0,
    },
  }],
}, {
  timestamps: true,
});

// Indexes for faster queries
ChatSchema.index({ participants: 1 });
ChatSchema.index({ isGroup: 1 });
ChatSchema.index({ 'lastMessage.createdAt': -1 });

// Ensure participants and admins are unique
ChatSchema.pre('save', function(next) {
  if (this.participants) {
    this.participants = [...new Set(this.participants.map(id => id.toString()))].map(id => mongoose.Types.ObjectId(id));
  }
  if (this.admins) {
    this.admins = [...new Set(this.admins.map(id => id.toString()))].map(id => mongoose.Types.ObjectId(id));
  }
  next();
});

export default mongoose.models.Chat || mongoose.model('Chat', ChatSchema);
