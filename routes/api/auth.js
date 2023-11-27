const express = require('express');
const router = express.Router();
const auth = require('../../middleware/auth');
const User = require('../../models/User');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
require('dotenv').config();
const { check, validationResult } = require('express-validator');


/*
 * @router    GET api/auth
 * @desc      Get user by token
 * @access    Private
 */

router.get('/', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if(!user) {
      return res.status(400).json({ msg: 'User not found' });
    }
    res.send(user);
  }
  catch(err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});


/*
 * @router    POST api/auth
 * @desc      Authenticate User & Get Token
 * @access    Public
 */

router.post('/', [
  check('email', 'Invalid: Email').isEmail(),
  check('password', 'Password: Required').exists(),

], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() })
  }

  const { email, password } = req.body;

  try {
    // See if user exists
    let user = await User.findOne({ email: email});
    console.log(user);

    if (!user) {
      return res.status(400).json({ errors: [{ msg: 'Invalid: Credentials' }] });
    }

    const IsMatch = await bcrypt.compare(password, user.password);

    if(!IsMatch) {
      return res.status(400).json({ errors: [{ msg: 'Invalid: Credentials' }] });
    }

    // Return JWT
    const payload = {
      user: {
        id: user.id
      }
    };
    jwt.sign(
      payload, 
      process.env.jwtSecret, 
      {expiresIn: 360000}, 
      (err, token) => {
        if(err) {
          throw err;
        }
        res.json({ token });
      });
  } 
  
  catch(err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;