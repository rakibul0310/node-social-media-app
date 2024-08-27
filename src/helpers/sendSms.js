const twilio = require('twilio');
const response = require('../helpers/response');
const { Otp } = require('../models/Otp');

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const client = twilio(accountSid, authToken);

const sendSms = async (toPhone, message, res, otpId) => {
  try {
    const smsData = await client.messages.create({
      body: message,
      from: process.env.TWILIO_PHONE_NO,
      to: toPhone,
    });
    return response.success(res, null, 'OTP has been sent to your phone.', 201);
  } catch (err) {
    await Otp.findByIdAndDelete(otpId);
    return response.error(res, err, 'Error Occurred.', err.status || 500);
  }
};

module.exports = sendSms;
