#!/bin/bash

# Color codes for terminal output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[0;33m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

echo -e "${CYAN}Checking Ollama API Endpoints...${NC}"

# Define endpoints to test
endpoints=(
  "http://192.168.1.50:11434/api/generate"
  "https://ollama.mhrpci.site/api/generate"
)

# Test payload
payload='{
  "model": "phi:latest",
  "prompt": "test connection",
  "stream": false,
  "options": {
    "temperature": 0.7
  }
}'

# Function to check if an endpoint is accessible
check_endpoint() {
  local endpoint=$1
  echo -e "\n${YELLOW}Testing endpoint: $endpoint${NC}"
  
  # Use curl with a 5-second timeout
  response=$(curl -s -w "\n%{http_code}" -X POST "$endpoint" \
    -H "Content-Type: application/json" \
    -d "$payload" \
    --max-time 5)
  
  # Extract status code from the last line
  http_code=$(echo "$response" | tail -n1)
  # Extract the actual response body (everything except the last line)
  body=$(echo "$response" | sed '$d')
  
  if [[ $http_code == 2* ]]; then
    echo -e "${GREEN}✓ SUCCESS: Endpoint is available and responding correctly${NC}"
    # Try to extract a snippet of the response
    if [[ ! -z "$body" ]]; then
      # Extract just the beginning of the response
      snippet=$(echo "$body" | grep -o '"response":"[^"]*' | head -1 | cut -d'"' -f4 | cut -c1-50)
      if [[ ! -z "$snippet" ]]; then
        echo -e "  Response received: $snippet..."
      fi
    fi
    return 0
  else
    echo -e "${RED}✗ ERROR: Endpoint returned status code $http_code${NC}"
    return 1
  fi
}

# Try each endpoint until one works
success=false
for endpoint in "${endpoints[@]}"; do
  if check_endpoint "$endpoint"; then
    echo -e "\n${GREEN}✓ Found working API endpoint: $endpoint${NC}"
    success=true
    break
  fi
done

# Check HTML implementation
echo -e "\n${CYAN}=== HTML Integration Check ===${NC}"

html_file="site/index.html"
if [[ -f "$html_file" ]]; then
  echo -e "${YELLOW}Analyzing HTML file for API integration...${NC}"
  
  if grep -q "getApiEndpoint\s*=" "$html_file"; then
    echo -e "${GREEN}✓ Found API endpoint selection function${NC}"
  else
    echo -e "${RED}✗ Could not find API endpoint selection function${NC}"
  fi
  
  if grep -q "FALLBACK_ENDPOINTS" "$html_file"; then
    echo -e "${GREEN}✓ Found fallback endpoints configuration${NC}"
  else
    echo -e "${RED}✗ Could not find fallback endpoints configuration${NC}"
  fi
  
  if grep -q "tryNextEndpoint" "$html_file"; then
    echo -e "${GREEN}✓ Found fallback mechanism implementation${NC}"
  else
    echo -e "${RED}✗ Could not find fallback mechanism implementation${NC}"
  fi
  
  if grep -q "checkAPIStatus" "$html_file"; then
    echo -e "${GREEN}✓ Found API status checking function${NC}"
  else
    echo -e "${RED}✗ Could not find API status checking function${NC}"
  fi
else
  echo -e "${RED}✗ Could not find HTML file at $html_file${NC}"
fi

# Summary
echo -e "\n${CYAN}=== Summary ===${NC}"
if $success; then
  echo -e "${GREEN}✓ At least one API endpoint is accessible${NC}"
else
  echo -e "${RED}✗ No API endpoints are currently accessible${NC}"
fi

echo -e "For production deployment, consider implementing:"
echo -e " - Automated health checks for your endpoints"
echo -e " - Server-side proxy to avoid CORS issues"
echo -e " - Rate limiting protection for your API keys"
echo -e " - Enhanced error handling and user notifications"

# Make this script executable with: chmod +x check-ollama-api.sh 