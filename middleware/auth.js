const jwt = require('jsonwebtoken');
const fs = require('fs');
const path = require('path');

// Read the contents of the config.json file from /etc/secrets/
const configFile = '/etc/secrets/config.json';
const configData = fs.readFileSync(configFile, 'utf-8');
const config = JSON.parse(configData);

module.exports = function(req, res, next) {
  const token = req.header('x-auth-token');
  if (!token) {
    return res.status(401).json({ msg: 'No token - Authorization Denied' });
  }

  try {
    // Use the JWT secret from the config.json file
    const decoded = jwt.verify(token, config.jwtSecret);
    console.log("decoded [auth-middleware]", decoded);

    req.user = decoded.user;
    next();
  } catch (err) {
    res.status(401).json({ msg: 'Invalid Token' });
  }
};
