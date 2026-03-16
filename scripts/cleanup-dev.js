#!/usr/bin/env node

/**
 * Development cleanup script
 * Helps resolve common development server issues
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🧹 Cleaning up development environment...\n');

// Function to safely remove directory
function removeDir(dirPath) {
  if (fs.existsSync(dirPath)) {
    try {
      fs.rmSync(dirPath, { recursive: true, force: true });
      console.log(`✅ Removed ${dirPath}`);
    } catch (error) {
      console.log(`⚠️  Could not remove ${dirPath}: ${error.message}`);
    }
  } else {
    console.log(`ℹ️  ${dirPath} does not exist`);
  }
}

// Function to kill process by port
function killProcessByPort(port) {
  try {
    console.log(`🔍 Checking for processes on port ${port}...`);
    
    // Check if netstat is available
    let output;
    try {
      output = execSync(`netstat -ano | findstr :${port}`, { encoding: 'utf8' });
    } catch (error) {
      console.log(`⚠️  Could not check port ${port}: ${error.message}`);
      return;
    }

    if (output.trim()) {
      const lines = output.trim().split('\n');
      const pids = lines.map(line => {
        const parts = line.trim().split(/\s+/);
        return parts[parts.length - 1]; // PID is the last column
      }).filter(pid => pid && pid !== '0');

      if (pids.length > 0) {
        console.log(`⚠️  Found ${pids.length} process(es) on port ${port}: ${pids.join(', ')}`);
        
        pids.forEach(pid => {
          try {
            console.log(`🛑 Killing process ${pid}...`);
            execSync(`taskkill /PID ${pid} /F`, { encoding: 'utf8' });
            console.log(`✅ Process ${pid} terminated`);
          } catch (error) {
            console.log(`❌ Could not kill process ${pid}: ${error.message}`);
          }
        });
      } else {
        console.log(`ℹ️  No active processes found on port ${port}`);
      }
    } else {
      console.log(`✅ Port ${port} is available`);
    }
  } catch (error) {
    console.log(`❌ Error checking port ${port}: ${error.message}`);
  }
}

// Clean up Next.js cache
console.log('🧹 Cleaning Next.js cache...');
removeDir('.next');

// Kill processes on common ports
console.log('\n🛑 Killing processes on common development ports...');
[3000, 3001, 8000, 8080].forEach(port => {
  killProcessByPort(port);
});

console.log('\n✅ Cleanup complete!');
console.log('\n📝 Next steps:');
console.log('1. Start your development server: npm run dev');
console.log('2. Make sure your API server is running on http://localhost:8000');
console.log('3. Run health check: npm run check-health');