const response = require('../../helpers/response');
const jwt_decode = require('jwt-decode');
const Post = require('../../models/Post');
const { HidedPost } = require('../../models/HidedPost');
const List = require('../../models/List');

exports.getAllTimeline = async (req, res) => {
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

exports.getListTimeline = async (req, res) => {
  try {
    const { list_name } = req.params;
    const { user_id } = jwt_decode(req.headers.authorization);
    let allPosts = [];
    const posts = await Post.find({ visibility: 'list' }).populate('user');
    await Promise.all(
      posts.map(async post => {
        const hidePosts = await HidedPost.findOne({
          post: post._id,
          hided_by: user_id,
        });

        if (hidePosts?._id) {
          return;
        }

        const list = await List.findOne({
          $or: [
            {
              $and: [
                { user: user_id },
                { $in: { contacts: post.user._id } },
                { list_name },
              ],
            },
            {
              $and: [{ user: post.user._id }, { $in: { contacts: user_id } }],
            },
          ],
        });

        if (list._id) {
          allPosts.push(post);
        }
      }),
    );
    response.success(res, allPosts, 'Posts retrieved successfully');
  } catch (err) {
    response.error(res, err, 'Error retrieving posts');
  }
};

exports.getUserTimeline = async (req, res) => {
  try {
    const { user_id } = req.params;
    const posts = await Post.find({ user: user_id }).populate('user');

    response.success(res, posts, 'Posts retrieved successfully');
  } catch (err) {
    response.error(res, err, 'Error retrieving posts');
  }
};

exports.searchTimeline = async (req, res) => {
  try {
    const { search } = req.query;
    const { user_id } = jwt_decode(req.headers.authorization);
    let allPosts = [];
    const posts = await Post.find({ $content: { $search: search } }).populate(
      'user',
    );

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
