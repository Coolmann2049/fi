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
app.get('/linkedin-test', (req, res) => {
  /*
  https://www.linkedin.com/oauth/v2/authorization?
response_type=code&
client_id=778mgpop1i3qdp&
redirect_uri=https://blulink-webhook-test.onrender.com/linkedin-test
scope=openid%20profile%20email&
state=123&
nonce=456
  */
  try {
    const authorizationCode = req.query.code;
    const state = req.query.state;

    console.log('Received LinkedIn OAuth Callback:');
    console.log('Authorization Code:', authorizationCode);
    console.log('State:', state);
    
    // Don't send responses here - wait until the end of the function
    
    const axios = require('axios'); // Need to install axios: npm install axios

    // Check if we have the authorization code before proceeding
    if (!authorizationCode) {
      return res.status(400).send('Missing authorization code');
    }

    const tokenEndpoint = 'https://www.linkedin.com/oauth/v2/accessToken';
    const yourClientId = '778mgpop1i3qdp'; // Get from environment variables
    const yourClientSecret = 'WPL_AP1.g2gZLwfLcZBhQ6VO.b2YMEA=='; // Get from environment variables
    const yourRedirectUri = 'https://blulink-webhook-test.onrender.com/linkedin-test'; // Get from environment variables

    axios.post(tokenEndpoint, null, {
        params: {
            grant_type: 'authorization_code',
            code: authorizationCode,
            redirect_uri: yourRedirectUri,
            client_id: yourClientId,
            client_secret: yourClientSecret
        }
    })
    .then(response => {
        const accessToken = response.data.access_token;
        const idToken = response.data.id_token; // This is the OpenID Connect token

        console.log('Successfully exchanged code for tokens.');
        console.log('Access Token:', accessToken);
        console.log('ID Token:', idToken);
        
        // Only send one response - either redirect OR send data
        // res.redirect('/linkedin-test'); // This would conflict with the next line
        res.send('LinkedIn authentication successful');
    })
    .catch(error => {
        console.error('Error exchanging code for tokens:', error.response ? error.response.data : error.message);
        res.status(500).send('Authentication failed.'); 
    });
  } catch (error) {
      console.error('Unexpected error:', error);
      res.status(500).send('An unexpected error occurred');
  }
});

// Start the server
app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});