const router = require('express').Router();
const {
  getComment,
  getComments,
  addComment,
  getCommentReply,
  deleteComment,
} = require('../../controllers/user/CommentController');
const { addFeed, showFeed } = require('../../controllers/user/FeedController');
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
  reportPost,
  hidePost,
} = require('../../controllers/user/PostController');
const {
  getAllTimeline,
  getListTimeline,
  getUserTimeline,
  searchTimeline,
} = require('../../controllers/user/TimelineController');
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
const { addView, getViews } = require('../../controllers/user/ViewController');
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
router.post(`/post/report/:id`, reportPost);
router.post(`/post/hide/:id`, hidePost);

// View Routes
router.post(`/view`, addView);
router.get(`/view/:post_id`, getViews);

// Comments Routes
router.post(`/comment`, addComment);
router.get(`/comment/:post_id`, getComments);
router.get(`/comment/:id`, getComment);
router.get(`/comment/reply/:comment_id`, getCommentReply);
router.delete(`/comment/:id`, deleteComment);

// Feed Routes
router.post(`/feed`, addFeed);
router.get(`/feed/:user_id`, showFeed);

// Timeline Routes
router.get(`/timeline/show`, getAllTimeline);
router.get(`/timeline/list/:list_name`, getListTimeline);
router.get(`/timeline/user/:user_id`, getUserTimeline);
router.get(`/timeline/search`, searchTimeline);

module.exports = router;
