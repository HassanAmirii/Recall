import mongoose from 'mongoose';

const groupMembershipSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  groupId: { type: mongoose.Schema.Types.ObjectId, ref: 'Group', required: true },
  role: { type: String, enum: ['admin', 'member'], default: 'member' },
  lastViewedAt: { type: Date, default: null }
});

groupMembershipSchema.index({ userId: 1, groupId: 1 }, { unique: true });

export default mongoose.model('GroupMembership', groupMembershipSchema);
