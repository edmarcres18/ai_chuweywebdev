/**
 * Ollama API Proxy Server
 * 
 * This proxy server sits between your frontend application and the Ollama API,
 * handling CORS, request validation, error handling, and API key management.
 * 
 * Usage:
 * - Install dependencies: npm install express cors axios dotenv
 * - Create .env file with API configuration
 * - Run: node ollama-proxy.js
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const axios = require('axios');
const { createLogger, format, transports } = require('winston');

// Configuration
const PORT = process.env.PORT || 3000;

// Available Ollama API endpoints
const API_ENDPOINTS = {
  local: process.env.OLLAMA_API_LOCAL || 'http://192.168.1.50:11434/api/generate',
  production: process.env.OLLAMA_API_PRODUCTION || 'https://ollama.mhrpci.site/api/generate'
};

// Default endpoint to use
const DEFAULT_ENDPOINT = process.env.NODE_ENV === 'production' ? 'production' : 'local';

// Configure request rate limiting
const RATE_LIMIT = {
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 20       // 20 requests per minute
};

// Setup request tracking for rate limiting
const requestTracking = new Map();

// Configure logger
const logger = createLogger({
  level: 'info',
  format: format.combine(
    format.timestamp(),
    format.json()
  ),
  transports: [
    new transports.Console(),
    new transports.File({ filename: 'ollama-proxy-error.log', level: 'error' }),
    new transports.File({ filename: 'ollama-proxy.log' })
  ]
});

// Create Express app
const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Request logging middleware
app.use((req, res, next) => {
  logger.info({
    method: req.method,
    url: req.url,
    ip: req.ip,
    userAgent: req.headers['user-agent']
  });
  next();
});

// Rate limiting middleware
app.use((req, res, next) => {
  const clientIp = req.ip;
  const now = Date.now();
  
  // Initialize or clean up old requests for this IP
  if (!requestTracking.has(clientIp)) {
    requestTracking.set(clientIp, []);
  }
  
  let requests = requestTracking.get(clientIp);
  
  // Remove requests outside current window
  const windowStart = now - RATE_LIMIT.windowMs;
  requests = requests.filter(timestamp => timestamp > windowStart);
  
  // Check if rate limit is exceeded
  if (requests.length >= RATE_LIMIT.maxRequests) {
    logger.warn(`Rate limit exceeded for IP: ${clientIp}`);
    return res.status(429).json({ 
      error: 'Too many requests', 
      message: 'Please try again later'
    });
  }
  
  // Add current request timestamp and update map
  requests.push(now);
  requestTracking.set(clientIp, requests);
  
  next();
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// API info endpoint
app.get('/api/info', (req, res) => {
  res.status(200).json({
    name: 'Ollama API Proxy',
    version: '1.0.0',
    endpoints: Object.keys(API_ENDPOINTS),
    rateLimit: RATE_LIMIT
  });
});

// Proxy endpoint for Ollama API
app.post('/api/generate', async (req, res) => {
  try {
    // Validate request
    const { model, prompt, stream, options } = req.body;
    
    if (!model || !prompt) {
      return res.status(400).json({ 
        error: 'Missing parameters',
        message: 'Model and prompt are required'
      });
    }
    
    // Select API endpoint to use
    const endpointKey = req.query.endpoint || DEFAULT_ENDPOINT;
    
    if (!API_ENDPOINTS[endpointKey]) {
      return res.status(400).json({
        error: 'Invalid endpoint',
        message: `Endpoint '${endpointKey}' is not available` 
      });
    }
    
    const apiEndpoint = API_ENDPOINTS[endpointKey];
    
    // Prepare request configuration
    const axiosConfig = {
      headers: {
        'Content-Type': 'application/json',
      },
      timeout: 30000, // 30 second timeout
    };
    
    // Add API key if defined in .env
    if (process.env.OLLAMA_API_KEY) {
      axiosConfig.headers['Authorization'] = `Bearer ${process.env.OLLAMA_API_KEY}`;
    }
    
    logger.info(`Forwarding request to ${endpointKey} endpoint: ${apiEndpoint}`);
    
    // Call the API
    const response = await axios.post(
      apiEndpoint,
      req.body,
      axiosConfig
    );
    
    // Return the API response
    res.status(200).json(response.data);
    
  } catch (error) {
    // Enhanced error handling with different status codes
    logger.error('API request failed', { error: error.toString(), stack: error.stack });
    
    // Check for specific axios errors and provide appropriate responses
    if (error.response) {
      // The server responded with a status code outside the 2xx range
      return res.status(error.response.status).json({
        error: 'API Error',
        message: error.response.data?.error || 'The API returned an error',
        status: error.response.status
      });
    } else if (error.request) {
      // The request was made but no response was received
      return res.status(504).json({
        error: 'Gateway Timeout',
        message: 'The API server is not responding'
      });
    } else {
      // Something else happened while setting up the request
      return res.status(500).json({
        error: 'Internal Server Error',
        message: 'An error occurred while processing your request'
      });
    }
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  logger.error('Unhandled error', { error: err.toString(), stack: err.stack });
  
  res.status(500).json({
    error: 'Server Error',
    message: 'An unexpected error occurred'
  });
});

// Start the server
app.listen(PORT, () => {
  logger.info(`Ollama API proxy server running on port ${PORT}`);
  logger.info(`API endpoints: ${JSON.stringify(API_ENDPOINTS)}`);
});

module.exports = app; 