const fs = require('fs');
let c = fs.readFileSync('frontend/src/index.css', 'utf8');

// Replace body background gradient and colors specifically
c = c.replace(/body\s*\{[\s\S]*?\}/, `body {
  margin: 0;
  min-height: 100vh;
  color: var(--nc-copy);
  background: #f4f7fb;
  background-color: var(--nc-bg);
  background-attachment: fixed;
  overflow-x: hidden;
  -webkit-font-smoothing: antialiased;
}`);

// Hardcoded dark gradients and colors
c = c.replace(/#0f1716/g, "#f4f7fb");
c = c.replace(/#0d1514/g, "#f4f7fb");
c = c.replace(/#15201f/g, "#ffffff");
c = c.replace(/#172220/g, "#ffffff");
c = c.replace(/#edf2ee/g, "var(--nc-copy)");
c = c.replace(/#b7c4bc/g, "var(--nc-copy-soft)");
c = c.replace(/#102a43/g, "var(--nc-copy)");

// Dark transparent backgrounds
c = c.replace(/rgba\(12,\s*20,\s*19,\s*[0-9.]+\)/g, "var(--nc-panel)");
c = c.replace(/rgba\(14,\s*22,\s*20,\s*[0-9.]+\)/g, "var(--nc-panel)");
c = c.replace(/rgba\(15,\s*23,\s*22,\s*[0-9.]+\)/g, "var(--nc-panel)");
c = c.replace(/rgba\(23,\s*34,\s*32,\s*[0-9.]+\)/g, "var(--nc-panel)");
c = c.replace(/rgba\(24,\s*35,\s*33,\s*[0-9.]+\)/g, "var(--nc-panel)");
c = c.replace(/rgba\(25,\s*36,\s*34,\s*[0-9.]+\)/g, "var(--nc-panel)");
c = c.replace(/rgba\(28,\s*40,\s*38,\s*[0-9.]+\)/g, "var(--nc-panel-strong)");
c = c.replace(/rgba\(18,\s*28,\s*26,\s*[0-9.]+\)/g, "var(--nc-panel-strong)");

// Borders
c = c.replace(/rgba\(151,\s*175,\s*166,\s*[0-9.]+\)/g, "var(--nc-panel-border)");

// Special green/blue glowing elements from the old dark theme should become our new green
c = c.replace(/rgba\(143,\s*182,\s*192,\s*[0-9.]+\)/g, "rgba(16, 185, 129, 0.1)");
c = c.replace(/rgba\(159,\s*187,\s*164,\s*[0-9.]+\)/g, "rgba(16, 185, 129, 0.1)");
c = c.replace(/rgba\(213,\s*196,\s*157,\s*[0-9.]+\)/g, "rgba(245, 158, 11, 0.1)");
c = c.replace(/#a6c2ab/g, "var(--nc-glow)");
c = c.replace(/#8fb6c0/g, "var(--nc-glow)");
c = c.replace(/#9fbba4/g, "var(--nc-glow-2)");

fs.writeFileSync('frontend/src/index.css', c);
