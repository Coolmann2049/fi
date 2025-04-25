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

// Instagram auth endpoint (changed from POST to GET)
app.get('/instagram-auth', (req, res) => {
  /*
  https://www.instagram.com/oauth/authorize
    ?enable_fb_login=0&force_authentication=1
    &client_id=544149758732989
    &redirect_uri=https://blulink-webhook-test.onrender.com/instagram-auth
    &response_type=code
    &scope=
      instagram_business_basic%2C
      instagram_business_manage_messages%2C
      instagram_business_manage_comments%2C
      instagram_business_content_publish%2C
      instagram_business_manage_insights
  */
  try {
    console.log('Received Instagram auth callback:');
    
    // Check for error in the callback
    if (req.query.error) {
      console.log('Instagram auth error:', {
        error: req.query.error,
        reason: req.query.error_reason,
        description: req.query.error_description
      });
      return res.status(400).send('Authentication failed: ' + req.query.error_description);
    }
    
    // Extract authorization code from query parameters
    let authCode = req.query.code;
    
    // Strip out the #_ if it exists at the end of the code
    if (authCode && authCode.includes('#_')) {
      authCode = authCode.replace('#_', '');
    }
    
    console.log('Authorization Code:', authCode);
    
    if (!authCode) {
      return res.status(400).send('Missing authorization code');
    }
    
    const axios = require('axios');
    
    // Instagram token exchange endpoint
    const tokenEndpoint = 'https://api.instagram.com/oauth/access_token';
    const clientId = '544149758732989'; // Instagram app ID
    const clientSecret = 'YOUR_INSTAGRAM_CLIENT_SECRET'; // Replace with your Instagram app secret
    const redirectUri = 'https://blulink-webhook-test.onrender.com/instagram-auth';
    
    // Create form data for Instagram's token endpoint
    const FormData = require('form-data');
    const formData = new FormData();
    formData.append('client_id', clientId);
    formData.append('client_secret', clientSecret);
    formData.append('grant_type', 'authorization_code');
    formData.append('redirect_uri', redirectUri);
    formData.append('code', authCode);
    
    // Exchange authorization code for short-lived access token
    axios.post(tokenEndpoint, formData, {
      headers: {
        ...formData.getHeaders()
      }
    })
    .then(response => {
      console.log('Instagram token exchange successful');
      console.log('Short-lived token response:', response.data);
      
      // Extract the short-lived access token
      const shortLivedToken = response.data.access_token;
      const userId = response.data.user_id;
      
      if (!shortLivedToken) {
        throw new Error('No access token received');
      }
      
      // Exchange short-lived token for long-lived token
      return axios.get('https://graph.instagram.com/access_token', {
        params: {
          grant_type: 'ig_exchange_token',
          client_secret: clientSecret,
          access_token: shortLivedToken
        }
      }).then(longTokenResponse => {
        console.log('Long-lived token exchange successful');
        console.log('Long-lived token response:', longTokenResponse.data);
        
        const longLivedToken = longTokenResponse.data.access_token;
        const expiresIn = longTokenResponse.data.expires_in;
        
        console.log('Long-lived access token:', longLivedToken);
        console.log('Token expires in:', expiresIn, 'seconds');
        
        // Return success response with tokens
        res.status(200).json({
          message: 'Instagram authentication successful',
          user_id: userId,
          short_lived_token: shortLivedToken,
          long_lived_token: longLivedToken,
          expires_in: expiresIn
        });
      });
    })
    .catch(error => {
      console.error('Error in Instagram token exchange:', 
        error.response ? error.response.data : error.message);
      res.status(500).send('Authentication failed: ' + 
        (error.response && error.response.data.error_message ? 
          error.response.data.error_message : error.message));
    });
  } catch (error) {
    console.error('Unexpected error in Instagram auth:', error);
    res.status(500).send('An unexpected error occurred');
  }
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