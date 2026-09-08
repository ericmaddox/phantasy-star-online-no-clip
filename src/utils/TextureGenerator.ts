import * as THREE from 'three';

/**
 * Procedural texture generator tailored for Phantasy Star Online environments
 */
export class TextureGenerator {
  private static canvasCache: Map<string, THREE.CanvasTexture> = new Map();

  /**
   * Pioneer 2 Sci-Fi Metallic Grated Floor / Wall Panels
   */
  public static createPioneerMetalTexture(colorA = '#1c2838', colorB = '#0c1624', gridColor = '#00f0ff'): THREE.CanvasTexture {
    const key = `pioneer_metal_${colorA}_${colorB}_${gridColor}`;
    if (this.canvasCache.has(key)) return this.canvasCache.get(key)!;

    const size = 512;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d')!;

    // Base background gradient
    const bgGrad = ctx.createLinearGradient(0, 0, size, size);
    bgGrad.addColorStop(0, colorA);
    bgGrad.addColorStop(1, colorB);
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, size, size);

    // Grid panels
    const panelSize = 64;
    ctx.strokeStyle = 'rgba(0, 0, 0, 0.6)';
    ctx.lineWidth = 3;

    for (let x = 0; x < size; x += panelSize) {
      for (let y = 0; y < size; y += panelSize) {
        ctx.strokeRect(x, y, panelSize, panelSize);
        // Inner bevel
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
        ctx.lineWidth = 1;
        ctx.strokeRect(x + 2, y + 2, panelSize - 4, panelSize - 4);

        // Corner rivets
        ctx.fillStyle = 'rgba(200, 230, 255, 0.4)';
        ctx.fillRect(x + 5, y + 5, 2, 2);
        ctx.fillRect(x + panelSize - 7, y + 5, 2, 2);
        ctx.fillRect(x + 5, y + panelSize - 7, 2, 2);
        ctx.fillRect(x + panelSize - 7, y + panelSize - 7, 2, 2);
      }
    }

