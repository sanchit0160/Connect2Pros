const express = require('express');
const { check, validationResult } = require('express-validator');
const router = express.Router();
const gravatar = require('gravatar');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const fs = require('fs');
const path = require('path');

const User = require('../../models/User');

// Read the contents of the config.json file from /etc/secrets/
const configFile = '/etc/secrets/config.json';
const configData = fs.readFileSync(configFile, 'utf-8');
const config = JSON.parse(configData);

/*
 * @router    POST api/users
 * @desc      Register user
 * @access    Public
 */
router.post('/', [
  check('name', 'Name is required').not().notEmpty(),
  check('email', 'Email is invalid').isEmail(),
  check('password', 'Password should contain 6 or more characters').isLength({ min: 6 }),
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { name, email, password } = req.body;

  try {
    // See if user exists
    let user = await User.findOne({ email: email });
    if (user) {
      return res.status(400).json({ errors: [{ msg: 'User already exists' }] });
    }

    // Get user's gravatar
    const avatar = gravatar.url(email, {
      s: '200',
      r: 'pg',
      d: 'mm',
    });

    user = new User({
      name,
      email,
      avatar,
      password,
    });

    // Encrypt password
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(password, salt);
    await user.save();

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