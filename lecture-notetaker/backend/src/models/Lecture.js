import mongoose from 'mongoose';

const audioChunkSchema = new mongoose.Schema({
  chunkIndex: { type: Number, required: true },
  filePath: { type: String, required: true }
}, { _id: false });

const lectureSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  courseTag: { type: String, trim: true, default: '' },
  uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  groupId: { type: mongoose.Schema.Types.ObjectId, ref: 'Group', default: null },
  status: { type: String, enum: ['personal', 'pending', 'approved'], required: true },
  approvedAt: { type: Date, default: null },
  approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  audioChunks: [audioChunkSchema],
  rawTranscript: { type: String, default: '' },
  structuredNotes: { type: mongoose.Schema.Types.Mixed, default: null },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model('Lecture', lectureSchema);
