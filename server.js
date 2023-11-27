const express = require('express');
const connectDB = require('./config/db')
require('dotenv').config();

const app = express();
connectDB();

// Init middleware
app.use(express.json({ extended: false }));

app.get('/', (req, res) => {
  // Set the title in the HTML response
  res.send(`
    <html>
      <head>
        <link rel="icon" href="favicon.ico" />
        <title>node.js Server</title>
      </head>
      <body>
        <h1>Connect2Pros server is running</h1>
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
  return console.log(`Server started running on port ${PORT}`)
});