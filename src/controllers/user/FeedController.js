const Feed = require('../../models/Feed');
const response = require('../../helpers/response');
const jwt_decode = require('jwt-decode');

exports.addFeed = async (req, res) => {
  try {
    const { user_id, action, user_action, post_action, data } = req.body;
    const feed = new Feed({ user_id, action, user_action, post_action, data });
    const newFeed = await feed.save();

    return response.success(res, newFeed, 'Feed added successfully.');
  } catch (err) {
    return response.error(res, err, 'Error Occurred.', err.status || 500);
  }
};

// Show the feed from the beginning or from a specified number of item.
exports.showFeed = async (req, res) => {
  try {
    const { user_id } = req.params;
    const { start } = req.query;
    const feed = await Feed.find({ user_id })
      .sort({ createdAt: -1 })
      .skip(parseInt(start));

    return response.success(res, feed, 'Feed retrieved successfully.');
  } catch (err) {
    return response.error(res, err, 'Error Occurred.', err.status || 500);
  }
};
