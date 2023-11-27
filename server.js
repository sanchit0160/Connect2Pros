const express = require('express');
const cors = require('cors');
const connectDB = require('./config/db');
require('dotenv').config();

const app = express();
connectDB();

// Init middleware
app.use(cors()); // Allow all origins to access the server
app.use(express.json({ extended: false }));

// Set up your routes
app.get('/', (req, res) => {
  res.send(`
    <html>
      <head>
        <link rel="icon" href="favicon.ico" />
        <title>connect2pros Server</title>
      </head>
      <body>
        <h1>connect2pros server is running</h1>
      </body>
    </html>
  `);
});

app.use('/api/auth', require('./routes/api/auth'));
app.use('/api/posts', require('./routes/api/posts'));
app.use('/api/profile', require('./routes/api/profile'));
app.use('/api/users', require('./routes/api/users'));

const PORT = process.env.PORT || 471;
app.listen(PORT, () => {
  console.log(`Server started running on port ${PORT}`);
});
