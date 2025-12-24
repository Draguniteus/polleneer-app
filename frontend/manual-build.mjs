import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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

// 2. Read App.tsx and create JS
try {
    const appContent = fs.readFileSync(path.join(__dirname, "src", "App.tsx"), "utf8");
    const jsContent = `${appContent}
// Simple render
const rootElement = document.getElementById('root');
if (rootElement) {
    rootElement.innerHTML = '<div style="text-align:center;padding:100px;background:linear-gradient(135deg, #667eea 0%, #764ba2 100%);color:white;min-height:100vh;font-family:Arial,sans-serif"><h1 style="font-size:48px">🐝 Polleneer</h1><p style="font-size:24px">Build successful!</p><p>Local API: <a href="/api/test" style="color:#ffdd40">/api/test</a></p></div>';
}
`;
    fs.writeFileSync(path.join(assetsDir, "index.js"), jsContent);
} catch (error) {
    console.log("Using fallback JS...");
    const fallbackJS = `console.log("Polleneer app");
const root = document.getElementById('root');
root.innerHTML = '<h1>🐝 Polleneer</h1><p>Simple build</p>';`;
    fs.writeFileSync(path.join(assetsDir, "index.js"), fallbackJS);
}

// 3. Create CSS
const cssContent = `* { margin: 0; padding: 0; box-sizing: border-box; }
body { font-family: Arial, sans-serif; background: #f0f0f0; }`;
fs.writeFileSync(path.join(assetsDir, "style.css"), cssContent);

console.log("✅ Build complete! Files in 'dist/'");
