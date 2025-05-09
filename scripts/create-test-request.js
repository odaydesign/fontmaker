const fs = require('fs');
const path = require('path');

// Read the test image
const imagePath = path.join(__dirname, '../public/test-images/test-char.png');
const imageBuffer = fs.readFileSync(imagePath);
const base64Image = imageBuffer.toString('base64');
const dataUrl = `data:image/png;base64,${base64Image}`;

// Create the test request
const testRequest = {
  characterMappings: {
    "A": {
      "sourceImageId": "test-image",
      "x1": 0,
      "y1": 0,
      "x2": 100,
      "y2": 100,
      "originalImageWidth": 100,
      "originalImageHeight": 100
    }
  },
  sourceImages: {
    "test-image": dataUrl
  },
  metadata: {
    "name": "Test Font",
    "description": "A test font with the letter A",
    "author": "Test User",
    "isPublic": true,
    "tags": ["test", "simple"]
  },
  format: "ttf"
};

// Write the test request to a file
fs.writeFileSync(
  path.join(__dirname, '../test-font-request.json'),
  JSON.stringify(testRequest, null, 2)
); 