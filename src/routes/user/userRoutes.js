const router = require('express').Router();
const {
  createList,
  getAllLists,
  getList,
  addContactToList,
  removeContactFromList,
} = require('../../controllers/user/ListController');
const {
  createPost,
  getAllPosts,
  updatePost,
  deletePost,
} = require('../../controllers/user/PostController');
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
  uploadContactList,
} = require('../../controllers/user/UserController');
const multerCSV = require('../../utils/multerCSV');

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

// contact upload
router.post(
  `/upload-contacts`,
  multerCSV.single('contacts'),
  uploadContactList,
);

// List Routes
router.post(`/list`, createList);
router.get(`/list`, getAllLists);
router.get(`/list/:id`, getList);
router.put(`/list/add-constct/:id`, addContactToList);
router.put(`/list/remove-contact/:id`, removeContactFromList);

// Post Routes
router.post(`/post`, createPost);
router.get(`/post`, getAllPosts);
router.put(`/post/:id`, updatePost);
router.delete(`/post/:id`, deletePost);

module.exports = router;
