const fs = require('fs');
const path = require('path');

// Test font generation
async function testFontGeneration() {
  console.log('🧪 Testing font generation...');
  
  try {
    const response = await fetch('http://localhost:3000/api/fonts/generate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        characterMappings: [], // Not needed for v4 test
        sourceImages: [], // Not needed for v4 test
        metadata: {
          name: 'TestFont',
          style: 'Regular',
          weight: 'Normal',
          author: 'TestUser'
        },
        format: 'ttf'
      })
    });
    
    const result = await response.json();
    console.log('📋 Response:', result);
    
    if (result.success) {
      console.log('✅ Font generation successful!');
      console.log('🔗 Download URL:', result.downloadUrl);
      console.log('📁 Local path:', result.localPath);
      
      // Test download
      console.log('🧪 Testing download...');
      const downloadResponse = await fetch(`http://localhost:3000${result.downloadUrl}`);
      
      if (downloadResponse.ok) {
        const fontData = await downloadResponse.arrayBuffer();
        console.log(`✅ Download successful! Font size: ${fontData.byteLength} bytes`);
        
        // Save to test file
        const testPath = './test-generated-font.ttf';
        fs.writeFileSync(testPath, Buffer.from(fontData));
        console.log(`💾 Font saved to: ${testPath}`);
      } else {
        console.log('❌ Download failed:', downloadResponse.status, downloadResponse.statusText);
      }
    } else {
      console.log('❌ Font generation failed:', result.error);
    }
    
  } catch (error) {
    console.error('💥 Test failed:', error.message);
  }
}

// Run the test
testFontGeneration(); 