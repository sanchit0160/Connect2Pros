const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');

// Read the contents of the config.json file from /etc/secrets/
const configFile = '/etc/secrets/config.json';
const configData = fs.readFileSync(configFile, 'utf-8');
const config = JSON.parse(configData);

// Access Configuration Properties
const mongoURI = config.mongoURI;

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(mongoURI);
    console.log('----Connected to MongoDB----');
  } catch (err) {
    console.log(err.message);

    // Exit process with failure
    process.exit(1);
  }
};

module.exports = connectDB;