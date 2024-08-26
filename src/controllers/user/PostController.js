const response = require('../../helpers/response');
const jwt_decode = require('jwt-decode');
const Post = require('../../models/Post');
const { User } = require('../../models/User');
const List = require('../../models/List');
const { ReportedPost } = require('../../models/ReportedPost');
const { HidedPost } = require('../../models/HidedPost');

exports.createPost = async (req, res) => {
  try {
    const {
      type,
      content,
      data,
      location,
      location_data,
      link_data,
      visibility,
    } = req.body;
    const { user_id } = jwt_decode(req.headers.authorization);
    const post = new Post({
      user: user_id,
      type,
      content,
      data,
      location,
      location_data,
      link_data,
      visibility,
    });
    await post.save();
    response.success(res, post, 'Post created successfully', 201);
  } catch (err) {
    response.error(res, err, 'Error creating post');
  }
};

exports.getAllPosts = async (req, res) => {
  try {
    const { user_id } = jwt_decode(req.headers.authorization);
    let allPosts = [];
    const posts = await Post.find({
      $or: [{ visibility: 'all' }, { visibility: 'list' }],
    }).populate('user');
    await Promise.all(
      posts.map(async post => {
        const hidePosts = await HidedPost.findOne({
          post: post._id,
          hided_by: user_id,
        });

        if (hidePosts?._id) {
          return;
        }

        if (post.visibility === 'list') {
          const list = await List.findOne({
            $or: [
              {
                $and: [{ user: user_id }, { $in: { contacts: post.user._id } }],
              },
              {
                $and: [{ user: post.user._id }, { $in: { contacts: user_id } }],
              },
            ],
          });

          if (list._id) {
            allPosts.push(post);
          }
        } else {
          allPosts.push(post);
        }
      }),
    );
    response.success(res, allPosts, 'Posts retrieved successfully');
  } catch (err) {
    response.error(res, err, 'Error retrieving posts');
  }
};

exports.updatePost = async (req, res) => {
  try {
    const { id } = req.params;
    const post = await Post.findByIdAndUpdate(id, req.body, { new: true });
    response.success(res, post, 'Post updated successfully');
  } catch (err) {
    response.error(res, err, 'Error updating post');
  }
};

exports.deletePost = async (req, res) => {
  try {
    const { id } = req.params;
    await Post.findByIdAndDelete(id);
    response.success(res, null, 'Post deleted successfully');
  } catch (err) {
    response.error(res, err, 'Error deleting post');
  }
};

exports.reportPost = async (req, res) => {
  try {
    const { reason } = req.body;
    const { id } = req.params;
    const { user_id } = jwt_decode(req.headers.authorization);
    const reportPost = await ReportedPost.create({
      post: id,
      reported_by: user_id,
      reason: reason || 'No reason provided',
    });

    response.success(res, reportPost, 'Post reported successfully', 201);
  } catch (err) {
    response.error(res, err, 'Error reporting post');
  }
};

exports.hidePost = async (req, res) => {
  try {
    const { id } = req.params;
    const { user_id } = jwt_decode(req.headers.authorization);
    const hidePost = await HidedPost.create({
      post: id,
      hided_by: user_id,
    });

    response.success(res, hidePost, 'Post hidden successfully', 201);
  } catch (err) {
    response.error(res, err, 'Error hiding post');
  }
};
