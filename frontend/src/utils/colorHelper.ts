function hexToRgb(hex: string) {
  let r = 0, g = 0, b = 0;
  // Handle 3-digit hex
  if (hex.length === 4) {
    r = parseInt("0x" + hex[1] + hex[1]);
    g = parseInt("0x" + hex[2] + hex[2]);
    b = parseInt("0x" + hex[3] + hex[3]);
  } else if (hex.length === 7) {
    r = parseInt("0x" + hex[1] + hex[2]);
    g = parseInt("0x" + hex[3] + hex[4]);
    b = parseInt("0x" + hex[5] + hex[6]);
  }
  return `${r}, ${g}, ${b}`;
}

function adjustBrightness(hex: string, percent: number) {
  // Parse hex to rgb
  let r = parseInt(hex.slice(1, 3), 16);
  let g = parseInt(hex.slice(3, 5), 16);
  let b = parseInt(hex.slice(5, 7), 16);

  r = Math.min(255, Math.max(0, r + Math.round(255 * (percent / 100))));
  g = Math.min(255, Math.max(0, g + Math.round(255 * (percent / 100))));
  b = Math.min(255, Math.max(0, b + Math.round(255 * (percent / 100))));

  return `#${(r).toString(16).padStart(2, '0')}${(g).toString(16).padStart(2, '0')}${(b).toString(16).padStart(2, '0')}`;
}

export function applyThemeColor(hexColor: string) {
  const root = document.documentElement;
  
  // Calculate variations
  const light = adjustBrightness(hexColor, 15);
  const dark = adjustBrightness(hexColor, -15);
  const rgb = hexToRgb(hexColor);

  // Set CSS Variables globally
  root.style.setProperty('--accent-primary', hexColor);
  root.style.setProperty('--accent-primary-light', light);
  root.style.setProperty('--accent-primary-dark', dark);
  
  // Set glow with opacity using rgb
  root.style.setProperty('--accent-glow', `rgba(${rgb}, 0.15)`);
  
  // Update gradients
  root.style.setProperty('--gradient-primary', `linear-gradient(135deg, ${hexColor}, ${dark})`);
  
  // Save to local storage
  localStorage.setItem('ascension_custom_color', hexColor);
}
