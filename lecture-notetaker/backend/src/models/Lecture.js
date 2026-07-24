import mongoose from "mongoose";

const audioChunkSchema = new mongoose.Schema(
  {
    chunkIndex: { type: Number, required: true },
    filePath: { type: String, required: true },
    fileName: { type: String, default: "" },
  },
  { _id: false },
);

const lectureSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  courseTag: { type: String, trim: true, default: "" },
  lectureContext: { type: String, trim: true, default: "" },
  uploadedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    index: true,
  },
  groupId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Group",
    default: null,
    index: true,
  },
  status: {
    type: String,
    enum: ["personal", "pending", "approved"],
    required: true,
    index: true,
  },
  processingStatus: {
    type: String,
    enum: ["pending", "processing", "chunking_completed", "completed", "failed", "partial"],
    default: "pending",
    index: true,
  },
  errorMessage: { type: String, default: "" },
  approvedAt: { type: Date, default: null },
  approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
  audioChunks: [audioChunkSchema],
  rawTranscript: { type: String, default: "" },
  structuredNotes: { type: mongoose.Schema.Types.Mixed, default: null },
  processedAt: { type: Date, default: null },
  createdAt: { type: Date, default: Date.now, index: true },
});

lectureSchema.index({ uploadedBy: 1, status: 1, groupId: 1, createdAt: -1 });
lectureSchema.index({ groupId: 1, status: 1, createdAt: -1 });
lectureSchema.index({ processingStatus: 1, createdAt: -1 });

export default mongoose.model("Lecture", lectureSchema);
