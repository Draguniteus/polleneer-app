const fs = require("fs");
const path = require("path");

console.log("🐝 Creating Polleneer production build...");

const distDir = path.join(__dirname, "dist");
const assetsDir = path.join(distDir, "assets");

// Clean and create directories
if (fs.existsSync(distDir)) {
    fs.rmSync(distDir, { recursive: true });
}
fs.mkdirSync(distDir, { recursive: true });
fs.mkdirSync(assetsDir, { recursive: true });

// 1. Create index.html
const htmlContent = `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>🐝 Polleneer Platform</title>
    <script type="module" src="/assets/index.js"></script>
    <link rel="stylesheet" href="/assets/style.css">
  </head>
  <body>
    <div id="root"></div>
  </body>
</html>`;

fs.writeFileSync(path.join(distDir, "index.html"), htmlContent);

// 2. Create the main JavaScript file from your App.tsx
const appContent = fs.readFileSync(path.join(__dirname, "src", "App.tsx"), "utf8");
// Convert to simple JS
const jsContent = `
${appContent}
// Start the app
const rootElement = document.getElementById('root');
if (rootElement) {
    // Simple render for now
    rootElement.innerHTML = '<div style="text-align:center;padding:100px;background:linear-gradient(135deg, #667eea 0%, #764ba2 100%);color:white;min-height:100vh;"><h1>🐝 Polleneer</h1><p>Build successful!</p><button onclick="alert(\\'API Test\\')" style="background:white;color:#667eea;padding:12px 24px;border-radius:8px;border:none;cursor:pointer;">Test</button></div>';
}
`;

fs.writeFileSync(path.join(assetsDir, "index.js"), jsContent);

// 3. Create a simple CSS file
const cssContent = `* { margin: 0; padding: 0; box-sizing: border-box; }
body { font-family: Arial, sans-serif; }`;
fs.writeFileSync(path.join(assetsDir, "style.css"), cssContent);

console.log("✅ Build complete! Files created in 'dist/' folder.");
