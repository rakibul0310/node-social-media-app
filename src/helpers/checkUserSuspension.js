const moment = require('moment');

// Check user sespension
const checkUserSuspension = suspensionExpireDate => {
  // check the suspension expire date is passed or not by moment.js
  const currentTime = moment();
  const suspensionExpire = moment(suspensionExpireDate);
  return currentTime.isAfter(suspensionExpire);
};

module.exports = checkUserSuspension;
