const express = require('express');
const { check, validationResult } = require('express-validator');
const router = express.Router();
const gravatar = require('gravatar');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config();
const User = require('../../models/User');

/*
 * @router    POST api/users
 * @desc      Register user
 * @access    Public
 */

router.post('/', [
  check('name', 'Name is Required').not().notEmpty(),
  check('email', 'Email is Invalid').isEmail(),
  check('password', 'Password should contain 6 or more characters').isLength({ min: 6 })
], async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() })
  }

  const { name, email, password } = req.body;

  try {
    // See if user exists
    let user = await User.findOne({ email: email});
    if (user) {
      return res.status(400).json({ errors: [{ msg: 'User already exists' }] });
    }

    // Get users gravatar
    const avatar = gravatar.url(email, {
      s: '200',
      r: 'pg',
      d: 'mm'
    });

    user = new User({
      name, 
      email,
      avatar,
      password
    });


    // Encrypt password

    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(password, salt);
    await user.save();

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


    
    //res.send('Users registered');
  } 
  
  catch(err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;