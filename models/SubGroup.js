const mongoose = require('mongoose');

const SubGroupSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 100 },
    slug: { type: String, required: true, lowercase: true, trim: true, maxlength: 50 },
    description: { type: String, trim: true, maxlength: 500 },
    parentGroup: { type: mongoose.Schema.Types.ObjectId, ref: 'Group', required: true },
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    membersCount: { type: Number, default: 0 },
    tags: [{ type: String }],
    type: { type: String, enum: ['Public', 'Private'], default: 'Public' },
    avatar: { type: String, default: '' },
  },
  { timestamps: true }
);

SubGroupSchema.index({ parentGroup: 1, slug: 1 }, { unique: true });

module.exports = mongoose.model('SubGroup', SubGroupSchema);
