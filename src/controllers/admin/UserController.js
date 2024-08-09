const mongoose = require('mongoose');
const { User } = require('../../models/User');
const response = require('../../helpers/response');

// suspend an user
exports.suspendUser = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return response.error(res, {}, 'Invalid User Id.', 400);
    }

    const user = await User.findById(id);

    if (!user) {
      return response.error(res, {}, 'User not found.', 404);
    }

    user.suspended = true;
    user.nb_suspended += 1;

    // Calculate suspension duration and set suspension_expire using moment.js
    const suspensionDuration = user.nb_suspended + 1;
    const suspensionExpireDate = moment()
      .add(suspensionDuration, 'days')
      .toDate();
    user.suspension_expire = suspensionExpireDate;

    await user.save();

    return response.success(res, user, 'User suspended successfully.', 200);
  } catch (err) {
    return response.error(res, err, 'Error Occurred.', err.status || 500);
  }
};

exports.getUsers = async (req, res) => {
  try {
    const userList = await User.find().select('name email phone');

    return response.success(res, userList, 'Users fetched successfully.', 200);
  } catch (err) {
    return response.error(res, err, 'Error Occurred.', err.status || 500);
  }
};

exports.getUserById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.isValidObjectId(id)) {
      return response.error(res, {}, 'Invalid User Id.', 400);
    }

    const user = await User.findById(id);

    if (!user) {
      return response.error(res, {}, 'User not found.', 404);
    }

    return response.success(res, user, 'User fetched successfully.', 200);
  } catch (err) {
    return response.error(res, err, 'Error Occurred.', err.status || 500);
  }
};

exports.getUsersCount = async (req, res) => {
  try {
    const userCount = await User.countDocuments({});

    if (!userCount) {
      return response.error(
        res,
        {},
        'Error Occurred! Server was not counting any user.',
        404,
      );
    }

    return response.success(
      res,
      userCount,
      'User Count fetched successfully.',
      200,
    );
  } catch (err) {
    return response.error(res, err, 'Error Occurred.', err.status || 500);
  }
};
