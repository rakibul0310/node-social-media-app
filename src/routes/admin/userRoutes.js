const router = require('express').Router();
const isModerator = require('../../middlewares/isModerator');
const {
  getUsers,
  getUserById,
  getUsersCount,
  suspendUser,
} = require('../../controllers/admin/UserController');

// Suspend User
router.post(`/suspend/:id`, isModerator, suspendUser);

// Get Users
router.get('/', isModerator, getUsers);

// Get User by Id.
router.get(`/:id`, isModerator, getUserById);

// Get Users Count
router.get(`/get/count`, isModerator, getUsersCount);

module.exports = router;
