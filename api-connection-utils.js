/**
 * Ollama API Connection Utilities
 * Enhanced error handling and connection management for Ollama API integration
 */

/**
 * Configuration for API endpoints and connection settings
 */
const ApiConfig = {
    // Primary endpoints
    endpoints: {
        local: 'http://192.168.1.50:11434/api/generate',
        production: 'https://ollama.mhrpci.site/api/generate'
    },
    
    // Connection settings
    settings: {
        timeout: 8000,           // 8 seconds timeout
        retryCount: 2,           // Number of retries per endpoint
        retryDelay: 1000,        // Delay between retries (ms)
        checkInterval: 30000     // Health check interval (ms)
    },
    
    // Models available in the API
    models: {
        'phi:latest': 'Phi',
        'deepseek-coder:6.7b-instruct': 'DeepSeekCoder',
        'mistral:latest': 'Mistral'
    }
};

/**
 * Get the appropriate API endpoint based on environment
 * @returns {string} API endpoint URL
 */
function getApiEndpoint() {
    // Check if we're running locally by hostname
    const isLocalEnvironment = window.location.hostname.includes('localhost') || 
                               window.location.hostname.includes('127.0.0.1') ||
                               window.location.hostname.includes('192.168.');
                            
    // Cache the result in sessionStorage to avoid checking on every request
    if (!sessionStorage.getItem('apiEndpoint')) {
        const endpoint = isLocalEnvironment 
            ? ApiConfig.endpoints.local  
            : ApiConfig.endpoints.production;
        sessionStorage.setItem('apiEndpoint', endpoint);
    }
    
    return sessionStorage.getItem('apiEndpoint');
}

/**
 * Generate an array of fallback endpoints excluding the current primary endpoint
 * @returns {string[]} Array of fallback endpoint URLs
 */
function getFallbackEndpoints() {
    const primaryEndpoint = getApiEndpoint();
    
    // Return all endpoints except the current primary one
    return Object.values(ApiConfig.endpoints).filter(endpoint => 
        endpoint !== primaryEndpoint
    );
}

/**
 * Try the next available endpoint when the current one fails
 * @returns {Promise<string>} The URL of the working endpoint or error
 */
async function tryNextEndpoint() {
    const fallbacks = getFallbackEndpoints();
    
    // Try each fallback endpoint
    for (const endpoint of fallbacks) {
        console.log(`Trying fallback endpoint: ${endpoint}`);
        
        try {
            // Test connection with a simple request
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), ApiConfig.settings.timeout);
            
            const response = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ model: 'phi:latest', prompt: 'test', stream: false }),
                signal: controller.signal
            });
            
            clearTimeout(timeoutId);
            
            if (response.ok) {
                console.log(`Fallback endpoint working: ${endpoint}`);
                // Store the working endpoint
                sessionStorage.setItem('apiEndpoint', endpoint);
                
                // Show success notification if showToast is defined
                if (typeof showToast === 'function') {
                    showToast('success', 'Switched to alternate API server', 'Connection established');
                }
                
                return endpoint;
            }
        } catch (error) {
            console.warn(`Fallback endpoint failed: ${endpoint}`, error);
        }
    }
    
    // If all fallbacks fail, return to the primary endpoint
    const primaryEndpoint = getApiEndpoint();
    console.log(`All fallbacks failed, reverting to primary endpoint: ${primaryEndpoint}`);
    return primaryEndpoint;
}

/**
 * Check if the API is online and responsive
 * @returns {Promise<boolean>} True if API is online, false otherwise
 */
