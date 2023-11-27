const express = require('express');
const request = require('request');
require('dotenv').config();
const router = express.Router();
const auth = require('../../middleware/auth');
const { check, validationResult } = require('express-validator');
// bring in normalize to give us a proper url, regardless of what user entered
//const normalize = require('normalize-url');
//const checkObjectId = require('../../middleware/checkObjectId');

const Profile = require('../../models/Profile');
const User = require('../../models/User');
//const Post = require('../../models/Post');

// @route    GET api/profile/me
// @desc     Get current users profile
// @access   Private
router.get('/me', auth, async (req, res) => {
  try {
    const profile = await Profile.findOne({
      user: req.user.id
    }).populate('user', ['name', 'avatar']);

    if (!profile) {
      return res.status(400).json({ msg: 'There is no profile for this user' });
    }

    res.json(profile);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route    POST api/profile
// @desc     Create or update user profile
// @access   Private
router.post(
  '/',
  auth,
  [
    check('status', 'Status is required').notEmpty(),
    check('skills', 'Skills is required').notEmpty()
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    // destructure the request
    const {
      company,
      website,
      location,
      bio,
      status,
      githubusername,
      skills,
      youtube,
      facebook,
      twitter,
      instagram,
      linkedin
      // spread the rest of the fields we don't need to check
      // ...rest
    } = req.body;

    const profileFields = {};
    profileFields.user = req.user.id;
    if(company) profileFields.company = company;
    if (website) profileFields.website = website;
    if (location) profileFields.location = location;
    if (bio) profileFields.bio = bio;
    if (status) profileFields.status = status;
    if (githubusername) profileFields.githubusername = githubusername;

    // Assuming 'skills' is an array, you might want to check if it's not empty before assigning it.
    if (skills) {
      console.log(123);
      profileFields.skills = skills.split(',').map(skill => skill.trim());
    }

    console.log(profileFields.skills);
    // res.send('Hello');

    profileFields.social = {};

    if (youtube) profileFields.social.youtube = youtube;
    if (facebook) profileFields.social.facebook = facebook;
    if (twitter) profileFields.social.twitter = twitter;
    if (instagram) profileFields.social.instagram = instagram;
    if (linkedin) profileFields.social.linkedin = linkedin;
   // ... Handle other fields if needed

   try {
    let profile = await Profile.findOne({
      user: req.user.id
    }).populate('user', ['name', 'avatar']);

    if (profile) {
      profile = await Profile.findOneAndUpdate(
        {user: req.user.id},
        {$set: profileFields},
        {new: true}
      );
      return res.json(profile);
      //return res.status(400).json({ msg: 'There is no profile for this user' });
      }
      // Create
      profile = new Profile(profileFields);
      await profile.save();
      res.json(profile);

    //res.json(profile);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }

   
});


// @route    GET api/profile/
// @desc     Get all profiles
// @access   Public

router.get('/', async (req, res) => {
  try {
    const profiles = await Profile.find().populate('user', ['name', 'avatar']);
    res.json(profiles);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route    GET api/profile/user:user_id
// @desc     Get profile by user ID
// @access   Public

router.get('/user/:user_id', async (req, res) => {
  try {
    const profile = await Profile.findOne({ 
      user: req.params.user_id 
    }).populate('user', ['name', 'avatar']);

    if(!profile) {
      return res.status(400).json({ msg: 'There is no profile for this user' });
    }

    res.json(profile);
  } 
  catch (err) {
    if(err.kind == 'ObjectId') {
      return res.status(400).json({ msg: 'Profile' })
    }
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route    DELETE api/profile/user:user_id
// @desc     Delete profile, user & posts
// @access   Private

router.delete('/', auth, async (req, res) => {
  try {
    // need to remove users posts

    // Remove Profile
    await Profile.findOneAndRemove({ 
      user: req.user.id 
    });
    // Remove User
    await User.findOneAndRemove({ 
      _id: req.user.id 
    });

    res.json({ msg: 'User Removed' });
  } 
  catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// @route    PUT api/profile/experience
// @desc     Add profile experience
// @access   Private

router.put(
  '/experience', 
  [
    auth, 
    [
      check('title', 'Title is Required')
      .not()
      .isEmpty(),
      check('company', 'Company is Required')
      .not()
      .isEmpty(),
      check('from', 'From data is Required')
      .not()
      .isEmpty(),
    ]
  ], 
  async (req, res) => {
    const errors = validationResult(req);
    if(!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      title,
      company,
      location,
      from,
      to,
      current,
      description
    } = req.body;

    const newExp = {
      title,
      company,
      location,
      from,
      to,
      current,
      description
    }
    try {
      const profile = await Profile.findOne({ 
        user: req.user.id 
      });
      profile.experience.unshift(newExp);
      await profile.save();
      res.json(profile);
    } 
    catch (err) {
      console.error(err.message);
      res.status(500).send('Server Error');
    }
});

// @route    DELETE api/profile/experience
// @desc     Delete experience from profile
// @access   Private

router.delete(
  '/experience/:exp_id', 
  auth, 
  async (req, res) => {
    try {
      const profile = await Profile.findOne({ 
        user: req.user.id 
      });

      // Get remove index
      const removeIndex = profile.experience
      .map(item => item.id)
      .indexOf(req.params.exp_id);

      profile.experience.splice(removeIndex, 1);
      await profile.save();
      res.json(profile);
    } 
    catch (err) {
      console.error(err.message);
      res.status(500).send('Server Error');
    }
});


// @route    PUT api/profile/education
// @desc     Add profile education
// @access   Private

router.put(
  '/education', 
  [
    auth, 
    [
      check('school', 'School is Required')
      .not()
      .isEmpty(),
      check('degree', 'Degree is Required')
      .not()
      .isEmpty(),
      check('fieldOfStudy', 'Field of Study is Required')
      .not()
      .isEmpty(),
    ]
  ], 
  async (req, res) => {
    const errors = validationResult(req);
    if(!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const {
      school,
      degree,
      fieldOfStudy,
      from,
      to,
      current,
      description
    } = req.body;

    const newEdu = {
      school,
      degree,
      fieldOfStudy,
      from,
      to,
      current,
      description
    }
    try {
      const profile = await Profile.findOne({ 
        user: req.user.id 
      });
      profile.education.unshift(newEdu);
      await profile.save();
      res.json(profile);
    } 
    catch (err) {
      console.error(err.message);
      res.status(500).send('Server Error');
    }
});

// @route    DELETE api/profile/education
// @desc     Delete education from profile
// @access   Private

router.delete(
  '/education/:edu_id', 
  auth, 
  async (req, res) => {
    try {
      const profile = await Profile.findOne({ 
        user: req.user.id 
      });

      // Get remove index
      const removeIndex = profile.education
      .map(item => item.id)
      .indexOf(req.params.edu_id);

      profile.education.splice(removeIndex, 1);
      await profile.save();
      res.json(profile);
    } 
    catch (err) {
      console.error(err.message);
      res.status(500).send('Server Error');
    }
});


// @route    Get api/profile/github/:username
// @desc     Get user repos from Githuh
// @access   Public

router.get(
  '/github/:username', 
  async (req, res) => {
    try {
      const options = {
        uri: `https://api.github.com/users/${
          req.params.username
        }/repos?per_page=5&sort=created:asc&client_id=${process.env.githubClientId}&client_secret=${process.env.githubSecret}`,
        method: 'GET',
        headers: { 'user-agent': 'node.js' }
      };

      request(options, (error, response, body) => {
        if(error) {
          console.error(error);
        }
        if(response.statusCode !== 200) {
          return res.status(404).json({ msg: 'No GitHub profile found' });
        }
        res.json(JSON.parse(body));
      })

    } 
    catch (err) {
      console.error(err.message);
      res.status(500).send('Server Error');
    }
});


module.exports = router;