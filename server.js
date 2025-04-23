const express = require('express');
const bodyParser = require('body-parser');
const app = express();
const port = process.env.PORT || 3000;

// Middleware to parse JSON request bodies
app.use(bodyParser.json());

// API endpoint to handle POST requests
app.post('/', (req, res) => {
  console.log('Received POST request:');
  console.log(req); 
  // This will log the entire request object

  res.status(200).json({ message: 'Request received' }); // Add a response
  // You can also log specific parts of the request, like the body:
  // console.log('Request Body:', req.body);
});

app.get('/test', (req, res) => {
  res.send('Test fucking works.');
});

// Start the server
app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});