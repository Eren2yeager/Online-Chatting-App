import mongoose from 'mongoose';

const NotificationSchema = new mongoose.Schema({
  // User receiving the notification
  to: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  // Notification type
  type: {
    type: String,
    enum: ['friend_request', 'message', 'group_invite', 'group_update', 'reaction'],
    required: true
  },
  // Notification title
  title: {
    type: String,
    required: true,
    maxlength: 100
  },
  // Notification body/message
  body: {
    type: String,
    required: true,
    maxlength: 500
  },
  // Additional data for the notification
  data: { 
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  // Whether notification has been read
  read: {
    type: Boolean,
    default: false
  },
  // Related chat (for message notifications)
  chatId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Chat'
  },
  // Related message (for message/reaction notifications)
  messageId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Message'
  },
  // Related user (for friend request notifications)
  fromUser: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, {
  timestamps: true,
});

// Indexes for faster queries
NotificationSchema.index({ to: 1, read: 1 });
NotificationSchema.index({ to: 1, createdAt: -1 });
NotificationSchema.index({ type: 1 });

export default mongoose.models.Notification || mongoose.model('Notification', NotificationSchema);
