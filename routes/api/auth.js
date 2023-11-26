const express = require('express');
const router = express.Router();
const auth = require('../../middleware/auth');
const User = require('../../models/User');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');

// Read the contents of the config.json file from /etc/secrets/
const configFile = '/etc/secrets/config.json';
const configData = fs.readFileSync(configFile, 'utf-8');
const config = JSON.parse(configData);

const { check, validationResult } = require('express-validator');

/*
 * @router    GET api/auth
 * @desc      Get user by token
 * @access    Private
 */
router.get('/', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) {
      return res.status(400).json({ msg: 'User not found' });
    }
    res.send(user);
  } catch (err) {
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
  check('email', 'Email is invalid').isEmail(),
  check('password', 'Password is required').exists(),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { email, password } = req.body;

  try {
    // See if user exists
    let user = await User.findOne({ email: email });
    console.log(user);

    if (!user) {
      return res.status(400).json({ errors: [{ msg: 'Invalid Credentials' }] });
    }

    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(400).json({ errors: [{ msg: 'Invalid Credentials' }] });
    }

    // Return JWT
    const payload = {
      user: {
        id: user.id,
      },
    };
    jwt.sign(
      payload,
      config.jwtSecret,
      { expiresIn: 360000 },
      (err, token) => {
        if (err) {
          throw err;
        }
        res.json({ token });
      }
    );
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;
