// Simple production build for Polleneer - No React complications
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🐝 Creating Polleneer SIMPLE production build...');

// Create dist folder if it doesn't exist
const distDir = path.join(__dirname, 'dist');
const assetsDir = path.join(distDir, 'assets');

if (!fs.existsSync(distDir)) {
  fs.mkdirSync(distDir, { recursive: true });
}
if (!fs.existsSync(assetsDir)) {
  fs.mkdirSync(assetsDir, { recursive: true });
}

// Create simple HTML
const htmlContent = `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>🐝 Polleneer Platform</title>
    <script src="./assets/index.js"></script>
    <link rel="stylesheet" href="./assets/style.css">
  </head>
  <body>
    <div id="root"></div>
  </body>
</html>`;

// Create simple JavaScript
const jsContent = `// Simple Polleneer frontend - No React, just vanilla JS
document.addEventListener('DOMContentLoaded', function() {
    const root = document.getElementById('root');
    
    if (!root) return;
    
    // Create the UI
    root.innerHTML = \`
        <div style="
            min-height: 100vh;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            font-family: Arial, sans-serif;
            padding: 40px;
            text-align: center;
        ">
            <h1 style="font-size: 48px; margin-bottom: 20px;">🐝 Polleneer Platform</h1>
            <h2 style="font-size: 28px; margin-bottom: 40px; opacity: 0.9;">Welcome to the Hive!</h2>
            
            <div style="
                background: rgba(255, 255, 255, 0.1);
                padding: 30px;
                border-radius: 20px;
                max-width: 800px;
                margin: 0 auto 30px;
                backdrop-filter: blur(10px);
            ">
                <h3 style="font-size: 24px; margin-bottom: 20px;">API Connection Status:</h3>
                <div id="status" style="
                    padding: 15px;
                    border-radius: 10px;
                    margin: 20px 0;
                    font-weight: bold;
                    font-size: 18px;
                    background: orange;
                ">
                    🔄 Testing connection...
                </div>
                <p id="message" style="font-size: 16px; margin: 20px 0;">Loading...</p>
                <button onclick="testApiConnection()" style="
                    background: #ffdd40;
                    color: #333;
                    border: none;
                    padding: 12px 24px;
                    border-radius: 8px;
                    font-size: 16px;
                    font-weight: bold;
                    cursor: pointer;
                    margin-top: 10px;
                ">
                    Retry Connection
                </button>
            </div>
            
            <div style="
                background: rgba(255, 255, 255, 0.1);
                padding: 20px;
                border-radius: 15px;
                max-width: 800px;
                margin: 0 auto 30px;
                text-align: left;
                backdrop-filter: blur(10px);
            ">
                <h3 style="font-size: 24px; margin-bottom: 15px;">🚀 Next Steps:</h3>
                <ul style="list-style: none; padding: 0; font-size: 16px;">
                    <li style="margin: 10px 0; padding-left: 20px; position: relative;">
                        <span style="position: absolute; left: 0;">✅</span> Fixed API connection
                    </li>
                    <li style="margin: 10px 0; padding-left: 20px; position: relative;">
                        <span style="position: absolute; left: 0;">🔜</span> User Authentication
                    </li>
                    <li style="margin: 10px 0; padding-left: 20px; position: relative;">
                        <span style="position: absolute; left: 0;">🔜</span> 91 Bee Roles
                    </li>
                    <li style="margin: 10px 0; padding-left: 20px; position: relative;">
                        <span style="position: absolute; left: 0;">🔜</span> Honey Points System
                    </li>
                </ul>
            </div>
            
            <div style="margin-top: 30px;">
                <a href="/api/test" target="_blank" style="
                    color: #ffdd40;
                    margin: 0 10px;
                    text-decoration: none;
                    font-weight: bold;
                ">Test API</a>
                <a href="https://github.com/Draguniteus/polleneer-app" target="_blank" style="
                    color: #ffdd40;
                    margin: 0 10px;
                    text-decoration: none;
                    font-weight: bold;
                ">GitHub</a>
                <a href="https://polleneer-dbkzq.ondigitalocean.app" target="_blank" style="
                    color: #ffdd40;
                    margin: 0 10px;
                    text-decoration: none;
                    font-weight: bold;
                ">Live Demo</a>
            </div>
        </div>
    \`;
    
    // Test API connection
    window.testApiConnection = async function() {
        const statusEl = document.getElementById('status');
        const messageEl = document.getElementById('message');
        
        try {
            statusEl.style.background = 'orange';
            statusEl.textContent = '🔄 Testing connection...';
            messageEl.textContent = 'Loading...';
            
            const response = await fetch('/api/test');
            if (!response.ok) throw new Error(\`HTTP error! Status: \${response.status}\`);
            
            const data = await response.json();
            
            statusEl.style.background = 'green';
            statusEl.textContent = '✅ Connected to API!';
            messageEl.textContent = data.message || 'API Connected!';
            
            console.log('API Success:', data);
        } catch (error) {
            statusEl.style.background = 'red';
            statusEl.textContent = '❌ Connection failed';
            messageEl.textContent = \`API Connection Failed: \${error.message}\`;
            console.error('API Error:', error);
        }
    };
    
    // Test connection on load
    window.testApiConnection();
});`;

// Create simple CSS
const cssContent = `* { margin: 0; padding: 0; box-sizing: border-box; }
body { font-family: Arial, sans-serif; background: #f0f0f0; }`;

// Write files
fs.writeFileSync(path.join(distDir, 'index.html'), htmlContent, 'utf8');
fs.writeFileSync(path.join(assetsDir, 'index.js'), jsContent, 'utf8');
fs.writeFileSync(path.join(assetsDir, 'style.css'), cssContent, 'utf8');

console.log('✅ Simple build complete! Files in "dist/" folder');
console.log('📁 dist/index.html');
console.log('📁 dist/assets/index.js');
console.log('📁 dist/assets/style.css');
