import mongoose from 'mongoose';

const ConversationSchema = new mongoose.Schema({
  name: {
    type: String,
  },
  isGroup: {
    type: Boolean,
    default: false,
  },
  participants: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  }],
  lastMessage: {
    content: String,
    type: {
      type: String,
      enum: ['text', 'image', 'audio'],
      default: 'text'
    },
    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    createdAt: Date,
  },
}, {
  timestamps: true,
});

export default mongoose.models.Conversation || mongoose.model('Conversation', ConversationSchema);
