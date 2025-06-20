# Ollama API Connection - Quick Start Guide

This guide provides a quick overview of setting up and using the Ollama API connection tools in your project.

## 1. Check API Availability

### Using CLI Tools

#### On Windows:

```powershell
# Run the PowerShell script
.\check-ollama-api.ps1
```

#### On Linux/macOS:

```bash
# Make the script executable
chmod +x check-ollama-api.sh

# Run the script
./check-ollama-api.sh
```

This will check both local and production endpoints and provide detailed feedback about their availability.

## 2. Client-Side Integration

For the best user experience, integrate the enhanced JavaScript utilities:

1. Include the utility script in your HTML:

```html
<head>
  <!-- Add other scripts -->
  <script src="api-connection-utils.js"></script>
</head>
```

2. Initialize the API connection monitoring in your main JavaScript:

```javascript
document.addEventListener('DOMContentLoaded', function() {
  // Start monitoring API status
  ApiUtils.checkApiStatus();
  
  // Set up periodic checks
  setInterval(ApiUtils.checkApiStatus, ApiUtils.config.settings.checkInterval);
});
```

3. Use the enhanced API call function for all requests:

```javascript
async function sendChatMessage() {
  try {
    const data = await ApiUtils.callOllamaApi(
      'phi:latest',          // model
      'Your prompt here',    // prompt
      {                      // options
        temperature: 0.7,
        max_tokens: 2000
      }
    );
    
    // Process response
    console.log('Response:', data.response);
  } catch (error) {
    console.error('API Error:', error);
    // Show user-friendly error message
  }
}
```

## 3. Server-Side Proxy (Recommended for Production)

For production environments, use the Node.js proxy server:

1. Setup:

```bash
# Install dependencies
npm install

# Create .env file from example
cp env.example .env

# Edit .env with your configuration
nano .env
```

2. Start the server:

```bash
# Development mode (with auto-reload)
npm run dev

# Production mode
npm start
```

3. Update your client-side code to use the proxy:

```javascript
// In api-connection-utils.js, update the endpoints:
const ApiConfig = {
  endpoints: {
    local: 'http://localhost:3000/api/generate',
    production: 'https://your-domain.com/api/generate'
  },
  // other config...
};
```

## 4. Testing Your Implementation

1. Check API server health:

```
GET http://localhost:3000/health
```

2. Get API information:

```
GET http://localhost:3000/api/info
```

3. Send a test request:

```
POST http://localhost:3000/api/generate

{
  "model": "phi:latest",
  "prompt": "Hello, world!",
  "stream": false,
  "options": {
    "temperature": 0.7
  }
}
```

## 5. Common Issues & Solutions

### CORS Errors

If you see CORS errors in the browser console, ensure:

- Your proxy server has CORS enabled (the included code does this)
- You're accessing the API through the proxy, not directly

### Connection Timeouts

If requests time out:

- Check firewall settings
- Verify the Ollama service is running
- Try increasing timeout values in configuration

### Invalid Responses

If you get invalid or unexpected responses:

- Check that the model name is correct
- Verify your prompt format matches Ollama requirements
- Look at server logs for detailed error information

## Next Steps

For more detailed information, refer to:

- Full API Connection Guide: `API-CONNECTION-GUIDE.md`
- Ollama API Documentation: [GitHub - Ollama/Ollama](https://github.com/ollama/ollama/blob/main/docs/api.md)

---

For support or questions, please open an issue in the project repository. 