const twilio = require('twilio');

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const client = twilio(accountSid, authToken);

const sendSms = async (toPhone, message) => {
  try {
    await client.messages.create({
      body: message,
      from: process.env.TWILIO_PHONE_NO,
      to: toPhone,
    });
  } catch (err) {
    throw new Error('Error occurred while sending SMS');
  }
};

module.exports = sendSms;
