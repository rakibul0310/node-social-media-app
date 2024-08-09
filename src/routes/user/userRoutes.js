const router = require('express').Router();
const {
  verifyOTP,
  verifyPassword,
  profileUpdate,
  emailUpdate,
  changePassword,
  updateCountries,
  blockCountry,
  reportUser,
  blockUser,
} = require('../../controllers/user/UserController');

// Report User
router.post(`/report-user`, reportUser);

// Block User
router.post(`/block-user`, blockUser);

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

// Update Countries data to database
router.get(`/update-countries`, updateCountries);

// Add Blocked Country
router.post(`/add-blocked-country`, blockCountry);

module.exports = router;
