const response = require('../../helpers/response');
const jwt_decode = require('jwt-decode');
const Comment = require('../../models/Comment');
const Post = require('../../models/Post');

exports.addComment = async (req, res) => {
  try {
    const { post_id, content, comment_id } = req.body;
    const { user_id } = jwt_decode(req.headers.authorization);
    const comment = new Comment({
      user_id,
      post_id,
      content,
      comment_id: comment_id || null,
      have_comment: comment_id ? true : false,
    });
    const newComment = await comment.save();
    // update post comment count
    await Post.findByIdAndUpdate(post_id, {
      $inc: { comment: 1 },
    });

    return response.success(res, newComment, 'Comment added successfully.');
  } catch (err) {
    return response.error(res, err, 'Error Occurred.', err.status || 500);
  }
};

exports.getComments = async (req, res) => {
  try {
    const { post_id } = req.params;
    const comments = await Comment.find({ post_id });

    return response.success(res, comments, 'Comments fetched successfully.');
  } catch (err) {
    return response.error(res, err, 'Error Occurred.', err.status || 500);
  }
};

exports.getComment = async (req, res) => {
  try {
    const { comment_id } = req.params;
    const comment = await Comment.findById(comment_id);

    return response.success(res, comment, 'Comment fetched successfully.');
  } catch (err) {
    return response.error(res, err, 'Error Occurred.', err.status || 500);
  }
};

exports.getCommentReply = async (req, res) => {
  try {
    const { comment_id } = req.params;
    const comments = await Comment.find({ comment_id });

    return response.success(res, comments, 'Comments fetched successfully.');
  } catch (err) {
    return response.error(res, err, 'Error Occurred.', err.status || 500);
  }
};

exports.deleteComment = async (req, res) => {
  try {
    const { comment_id } = req.params;
    await Comment.findByIdAndDelete(comment_id);

    return response.success(res, null, 'Comment deleted successfully.');
  } catch (error) {
    return response.error(res, err, 'Error Occurred.', err.status || 500);
  }
};
