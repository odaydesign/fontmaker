#!/usr/bin/env node

/**
 * FontForge Setup Script
 * 
 * This script checks for the FontForge installation and other dependencies
 * needed for custom font generation.
 */

const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

// Check if FontForge is installed
function checkFontForge() {
  return new Promise((resolve) => {
    exec('fontforge --version', (error) => {
      if (error) {
        console.log('❌ FontForge is not installed or not in PATH');
        resolve(false);
      } else {
        console.log('✅ FontForge is installed');
        resolve(true);
      }
    });
  });
}

// Check if Python3 is installed
function checkPython() {
  return new Promise((resolve) => {
    exec('python3 --version', (error) => {
      if (error) {
        console.log('❌ Python3 is not installed or not in PATH');
        resolve(false);
      } else {
        console.log('✅ Python3 is installed');
        resolve(true);
      }
    });
  });
}

// Install Python dependencies
function installPythonDependencies() {
  return new Promise((resolve) => {
    const requirementsPath = path.join(__dirname, 'requirements.txt');
    
    exec(`pip3 install -r ${requirementsPath}`, (error, stdout, stderr) => {
      if (error) {
        console.log('❌ Failed to install Python dependencies');
        console.error(stderr);
        resolve(false);
      } else {
        console.log('✅ Python dependencies installed');
        console.log(stdout);
        resolve(true);
      }
    });
  });
}

// Create directories needed for font generation
function createDirectories() {
  const fontStoragePath = path.join(process.cwd(), 'font-storage');
  
  if (!fs.existsSync(fontStoragePath)) {
    fs.mkdirSync(fontStoragePath, { recursive: true });
    console.log('✅ Created font storage directory');
  } else {
    console.log('✅ Font storage directory already exists');
  }
}

// Create .env file with FontForge script path if it doesn't exist
function updateEnvFile() {
  const envPath = path.join(process.cwd(), '.env');
  const scriptPath = path.join(__dirname, 'generate_font.py').replace(/\\/g, '/');
  
  let envContent = '';
  
  if (fs.existsSync(envPath)) {
    envContent = fs.readFileSync(envPath, 'utf8');
  }
  
  // Check if FONTFORGE_SCRIPT_PATH is already set
  if (!envContent.includes('FONTFORGE_SCRIPT_PATH=')) {
    envContent += `\n# FontForge setup\nFONTFORGE_SCRIPT_PATH=${scriptPath}\n`;
    fs.writeFileSync(envPath, envContent);
    console.log('✅ Updated .env with FontForge script path');
  } else {
    console.log('✅ FontForge script path already in .env');
  }
}

// Install platform-specific package
function installFontForge() {
  const platform = os.platform();
  
  let installCommand = '';
  let installInstructions = '';
  
  switch (platform) {
    case 'darwin': // macOS
      installCommand = 'brew install fontforge';
      installInstructions = 'Install Homebrew from https://brew.sh and then run:\n' +
                           'brew install fontforge';
      break;
    case 'linux':
      installCommand = 'sudo apt-get install fontforge python3-fontforge';
      installInstructions = 'Run:\nsudo apt-get install fontforge python3-fontforge\n' +
                           'Or use your distribution\'s package manager';
      break;
    case 'win32':
      installInstructions = 'Download FontForge for Windows from https://fontforge.org/en-US/downloads/ and add it to your PATH';
      break;
    default:
      installInstructions = 'Please install FontForge manually from https://fontforge.org/en-US/downloads/';
  }
  
  console.log('\n=== FontForge Installation ===');
  console.log('FontForge is required for custom font generation.');
  console.log('Installation instructions:');
  console.log(installInstructions);
  
  if (installCommand) {
    console.log(`\nYou can try running: ${installCommand}`);
  }
}

async function main() {
  console.log('=== FontForge Setup ===');
  
  // Check dependencies
  const fontForgeInstalled = await checkFontForge();
  const pythonInstalled = await checkPython();
  
  if (pythonInstalled) {
    await installPythonDependencies();
  }
  
  // Create necessary directories
  createDirectories();
  
  // Update .env file
  updateEnvFile();
  
  if (!fontForgeInstalled) {
    installFontForge();
  }
  
  console.log('\n=== Setup Complete ===');
  console.log(`FontForge installed: ${fontForgeInstalled ? 'Yes' : 'No'}`);
  console.log(`Python3 installed: ${pythonInstalled ? 'Yes' : 'No'}`);
  
  if (!fontForgeInstalled || !pythonInstalled) {
    console.log('\n⚠️ Warning: Not all dependencies are installed.');
    console.log('Custom font generation will fall back to placeholder fonts until dependencies are installed.');
  } else {
    console.log('\n✅ All dependencies are installed. Custom font generation should work!');
  }
}

main().catch(console.error); 