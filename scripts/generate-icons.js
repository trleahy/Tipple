/**
 * Simple script to generate PWA icons using Canvas API
 * This creates basic placeholder icons with the Tipple branding
 */

const fs = require('fs');
const path = require('path');

// Icon sizes needed for PWA
const iconSizes = [72, 96, 128, 144, 152, 192, 384, 512];

// Create a simple SVG icon template
const createSVGIcon = (size) => `
<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#3b82f6;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#1d4ed8;stop-opacity:1" />
    </linearGradient>
  </defs>
  <rect width="${size}" height="${size}" rx="${size * 0.2}" fill="url(#bg)"/>
  <text x="50%" y="50%" font-family="Arial, sans-serif" font-size="${size * 0.4}" fill="white" text-anchor="middle" dominant-baseline="central">🍸</text>
  <text x="50%" y="${size * 0.8}" font-family="Arial, sans-serif" font-size="${size * 0.12}" fill="white" text-anchor="middle" font-weight="bold">TIPPLE</text>
</svg>
`;

// Create shortcut icons
const createShortcutIcon = (emoji, size = 96) => `
<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#6366f1;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#4338ca;stop-opacity:1" />
    </linearGradient>
  </defs>
  <rect width="${size}" height="${size}" rx="${size * 0.2}" fill="url(#bg)"/>
  <text x="50%" y="50%" font-family="Arial, sans-serif" font-size="${size * 0.5}" fill="white" text-anchor="middle" dominant-baseline="central">${emoji}</text>
</svg>
`;

// Ensure icons directory exists
const iconsDir = path.join(__dirname, '..', 'public', 'icons');
if (!fs.existsSync(iconsDir)) {
  fs.mkdirSync(iconsDir, { recursive: true });
}

// Generate main app icons
console.log('Generating PWA icons...');
iconSizes.forEach(size => {
  const svg = createSVGIcon(size);
  const filename = `icon-${size}x${size}.png`;
  const filepath = path.join(iconsDir, filename);
  
  // For now, save as SVG (in a real app, you'd convert to PNG)
  const svgFilename = `icon-${size}x${size}.svg`;
  const svgFilepath = path.join(iconsDir, svgFilename);
  fs.writeFileSync(svgFilepath, svg);
  
  console.log(`Created ${svgFilename}`);
});

// Generate shortcut icons
const shortcuts = [
  { name: 'search', emoji: '🔍' },
  { name: 'heart', emoji: '❤️' },
  { name: 'cart', emoji: '🛒' },
  { name: 'cocktail', emoji: '🍹' }
];

shortcuts.forEach(shortcut => {
  const svg = createShortcutIcon(shortcut.emoji);
  const filename = `${shortcut.name}-96x96.svg`;
  const filepath = path.join(iconsDir, filename);
  fs.writeFileSync(filepath, svg);
  console.log(`Created ${filename}`);
});

// Create a simple favicon
const faviconSVG = `
<svg width="32" height="32" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
  <rect width="32" height="32" rx="6" fill="#3b82f6"/>
  <text x="16" y="16" font-family="Arial, sans-serif" font-size="16" fill="white" text-anchor="middle" dominant-baseline="central">🍸</text>
</svg>
`;

fs.writeFileSync(path.join(__dirname, '..', 'public', 'favicon.svg'), faviconSVG);

console.log('✅ PWA icons generated successfully!');
console.log('📝 Note: SVG files created as placeholders. For production, convert to PNG using a tool like sharp or imagemagick.');
