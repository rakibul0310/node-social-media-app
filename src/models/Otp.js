const mongoose = require('mongoose');

const otpSchema = mongoose.Schema(
  {
    number: {
      type: String,
      required: true,
      trim: true,
    },
    otp: {
      type: Number,
      required: true,
      unique: true,
      trim: true,
    },
    expire_at: {
      type: String,
      required: true,
      trim: true,
    },
  },
  {
    timestamps: {
      createdAt: 'created_at',
      updatedAt: 'updated_at',
    },
  },
);

otpSchema.set('toJSON', {
  versionKey: false,
  virtuals: true,
  transform(doc, ret) {
    delete ret._id;
  },
});

exports.Otp = mongoose.model('Otp', otpSchema);
