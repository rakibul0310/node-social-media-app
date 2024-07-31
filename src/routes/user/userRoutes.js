const router = require('express').Router();
const {
  verifyOTP,
  verifyPassword,
  profileUpdate,
  emailUpdate,
  changePassword,
  userCountry,
  updateCountries,
  addBlockedCountry,
} = require('../../controllers/user/UserController');

// Verify OTP
router.post(`/verify/otp`, verifyOTP);

// Verify Password
router.post(`/verify/password`, verifyPassword);

// User Profile Update
router.put(`/profile/update`, profileUpdate);

// User Email Update
router.patch(`/email/update`, emailUpdate);

// User Change Password
router.patch(`/change-password/`, changePassword);

// User Country (Based on REQUEST)
router.get(`/get-country`, userCountry);

// Update Countries data to database
router.get(`/update-countries`, updateCountries);

// Add Blocked Country
router.post(`/add-blocked-country`, addBlockedCountry);

module.exports = router;
