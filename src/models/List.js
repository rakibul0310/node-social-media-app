const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const listSchema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
    },
    list_name: {
      type: String,
      required: true,
    },
    contacts: [
      {
        type: Schema.Types.ObjectId,
        ref: 'Contact',
      },
    ],
  },
  {
    timestamps: true,
  },
);

listSchema.set('toJSON', {
  versionKey: false,
  virtuals: true,
  transform(doc, ret) {
    delete ret._id;
  },
});

module.exports = mongoose.model('List', listSchema);
