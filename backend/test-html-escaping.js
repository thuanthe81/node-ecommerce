const { exec } = require('child_process');
const { promisify } = require('util');
const fs = require('fs');
const path = require('path');
const os = require('os');

const execAsync = promisify(exec);

// Test the HTML escaping logic that was causing issues
async function testHtmlEscaping() {
  console.log('=== Testing HTML Escaping for Swaks ===\n');

  // Complex HTML that was causing the original issue
  const complexHtml = `
    <!DOCTYPE html>
    <html>
      <head>
        <style>
          .container { background-color: #f8f9fa; padding: 20px; }
          .header { color: #2c3e50; font-weight: bold; }
        </style>
      </head>
      <body>
        <div class="container">
          <h1 class="header">Order Confirmation</h1>
          <p>Thank you for your order!</p>
          <div style="background-color: #e9ecef; padding: 15px;">
            <p><strong>Order Details:</strong></p>
            <p>Order Number: #12345</p>
            <p>Total: $99.99</p>
          </div>
        </div>
      </body>
    </html>
  `;

  console.log('1. Original HTML length:', complexHtml.length);

  // Test the simplification logic
  const simplifiedHtml = simplifyHtmlForSwaks(complexHtml);
  console.log('2. Simplified HTML length:', simplifiedHtml.length);
  console.log('3. Simplified HTML:');
  console.log(simplifiedHtml);

  // Test the new escaping approach
  console.log('\n4. Testing file-based escaping approach...');
  const escapedHtml = escapeHtmlForSwaks(simplifiedHtml);
  console.log('5. Escaped command part:', escapedHtml);

  // Test if the command would work (dry run)
  console.log('\n6. Testing swaks command construction...');
  const testCommand = `echo "Testing swaks body: ${escapedHtml}"`;

  try {
    const result = await execAsync(testCommand);
    console.log('✅ Command executed successfully');
    console.log('Output:', result.stdout.trim());
  } catch (error) {
    console.log('❌ Command failed:', error.message);
  }
}

// Simplified version of the HTML simplification logic
function simplifyHtmlForSwaks(html) {
  let simplified = html;

  // Remove complex CSS that might cause issues
  simplified = simplified.replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '');

  // Remove script tags
  simplified = simplified.replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '');

  // Remove link tags (external stylesheets)
  simplified = simplified.replace(/<link[^>]*>/gi, '');

  // Remove complex style attributes entirely - they cause the most issues
  simplified = simplified.replace(/\s+style="[^"]*"/gi, '');

  // Remove complex class attributes
  simplified = simplified.replace(/\s+class="[^"]*"/gi, '');

  // Remove data attributes that might cause issues
  simplified = simplified.replace(/\s+data-[^=]*="[^"]*"/gi, '');

  // Remove onclick and other event handlers
  simplified = simplified.replace(/\s+on\w+="[^"]*"/gi, '');

  // Remove comments
  simplified = simplified.replace(/<!--[\s\S]*?-->/g, '');

  // Remove empty attributes
  simplified = simplified.replace(/\s+[a-zA-Z-]+=""\s*/g, ' ');

  // Clean up multiple spaces and newlines
  simplified = simplified.replace(/\s+/g, ' ');
  simplified = simplified.replace(/\n+/g, ' ');

  // Remove any remaining problematic characters that might break shell commands
  simplified = simplified.replace(/[`$\\]/g, '');

  // Remove curly braces that can cause shell issues
  simplified = simplified.replace(/[{}]/g, '');

  // Trim whitespace
  simplified = simplified.trim();

  return simplified;
}

// File-based escaping approach
function escapeHtmlForSwaks(html) {
  try {
    // Create a temporary file with the HTML content
    const tempDir = os.tmpdir();
    const tempFile = path.join(tempDir, `swaks-body-${Date.now()}-${Math.random().toString(36).substr(2, 9)}.html`);

    fs.writeFileSync(tempFile, html, 'utf8');

    // Return the file reference for swaks
    return `"$(cat '${tempFile}' && rm '${tempFile}')"`;
  } catch (error) {
    // Fallback to simple escaping if file approach fails
    console.warn(`Temp file approach failed, using fallback escaping: ${error.message}`);
    return `'${html.replace(/'/g, "'\"'\"'")}'`;
  }
}

testHtmlEscaping();