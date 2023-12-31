const jwt = require('jsonwebtoken');
require('dotenv').config();

module.exports = function(req, res, next) {
  // console.log("req.user [auth-middleware]", req.user);
  const token = req.header('x-auth-token');
  if(!token) {
    return res.status(401).json({ msg: 'No token - Authorization Denied' });
  }

  try {
    const decoded = jwt.verify(token, process.env.jwtSecret);
    console.log("decoded [auth-middleware]", decoded);

    req.user = decoded.user;
    next();
  } 
  catch(err) {
    res.status(401).json({ msg: 'Invalid Token' });
  }
}