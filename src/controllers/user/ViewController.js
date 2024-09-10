const View = require('../../models/View');
const response = require('../../helpers/response');
const jwt_decode = require('jwt-decode');
const Post = require('../../models/Post');

exports.addView = async (req, res) => {
  try {
    const { post_id } = req.body;
    const { user_id } = jwt_decode(req.headers.authorization);
    const existingView = await View.findOne({ user_id, post_id });
    if (existingView?._id) {
      return response.success(res, existingView, 'View already exists.');
    }
    const view = new View({ user_id, post_id });
    const newView = await view.save();

    // update post view count
    await Post.findByIdAndUpdate(post_id, {
      $inc: { view: 1 },
    });

    return response.success(res, newView, 'View added successfully.');
  } catch (err) {
    return response.error(res, err, 'Error Occurred.', err.status || 500);
  }
};

exports.getViews = async (req, res) => {
  try {
    const { post_id } = req.params;
    const views = await View.find({ post_id });

    return response.success(res, views, 'Views fetched successfully.');
  } catch (err) {
    return response.error(res, err, 'Error Occurred.', err.status || 500);
  }
};
