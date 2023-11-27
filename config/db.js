require('dotenv').config();
const mongoose = require('mongoose');
const mongoURI = process.env.mongoURI

const connectDB = async () => {
  try {
    await mongoose.connect(mongoURI);
    console.log('----Connected to MongoDB----')
  }
  catch (err) {
    console.log(err.message);

    // Exit process with failure
    process.exit(1);
  }
};

module.exports = connectDB;