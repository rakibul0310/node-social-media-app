const router = require('express').Router();
const {
  login,
  verifyByLink,
  verifyByOtp,
  verifyResend,
  forgetPassword,
  resetPassword,
  userCountry,
  sendOtp,
} = require('../../controllers/user/AuthController');

// User Country (Based on REQUEST)
router.get(`/get-country`, userCountry);

router.post(`/send-otp`, sendOtp);

router.post(`/login`, login);

router.get(`/verify`, verifyByLink);

router.post(`/verifyByOtp`, verifyByOtp);

router.post(`/verify/resend`, verifyResend);

router.post(`/forget/password`, forgetPassword);

router.post(`/reset/password`, resetPassword);

module.exports = router;
