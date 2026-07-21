import Group from '../models/Group.js';
import GroupMembership from '../models/GroupMembership.js';
import Lecture from '../models/Lecture.js';
import User from '../models/User.js';
import { httpError } from '../utils/httpError.js';

async function membership(userId, groupId) { return GroupMembership.findOne({ userId, groupId }); }
async function admin(userId, groupId) { const m = await membership(userId, groupId); if (!m || m.role !== 'admin') throw httpError(403, 'Admin access required'); return m; }

export async function createGroup(req, res, next) { try {
  const group = await Group.create({ name: req.body.name, createdBy: req.user._id });
  await GroupMembership.create({ userId: req.user._id, groupId: group._id, role: 'admin', lastViewedAt: new Date() });
  res.status(201).json(group);
} catch (e) { next(e); } }

export async function listMyGroups(req, res, next) { try {
  const memberships = await GroupMembership.find({ userId: req.user._id }).populate('groupId').lean();
  const groups = await Promise.all(memberships.map(async (m) => ({
    ...m.groupId,
    role: m.role,
    newCount: await Lecture.countDocuments({ groupId: m.groupId._id, status: 'approved', approvedAt: { $gt: m.lastViewedAt || new Date(0) } })
  })));
  res.json(groups);
} catch (e) { next(e); } }

export async function getGroup(req, res, next) { try {
  const m = await membership(req.user._id, req.params.groupId); if (!m) throw httpError(403, 'Group membership required');
  const group = await Group.findById(req.params.groupId);
  const lectures = await Lecture.find({ groupId: group._id, status: 'approved' }).sort({ approvedAt: -1, createdAt: -1 });
  m.lastViewedAt = new Date(); await m.save();
  res.json({ group, role: m.role, lectures });
} catch (e) { next(e); } }

export async function addUserToGroup(req, res, next) { try {
  await admin(req.user._id, req.params.groupId);
  const user = await User.findOne({ username: req.body.username }); if (!user) throw httpError(404, 'User not found');
  const role = req.body.role === 'admin' ? 'admin' : 'member';
  const doc = await GroupMembership.findOneAndUpdate({ userId: user._id, groupId: req.params.groupId }, { role }, { upsert: true, new: true });
  res.json(doc);
} catch (e) { next(e); } }

export async function removeUserFromGroup(req, res, next) { try {
  await admin(req.user._id, req.params.groupId);
  await GroupMembership.deleteOne({ userId: req.params.userId, groupId: req.params.groupId });
  res.status(204).end();
} catch (e) { next(e); } }

export async function pendingQueue(req, res, next) { try {
  await admin(req.user._id, req.params.groupId);
  res.json(await Lecture.find({ groupId: req.params.groupId, status: 'pending' }).populate('uploadedBy', 'username email').sort({ createdAt: -1 }));
} catch (e) { next(e); } }
