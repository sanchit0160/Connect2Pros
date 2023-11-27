const express = require('express');
const router = express.Router();
const { check, validationResult } = require('express-validator');
const auth = require('../../middleware/auth');
const User = require('../../models/User');
const Post = require('../../models/Post');
const Profile = require('../../models/Profile');


/*
 * @router    POST api/posts
 * @desc      Create a post
 * @access    Private
 */

router.post(
  '/',
  [
    auth,
    [
      check('text', 'Text: Required').not().isEmpty()
    ]
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if(!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const user = await User.findById(req.user.id).select('-password');
      const newPost = new Post ({
        text: req.body.text,
        name: user.name,
        avatar: user.avatar,
        user: req.user.id
      });

      const post = await newPost.save();
      res.json(post);
    } 
    catch (err) {
      console.error(err.message);
      res.status(500).send('Server Error');
    }
});


/*
 * @router    GET api/posts
 * @desc      Get all posts
 * @access    Private
 */

router.get(
  '/',
  auth,
  async (req, res) => {
    try {
      const posts = await Post.find().sort({ data: -1 });
      res.json(posts);
    } 
    catch (err) {
      console.error(err.message);
      res.status(500).send('Server Error');
    }
});


/*
 * @router    GET api/posts/:post_id
 * @desc      Get post by ID
 * @access    Private
 */

router.get(
  '/:id',
  auth,
  async (req, res) => {
    try {
      const post = await Post.findById(req.params.id);
      if(!post) {
        return res.status(404).json({ msg: 'Post: Not Found' })
      }
      res.json(post);
    } 
    catch (err) {
      if(err.kind === 'ObjectId') {
        return res.status(404).json({ msg: 'Post: Not Found' })
      }
      console.error(err.message);
      res.status(500).send('Server Error');
    }
});

/*
 * @router    DELETE api/posts/:id
 * @desc      Delete post by ID
 * @access    Private
 */

router.delete(
  '/:id',
  auth,
  async (req, res) => {
    try {
      const post = await Post.findById(req.params.id);

      if(!post) {
        console.error("!post");
        return res.status(404).json({ msg: 'Post: Not Found' })
      }

      // Check User
      if(post.user.toString() !== req.user.id) {
        return res.status(401).json({ msg: 'User: Unauthorized' });
      }

      await post.deleteOne({ _id: req.params.id });

      res.json({ msg: 'Post: Removed' });
    } 
    catch (err) {
      if(err.kind === 'ObjectId') {
        console.error("err.kind");
        return res.status(404).json({ msg: 'Post: Not Found' })
      }
      console.error(err.message);
      res.status(500).send('Server Error');
    }
});

/*
 * @router    PUT api/posts/like/:id
 * @desc      Like a post
 * @access    Private
 */

router.put(
  '/like/:id',
  auth,
  async (req, res) => {
    try {
      const post = await Post.findById(req.params.id);

      if(!post) {
        console.error("!post");
        return res.status(404).json({ msg: 'Post: Not Found' })
      }

      // Check if the post is already been liked
      if(post.likes.filter(like => like.user.toString() === req.user.id).length > 0) {
        return res.status(400).json({ msg: 'Post: Already Liked' });
      }

      post.likes.unshift({ user: req.user.id });
      await post.save();

      res.json(post.likes);
    } 
    catch (err) {
      console.error(err.message);
      res.status(500).send('Server Error');
    }
});


/*
 * @router    PUT api/posts/unlike/:id
 * @desc      Unlike a post
 * @access    Private
 */

router.put(
  '/unlike/:id',
  auth,
  async (req, res) => {
    try {
      const post = await Post.findById(req.params.id);

      if(!post) {
        console.error("!post");
        return res.status(404).json({ msg: 'Post: Not Found' })
      }

      // Check if the post is already been liked
      if(post.likes.filter(like => like.user.toString() === req.user.id).length === 0) {
        return res.status(400).json({ msg: 'Post: Has not yet been liked' });
      }

      // Get remove index
      const removeIndex = post.likes.map(like => like.user.toString()).indexOf(req.user.id);
      post.likes.splice(removeIndex, 1);

      await post.save();
      // res.json(post.likes);
      res.json({ msg: 'Post: Unliked' });
    } 
    catch (err) {
      console.error(err.message);
      res.status(500).send('Server Error');
    }
});

/*
 * @router    POST api/posts/comment/:id
 * @desc      Comment on a post
 * @access    Private
 */

router.post(
  '/comment/:id',
  [
    auth,
    [
      check('text', 'Text: Required').not().isEmpty()
    ]
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if(!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    try {
      const user = await User.findById(req.user.id).select('-password');
      const post = await Post.findById(req.params.id);

      const newComment = new Post ({
        text: req.body.text,
        name: user.name,
        avatar: user.avatar,
        user: req.user.id
      });

      post.comments.unshift(newComment);
      await post.save();

      res.json(post.comments);
    } 
    catch (err) {
      console.error(err.message);
      res.status(500).send('Server Error');
    }
});

/*
 * @router    DELETE api/posts/comment/:id/:comment_id
 * @desc      Delete a comment
 * @access    Private
 */

router.delete(
  '/:id/comment/:comment_id',
  auth,
  async (req, res) => {
    try {
      const post = await Post.findById(req.params.id);
      const comment = post.comments.find(comment => comment.id === req.params.comment_id);

      // Make sure comment exists
      if(!comment) {
        return res.status(404).json({ msg: 'Comment: Does not Exists' });
      }

      // Check User
      if(comment.user.toString() !== req.user.id) {
        return res.status(401).json({ msg: 'User: Unauthorized' });
      }

      // Get remove index
      const removeIndex = post.comments.map(comment => comment.user.toString()).indexOf(req.user.id);
      post.comments.splice(removeIndex, 1);

      await post.save();
      // res.json(post.comments);
      res.json({ msg: 'Comment: Deleted' });
    } 
    catch (err) {
      console.error(err.message);
      res.status(500).send('Server Error');
    }
});

module.exports = router;