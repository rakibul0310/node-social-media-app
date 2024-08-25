const e = require('express');
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const postSchema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    type: {
      type: String,
      enum: ['normal', 'gif', 'video', 'photo'],
      required: true,
    },
    content: {
      type: String,
    },
    data: {
      type: Object,
    },
    location: {
      type: String,
    },
    location_data: {
      type: Object,
    },
    link_data: {
      type: Object,
    },
    visibility: {
      type: String,
      enum: ['all', 'none', 'list'],
      required: true,
    },
    view: {
      type: Number,
      default: 0,
    },
    comment: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  },
);

postSchema.set('toJSON', {
  versionKey: false,
  virtuals: true,
  transform(doc, ret) {
    delete ret._id;
  },
});

module.exports = mongoose.model('Post', postSchema);
