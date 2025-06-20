# Ollama API Connection Management Guide

This guide provides instructions for managing connections to the Ollama API endpoints in both local development and production environments.

## Available Tools

We've created three utilities to help manage API connections:

1. **PowerShell Script**: `check-ollama-api.ps1` - For Windows users
2. **Bash Script**: `check-ollama-api.sh` - For Linux/macOS users
3. **JavaScript Library**: `api-connection-utils.js` - Enhanced client-side connection handling

## CLI Usage

### Windows (PowerShell)

```powershell
# First, ensure execution policy allows running scripts
Set-ExecutionPolicy -ExecutionPolicy Bypass -Scope Process

# Run the API check script
.\check-ollama-api.ps1
```

### Linux/macOS (Bash)

```bash
# Make the script executable
chmod +x check-ollama-api.sh

# Run the API check script
./check-ollama-api.sh
```

## Integration with HTML Application

To integrate the enhanced API connection utilities with your HTML application:

1. Add the utilities script to your HTML file:

```html
<script src="api-connection-utils.js"></script>
```

2. Update your existing code to use the new utilities:

```html
<script>
document.addEventListener('DOMContentLoaded', function() {
    // Initialize API connection monitoring
    ApiUtils.checkApiStatus();
    
    // Set up periodic health checks
    setInterval(ApiUtils.checkApiStatus, ApiUtils.config.settings.checkInterval);
    
    // Use the enhanced API call function for requests
    async function sendMessage() {
        const message = messageInput.value.trim();
        if (!message || isGenerating) return;

        // Add user message to chat
        addMessage(message, 'user');
        conversationHistory.push({ role: 'user', content: message });
        
        // Clear input and update UI
        messageInput.value = '';
        messageInput.style.height = 'auto';
        charCount.textContent = '0/5000';
        sendButton.disabled = true;
        isGenerating = true;

        // Show typing indicator and updating status
        addTypingIndicator();
        
        try {
            // Use the enhanced API call function
            const selectedModel = modelSelector.value;
            const contextPrompt = buildContextPrompt(message);
            
            const data = await ApiUtils.callOllamaApi(selectedModel, contextPrompt);
            
            // Process response
            removeTypingIndicator();
            addMessage(data.response, 'ai');
            conversationHistory.push({ role: 'assistant', content: data.response });
        } catch (error) {
            removeTypingIndicator();
            addMessage('Sorry, I encountered an error while processing your request. Please try again.', 'ai', true);
            console.error('API Error:', error);
        } finally {
            isGenerating = false;
            sendButton.disabled = false;
        }
    }
    
    // Helper function to build context from conversation history
    function buildContextPrompt(message) {
        if (conversationHistory.length > 0) {
            return conversationHistory.slice(-6).map(msg => 
                `${msg.role === 'user' ? 'User' : 'Assistant'}: ${msg.content}`
            ).join('\n') + '\nUser: ' + message + '\nAssistant:';
        } else {
            return `You are ChuweyWebDev AI Assistant, a helpful AI that specializes in web development, coding, and technical assistance. Be helpful, concise, and professional.\n\nUser: ${message}\nAssistant:`;
        }
    }
    
    // Update your event handlers to use the new sendMessage function
    sendButton.addEventListener('click', sendMessage);
    messageInput.addEventListener('keydown', function(e) {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            sendMessage();
        }
    });
});
</script>
```

## Production Deployment Recommendations

For a robust production deployment:

1. **Server-side Proxy**: Implement a server-side proxy for API requests to:
   - Avoid CORS issues
   - Hide API keys from client-side code
   - Implement rate limiting and request validation

2. **Environment-specific Configuration**: Use environment variables or configuration files to manage endpoints for different environments.

3. **Health Monitoring**: Implement server-side health checks to detect API issues before users experience them.

4. **Fallback Content**: Provide graceful degradation when the API is unavailable or limited.

5. **Error Logging**: Implement comprehensive error logging to quickly identify and address issues.

## Security Considerations

1. **API Keys**: If your Ollama API requires authentication, store keys securely using environment variables or a secret management system.

2. **Input Validation**: Always validate user input before sending it to the API.

3. **Output Sanitization**: Sanitize API responses before displaying them to users to prevent XSS attacks.

4. **Rate Limiting**: Implement rate limiting on both client and server sides to prevent abuse.

## Troubleshooting

If you encounter connection issues:

1. **Check Firewalls**: Ensure your firewall allows the necessary connections.

2. **CORS Issues**: Set up proper CORS headers on your API server or use a server-side proxy.

3. **SSL/TLS**: Ensure valid certificates are installed if using HTTPS.

4. **Network Conditions**: Implement progressive enhancement for users with poor network conditions.

## Additional Resources

- [Ollama API Documentation](https://github.com/ollama/ollama/blob/main/docs/api.md)
- [Fetch API Documentation](https://developer.mozilla.org/en-US/docs/Web/API/Fetch_API)
- [MDN Web Docs: CORS](https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS)

---

*For additional support or questions, please contact the development team.* 