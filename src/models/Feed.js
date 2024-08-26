const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const feedSchema = new Schema(
  {
    user_id: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    action: {
      type: String,
      enum: [
        'welcome',
        'first_post',
        'post',
        'comment',
        'longtime',
        'censured',
        'deleted',
      ],
      required: true,
    },
    user_action: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    post_action: {
      type: Schema.Types.ObjectId,
      ref: 'Post',
    },
    data: {
      type: Object,
    },
  },
  {
    timestamps: true,
  },
);

feedSchema.set('toJSON', {
  versionKey: false,
  virtuals: true,
  transform(doc, ret) {
    delete ret._id;
  },
});

module.exports = mongoose.model('Feed', feedSchema);
