/**
 * This script removes problematic pages from the app directory
 * to prevent errors during the build process.
 */
const fs = require('fs');
const path = require('path');

console.log('Running remove-problematic-pages script...');

// Function to safely remove a directory and its contents
function removeDirectory(dirPath) {
  if (fs.existsSync(dirPath)) {
    console.log(`Removing directory: ${dirPath}`);

    // Read all files in the directory
    const files = fs.readdirSync(dirPath);

    // Remove each file
    for (const file of files) {
      const filePath = path.join(dirPath, file);

      // Check if it's a directory or a file
      if (fs.statSync(filePath).isDirectory()) {
        // Recursively remove subdirectories
        removeDirectory(filePath);
      } else {
        // Remove file
        fs.unlinkSync(filePath);
        console.log(`Removed file: ${filePath}`);
      }
    }

    // Remove the empty directory
    fs.rmdirSync(dirPath);
    console.log(`Removed empty directory: ${dirPath}`);
    return true;
  }
  return false;
}

// List of problematic directories to remove
const problematicDirs = [
  path.join(__dirname, '..', 'app', 'test-image'),
  path.join(__dirname, '..', 'app', 'test-image-backup')
];

// Remove each problematic directory
let removedCount = 0;
for (const dir of problematicDirs) {
  if (removeDirectory(dir)) {
    removedCount++;
  }
}

console.log(`Removed ${removedCount} problematic directories`);
console.log('remove-problematic-pages script completed');
