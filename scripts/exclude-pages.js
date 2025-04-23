/**
 * This script removes problematic pages from the build output
 * to prevent errors during static site generation
 */
const fs = require('fs');
const path = require('path');

console.log('Running exclude-pages script...');

// Pages to exclude from static generation
const pagesToExclude = [
  'finance/[id]/edit',
  'finance/create',
  'finance/1/edit',
  'finance/2/edit',
  'finance/3/edit',
];

// Function to safely delete a file if it exists
function safeDeleteFile(filePath) {
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      console.log(`Deleted: ${filePath}`);
    }
  } catch (error) {
    console.error(`Error deleting ${filePath}:`, error);
  }
}

// Function to safely delete a directory if it exists
function safeDeleteDir(dirPath) {
  try {
    if (fs.existsSync(dirPath)) {
      fs.rmdirSync(dirPath, { recursive: true });
      console.log(`Deleted directory: ${dirPath}`);
    }
  } catch (error) {
    console.error(`Error deleting directory ${dirPath}:`, error);
  }
}

// Remove problematic pages from the build output
pagesToExclude.forEach(pagePath => {
  // Check server directory
  const serverPagePath = path.join(__dirname, '..', '.next', 'server', 'app', pagePath, 'page.js');
  safeDeleteFile(serverPagePath);
  
  // Check static directory
  const staticPageDir = path.join(__dirname, '..', '.next', 'static', 'chunks', 'app', pagePath);
  safeDeleteDir(staticPageDir);
});

console.log('Exclude-pages script completed');