    // Neon circuit accent lines
    ctx.strokeStyle = gridColor;
    ctx.lineWidth = 2;
    ctx.shadowColor = gridColor;
    ctx.shadowBlur = 6;
    ctx.beginPath();
    ctx.moveTo(0, size / 2);
    ctx.lineTo(size, size / 2);
    ctx.moveTo(size / 2, 0);
    ctx.lineTo(size / 2, size);
    ctx.stroke();
    ctx.shadowBlur = 0;

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    this.canvasCache.set(key, texture);
    return texture;
  }

  /**
   * Forest Grass, Moss, and Terrain Texture
   */
  public static createForestGrassTexture(): THREE.CanvasTexture {
    const key = 'forest_grass';
    if (this.canvasCache.has(key)) return this.canvasCache.get(key)!;

    const size = 512;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d')!;

    // Forest lush green base
    ctx.fillStyle = '#1e381f';
    ctx.fillRect(0, 0, size, size);

    // Procedural noise patches
    for (let i = 0; i < 20000; i++) {
      const x = Math.random() * size;
      const y = Math.random() * size;
      const radius = Math.random() * 3 + 1;
      const shade = Math.random();
      if (shade > 0.6) {
        ctx.fillStyle = 'rgba(64, 120, 50, 0.4)';
      } else if (shade > 0.3) {
        ctx.fillStyle = 'rgba(25, 60, 28, 0.5)';
      } else {
        ctx.fillStyle = 'rgba(90, 150, 60, 0.25)';
      }
      ctx.beginPath();
      ctx.arc(x, y, radius, 0, Math.PI * 2);
      ctx.fill();
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    this.canvasCache.set(key, texture);
    return texture;
  }

  /**
   * Ancient Ruins Runic Stone Texture
   */
  public static createRuinsRunicTexture(): THREE.CanvasTexture {
    const key = 'ruins_runic';
    if (this.canvasCache.has(key)) return this.canvasCache.get(key)!;

    const size = 512;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d')!;

    // Deep alien slate base
    ctx.fillStyle = '#0f1a26';
    ctx.fillRect(0, 0, size, size);

    // Stone grain
    for (let i = 0; i < 15000; i++) {
      const x = Math.random() * size;
      const y = Math.random() * size;
      ctx.fillStyle = Math.random() > 0.5 ? 'rgba(35, 55, 75, 0.4)' : 'rgba(5, 10, 18, 0.4)';
      ctx.fillRect(x, y, Math.random() * 4 + 1, Math.random() * 4 + 1);
    }

    // Glowing cyan/gold ancient runes & geometric circuits
    ctx.strokeStyle = 'rgba(0, 240, 255, 0.6)';
    ctx.lineWidth = 2;
    ctx.shadowColor = '#00f0ff';
    ctx.shadowBlur = 8;

    // Draw intricate geometric ring / runes
    ctx.beginPath();
    ctx.arc(256, 256, 160, 0, Math.PI * 2);
    ctx.arc(256, 256, 120, 0, Math.PI * 2);
    ctx.stroke();

    ctx.beginPath();
    for (let a = 0; a < Math.PI * 2; a += Math.PI / 6) {
      const x1 = 256 + Math.cos(a) * 120;
      const y1 = 256 + Math.sin(a) * 120;
      const x2 = 256 + Math.cos(a) * 160;
      const y2 = 256 + Math.sin(a) * 160;
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
    }
    ctx.stroke();

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    this.canvasCache.set(key, texture);
    return texture;
  }

  /**
   * Caves Magma & Molten Rock Texture
   */
  public static createCavesMagmaTexture(): THREE.CanvasTexture {
    const key = 'caves_magma';
    if (this.canvasCache.has(key)) return this.canvasCache.get(key)!;

    const size = 512;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d')!;

    // Magma fiery gradient
    const grad = ctx.createLinearGradient(0, 0, size, size);
    grad.addColorStop(0, '#ff3300');
    grad.addColorStop(0.4, '#ff7700');
    grad.addColorStop(0.8, '#ffaa00');
    grad.addColorStop(1, '#ff1100');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, size, size);

    // Dark volcanic crust patches
    for (let i = 0; i < 40; i++) {
      ctx.fillStyle = 'rgba(25, 10, 5, 0.85)';
      ctx.beginPath();
      const cx = Math.random() * size;
      const cy = Math.random() * size;
      const r = Math.random() * 50 + 20;
      ctx.arc(cx, cy, r, 0, Math.PI * 2);
      ctx.fill();
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    this.canvasCache.set(key, texture);
    return texture;
  }

  /**
   * Mines Industrial Hazard Warning & Grate Texture
   */
  public static createMinesHazardTexture(): THREE.CanvasTexture {
    const key = 'mines_hazard';
    if (this.canvasCache.has(key)) return this.canvasCache.get(key)!;

    const size = 256;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d')!;

    ctx.fillStyle = '#22262c';
    ctx.fillRect(0, 0, size, size);

    // Hazard yellow & black stripes
    ctx.fillStyle = '#fb8500';
    for (let i = -size; i < size * 2; i += 40) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i + 20, 0);
      ctx.lineTo(i + 20 - size, size);
      ctx.lineTo(i - size, size);
      ctx.closePath();
      ctx.fill();
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    this.canvasCache.set(key, texture);
    return texture;
  }

  /**
   * Flowing Water Normal & Base Map
   */
  public static createWaterTexture(): THREE.CanvasTexture {
    const key = 'water_flow';
    if (this.canvasCache.has(key)) return this.canvasCache.get(key)!;

    const size = 256;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d')!;

    ctx.fillStyle = 'rgba(0, 180, 220, 0.6)';
    ctx.fillRect(0, 0, size, size);

    // Wave ripples
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.35)';
    ctx.lineWidth = 2;
    for (let y = 0; y < size; y += 16) {
      ctx.beginPath();
      for (let x = 0; x < size; x += 10) {
        const ny = y + Math.sin(x * 0.05) * 6;
        if (x === 0) ctx.moveTo(x, ny);
        else ctx.lineTo(x, ny);
      }
      ctx.stroke();
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    this.canvasCache.set(key, texture);
    return texture;
  }

  /**
   * PSO Warp Portal Swirl Texture
   */
  public static createWarpPortalTexture(): THREE.CanvasTexture {
    const key = 'warp_portal';
    if (this.canvasCache.has(key)) return this.canvasCache.get(key)!;

    const size = 512;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d')!;

    const center = size / 2;
    // Transparent center to glowing outer ring
    const radGrad = ctx.createRadialGradient(center, center, 20, center, center, center);
    radGrad.addColorStop(0, 'rgba(0, 255, 255, 0.9)');
    radGrad.addColorStop(0.3, 'rgba(0, 160, 255, 0.7)');
    radGrad.addColorStop(0.7, 'rgba(0, 60, 200, 0.4)');
    radGrad.addColorStop(1, 'rgba(0, 20, 80, 0)');
    ctx.fillStyle = radGrad;
    ctx.fillRect(0, 0, size, size);

    // Swirling energy arcs
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
    ctx.lineWidth = 3;
    ctx.shadowColor = '#00f0ff';
    ctx.shadowBlur = 12;

    for (let i = 0; i < 16; i++) {
      const startAngle = (i * Math.PI) / 8;
      ctx.beginPath();
      for (let r = 30; r < center - 20; r += 5) {
        const angle = startAngle + r * 0.04;
        const x = center + Math.cos(angle) * r;
        const y = center + Math.sin(angle) * r;
        if (r === 30) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      ctx.stroke();
    }

    const texture = new THREE.CanvasTexture(canvas);
    this.canvasCache.set(key, texture);
    return texture;
  }
}