async function checkApiStatus() {
    const endpoint = getApiEndpoint();
    
    try {
        // Show checking status
        updateConnectionStatus('warning', 'Checking API...');
        
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), ApiConfig.settings.timeout);
        
        const response = await fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model: 'phi:latest',
                prompt: 'test',
                stream: false
            }),
            signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        
        if (response.ok) {
            updateConnectionStatus('online', 'AI Online');
            console.log('API connection successful');
            return true;
        } else {
            const errorData = await response.json().catch(() => ({}));
            console.warn('API returned an error:', errorData);
            updateConnectionStatus('warning', 'API Limited');
            
            // Show notification for limited API
            if (typeof showToast === 'function' && isAuthenticationComplete()) {
                showToast('warning', 'API Limited', 'The AI service is experiencing limitations');
            }
            return false;
        }
    } catch (error) {
        console.error('API connection failed:', error);
        
        // Handle specific error types
        if (error.name === 'AbortError') {
            updateConnectionStatus('offline', 'Connection Timeout');
        } else if (error.message && error.message.includes('NetworkError')) {
            updateConnectionStatus('offline', 'Network Error');
        } else {
            updateConnectionStatus('offline', 'AI Offline');
        }
        
        // Show notification for connection issues
        if (typeof showToast === 'function' && isAuthenticationComplete()) {
            showToast('error', 'API Connection Failed', 'Could not connect to AI service');
        }
        
        // Try fallback endpoints
        tryNextEndpoint();
        
        return false;
    }
}

/**
 * Update the connection status in the UI
 * @param {string} status - Status type: 'online', 'warning', 'offline'
 * @param {string} text - Status message to display
 */
function updateConnectionStatus(status, text) {
    // Only update if elements exist
    const statusText = document.getElementById('statusText');
    const statusIndicator = document.getElementById('statusIndicator');
    
    if (statusText && statusIndicator) {
        statusText.textContent = text;
        statusIndicator.className = `w-2 h-2 rounded-full mr-2 ${
            status === 'online' ? 'bg-green-400' : 
            status === 'warning' ? 'bg-yellow-400' : 'bg-red-400'
        }`;
    }
}

/**
 * Check if authentication is complete (user is in the main app)
 * @returns {boolean} True if authentication is complete
 */
function isAuthenticationComplete() {
    const authOverlay = document.getElementById('authOverlay');
    return !authOverlay || authOverlay.style.display === 'none';
}

/**
 * Make an API request with enhanced error handling and fallback
 * @param {string} model - The AI model to use
 * @param {string} prompt - The prompt to send to the API
 * @param {Object} options - Additional options for the API call
 * @returns {Promise<Object>} The API response
 */
async function callOllamaApi(model, prompt, options = {}) {
    let endpoint = getApiEndpoint();
    let attempts = 0;
    const maxAttempts = ApiConfig.settings.retryCount * 2; // Allow retries on primary + one fallback
    
    // Build the request payload
    const requestBody = {
        model: model,
        prompt: prompt,
        stream: options.stream || false,
        options: {
            temperature: options.temperature || 0.7,
            top_p: options.top_p || 0.9,
            max_tokens: options.max_tokens || 5000
        }
    };
    
    while (attempts < maxAttempts) {
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), ApiConfig.settings.timeout);
            
            const response = await fetch(endpoint, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(requestBody),
                signal: controller.signal
            });
            
            clearTimeout(timeoutId);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            
            if (data.error) {
                throw new Error(data.error);
            }
            
            // Reset status to online after successful request
            updateConnectionStatus('online', 'AI Online');
            
            return data;
        } catch (error) {
            attempts++;
            console.error(`API request failed (attempt ${attempts}/${maxAttempts}):`, error);
            
            if (attempts % ApiConfig.settings.retryCount === 0) {
                // After retrying the current endpoint, try the next one
                endpoint = await tryNextEndpoint();
                updateConnectionStatus('warning', 'Switching endpoints...');
            } else if (attempts < maxAttempts) {
                // Wait before retrying
                updateConnectionStatus('warning', 'Retrying connection...');
                await new Promise(r => setTimeout(r, ApiConfig.settings.retryDelay));
            }
            
            // If we've exhausted all attempts, rethrow the error
            if (attempts >= maxAttempts) {
                updateConnectionStatus('offline', 'Connection Failed');
                throw error;
            }
        }
    }
}

// Export utility functions
window.ApiUtils = {
    getApiEndpoint,
    checkApiStatus,
    callOllamaApi,
    config: ApiConfig
}; 