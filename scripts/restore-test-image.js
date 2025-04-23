/**
 * This script restores the test-image page from a backup
 * after the build process is complete.
 */
const fs = require('fs');
const path = require('path');

console.log('Running restore-test-image script...');

// Path to the test-image directory
const testImageDir = path.join(__dirname, '..', 'app', 'test-image');
const testImageBackupDir = path.join(__dirname, '..', 'scripts', 'test-image-backup');

// Check if the backup directory exists
if (fs.existsSync(testImageBackupDir)) {
  console.log(`Found backup directory at ${testImageBackupDir}`);
  
  // Create the test-image directory if it doesn't exist
  if (!fs.existsSync(testImageDir)) {
    fs.mkdirSync(testImageDir);
    console.log(`Created test-image directory at ${testImageDir}`);
  }
  
  // Read all files in the backup directory
  const files = fs.readdirSync(testImageBackupDir);
  
  // Copy each file from the backup directory
  files.forEach(file => {
    const srcPath = path.join(testImageBackupDir, file);
    const destPath = path.join(testImageDir, file);
    
    // Copy the file from the backup directory
    fs.copyFileSync(srcPath, destPath);
    console.log(`Copied ${srcPath} to ${destPath}`);
  });
  
  console.log('Successfully restored test-image page');
} else {
  console.log(`Backup directory not found at ${testImageBackupDir}`);
}

console.log('restore-test-image script completed');
