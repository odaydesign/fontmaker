#!/bin/bash

# Test the deployment
echo "Testing Railway deployment..."

# Get the deployment URL
RAILWAY_URL=$(railway status | grep "Deployment URL" | awk '{print $3}')

if [ -z "$RAILWAY_URL" ]; then
    echo "Error: Could not find deployment URL"
    exit 1
fi

echo "Deployment URL: $RAILWAY_URL"

# Test the health endpoint
echo "Testing health endpoint..."
curl -f "$RAILWAY_URL/api/health" || {
    echo "Error: Health check failed"
    exit 1
}

# Test the main page
echo "Testing main page..."
curl -f "$RAILWAY_URL" || {
    echo "Error: Main page check failed"
    exit 1
}

echo "All tests passed successfully!" 