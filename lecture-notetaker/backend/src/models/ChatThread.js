import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema({
  role: { type: String, enum: ['user', 'assistant'], required: true },
  content: { type: String, required: true },
  timestamp: { type: Date, default: Date.now }
}, { _id: false });

const chatThreadSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  lectureId: { type: mongoose.Schema.Types.ObjectId, ref: 'Lecture', required: true },
  messages: [messageSchema]
});

chatThreadSchema.index({ userId: 1, lectureId: 1 }, { unique: true });

export default mongoose.model('ChatThread', chatThreadSchema);
