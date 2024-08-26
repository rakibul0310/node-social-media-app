const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const commentSchema = new Schema(
  {
    user_id: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    post_id: {
      type: Schema.Types.ObjectId,
      ref: 'Post',
    },
    content: {
      type: String,
      required: true,
    },
    comment_id: {
      type: Schema.Types.ObjectId,
      ref: 'Comment',
    },
    have_comment: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  },
);

commentSchema.set('toJSON', {
  versionKey: false,
  virtuals: true,
  transform(doc, ret) {
    delete ret._id;
  },
});

module.exports = mongoose.model('Comment', commentSchema);
