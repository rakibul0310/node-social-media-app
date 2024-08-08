const moment = require('moment');

const checkOtpRateLimit = async (otpCount, lastOtpSentTime) => {
  //  1st to 2nd SMS: 1-hour interval;
  //  2nd to 3rd SMS: 12- hour interval;
  //  3rd to 4th SMS: 24-hour interval;
  //  4th to subsequent SMS: 7-day interval.

  // check the interval between the last OTP sent time and the current time using moment.js
  const currentTime = moment();
  const lastOtpSent = moment(lastOtpSentTime);
  const timeDifference = currentTime.diff(lastOtpSent, 'hours');

  // check the OTP count and the time difference to determine the rate limit
  if (otpCount === 1) {
    return timeDifference >= 1;
  } else if (otpCount === 2) {
    return timeDifference >= 12;
  } else if (otpCount === 3) {
    return timeDifference >= 24;
  } else {
    return timeDifference >= 168;
  }
};

module.exports = checkOtpRateLimit;
