import { createIcons, icons } from 'lucide';
import { Engine } from './core/Engine';
import { StateManager, StatePayload } from './core/StateManager';
import { WORLD_REGISTRY, ZoneDefinition, POI } from './worlds/WorldRegistry';
import { AudioPlayer } from './ui/AudioPlayer';
import { NinjaModelParser } from './formats/NinjaModelParser';

class PsoNoclipApp {
  private engine: Engine;
  private audioPlayer = new AudioPlayer();
  private currentZone: ZoneDefinition = WORLD_REGISTRY[0];
  private selectedEpisode = 'all';
  private searchQuery = '';

  constructor() {
    const container = document.getElementById('canvas-container')!;
    this.engine = new Engine(container);

    this.initLucide();
    this.initHUDTelemetry();
    this.initModalsAndDrawers();
    this.initZoneGrid();
    this.initLayersPanel();
    this.initCameraSettings();
    this.initShareAndScreenshot();
    this.initAudio();
    this.initFileDrop();

    this.loadInitialRoute();
    this.engine.start();
  }

  private initLucide(): void {
    createIcons({ icons });
  }

  private initHUDTelemetry(): void {
    const posEl = document.getElementById('hud-pos')!;
    const rotEl = document.getElementById('hud-rot')!;
    const camModeEl = document.getElementById('hud-cam-mode')!;
    const speedEl = document.getElementById('hud-speed')!;

    this.engine.cameraController.setTelemetryCallback((pos, yaw, pitch, mode, speed) => {
      posEl.textContent = `X: ${pos.x.toFixed(1)} | Y: ${pos.y.toFixed(1)} | Z: ${pos.z.toFixed(1)}`;
      
      const yawDeg = ((yaw * 180) / Math.PI) % 360;
      const pitchDeg = (pitch * 180) / Math.PI;
      rotEl.textContent = `YAW: ${yawDeg.toFixed(1)}° | PITCH: ${pitchDeg.toFixed(1)}°`;
      
      camModeEl.textContent = mode.toUpperCase() === 'FLY' ? 'FLY (NOCLIP)' : 'ORBIT';
      speedEl.textContent = `SPEED: ${speed.toFixed(1)}x`;

      // Periodically update URL hash (throttled)
      if (Math.random() < 0.05) {
        StateManager.updateUrlHash({
          zoneId: this.currentZone.id,
          camPos: [pos.x, pos.y, pos.z],
          camRot: [yaw, pitch],
          speed: speed
        });
      }
    });
  }

  private loadInitialRoute(): void {
    const parsed = StateManager.parseUrlHash();
    const zoneId = parsed.zoneId || 'pioneer2-city';
    this.switchZone(zoneId, parsed.camPos, parsed.camRot);
    if (parsed.speed) {
      this.engine.cameraController.speedMultiplier = parsed.speed;
      const speedSlider = document.getElementById('cam-speed-slider') as HTMLInputElement;
      const speedVal = document.getElementById('cam-speed-val')!;
      if (speedSlider) speedSlider.value = parsed.speed.toString();
      if (speedVal) speedVal.textContent = `${parsed.speed.toFixed(1)}x`;
    }
  }

  public switchZone(zoneId: string, customPos?: [number, number, number], customRot?: [number, number]): void {
    const def = this.engine.worldLoader.loadZone(zoneId);
    this.currentZone = def;

    // Update Header Text
    const epTag = document.getElementById('header-episode-tag')!;
    const zoneName = document.getElementById('header-zone-name')!;

    const epLabels: Record<string, string> = {
      ep1: 'EPISODE I',
      ep2: 'EPISODE II',
      ep4: 'EPISODE IV',
      lobby: 'LOBBY / SHIP'
    };

    epTag.textContent = epLabels[def.episode] || 'EPISODE I';
    zoneName.textContent = def.name;

    // Set Camera
    const pos = customPos || def.defaultPos;
    const rot = customRot || def.defaultRot;
    this.engine.cameraController.teleportTo(pos, rot, false);

    this.renderPoiChips(def.pois);
    this.renderPoiDrawerList(def.pois);
    this.updateActiveZoneCard(def.id);
    this.showToast(`Entered: ${def.name}`);
  }

  private renderPoiChips(pois: POI[]): void {
    const container = document.getElementById('poi-quick-bar')!;
    container.innerHTML = '';

    pois.forEach((poi, index) => {
      const chip = document.createElement('button');
      chip.className = `poi-chip ${index === 0 ? 'active' : ''}`;
      chip.innerHTML = `<i data-lucide="navigation-2"></i><span>${poi.name}</span>`;
      chip.onclick = () => {
        document.querySelectorAll('.poi-chip').forEach(c => c.classList.remove('active'));
        chip.classList.add('active');
        this.engine.cameraController.teleportTo(poi.position, poi.rotation, true);
        this.showToast(`Viewpoint: ${poi.name}`);
      };
      container.appendChild(chip);
    });

    createIcons({ icons });
  }

  private renderPoiDrawerList(pois: POI[]): void {
    const container = document.getElementById('poi-drawer-list')!;
    container.innerHTML = '';

    pois.forEach(poi => {
      const btn = document.createElement('button');
      btn.className = 'pso-btn pso-btn-subtle w-full';
      btn.style.justifyContent = 'flex-start';
      btn.innerHTML = `<i data-lucide="map-pin" class="icon-xs"></i><span>${poi.name}</span>`;
      btn.onclick = () => {
        this.engine.cameraController.teleportTo(poi.position, poi.rotation, true);
        this.showToast(`Teleported to ${poi.name}`);
      };
      container.appendChild(btn);
    });

    createIcons({ icons });
  }

  private initZoneGrid(): void {
    const grid = document.getElementById('zone-grid-container')!;
    grid.innerHTML = '';

    const filtered = WORLD_REGISTRY.filter(z => {
      const matchesEp = this.selectedEpisode === 'all' || z.episode === this.selectedEpisode;
      const matchesSearch = z.name.toLowerCase().includes(this.searchQuery) ||
                            z.subArea.toLowerCase().includes(this.searchQuery) ||
                            z.description.toLowerCase().includes(this.searchQuery);
      return matchesEp && matchesSearch;
    });

    filtered.forEach(z => {
      const card = document.createElement('div');
      card.className = `zone-card ${z.id === this.currentZone.id ? 'selected' : ''}`;
      card.dataset.zoneId = z.id;

      card.innerHTML = `
        <div class="zone-thumb" style="background: linear-gradient(135deg, #${z.fogColor.toString(16).padStart(6, '0')}, #061224);">
          <div class="zone-thumb-overlay"></div>
          <span class="zone-badge">${z.episode.toUpperCase()}</span>
        </div>
        <div class="zone-card-info">
          <div class="zone-card-name">${z.name}</div>
          <div class="zone-card-sub">${z.subArea}</div>
          <div class="zone-card-stats">
            <span>POIs: ${z.pois.length}</span>
            <span>•</span>
            <span>${z.description.slice(0, 45)}...</span>
          </div>
        </div>
      `;

      card.onclick = () => {
        this.switchZone(z.id);
        this.closeModal('zone-modal');
      };

      grid.appendChild(card);
    });
  }

  private updateActiveZoneCard(zoneId: string): void {
    document.querySelectorAll('.zone-card').forEach(c => {
      const el = c as HTMLElement;
      if (el.dataset.zoneId === zoneId) {
        el.classList.add('selected');
      } else {
        el.classList.remove('selected');
      }
    });
  }

  private initModalsAndDrawers(): void {
    // Zone Select Modal
    const zoneBtn = document.getElementById('zone-select-btn')!;
    zoneBtn.onclick = () => this.openModal('zone-modal');
    document.getElementById('zone-modal-close')!.onclick = () => this.closeModal('zone-modal');

    // Episode Tabs
    const tabs = document.querySelectorAll('.ep-tab');
    tabs.forEach(tab => {
      tab.addEventListener('click', (e) => {
        tabs.forEach(t => t.classList.remove('active'));
        const target = e.currentTarget as HTMLElement;
        target.classList.add('active');
        this.selectedEpisode = target.dataset.episode || 'all';
        this.initZoneGrid();
      });
    });

    // Search Input
    const searchInput = document.getElementById('zone-search-input') as HTMLInputElement;
    searchInput.oninput = () => {
      this.searchQuery = searchInput.value.toLowerCase().trim();
      this.initZoneGrid();
    };

    // Drawers
    const layersBtn = document.getElementById('layers-panel-btn')!;
    const layersDrawer = document.getElementById('layers-panel')!;
    layersBtn.onclick = () => {
      layersDrawer.classList.toggle('hidden');
      layersBtn.classList.toggle('active');
    };
    document.getElementById('layers-close-btn')!.onclick = () => {
      layersDrawer.classList.add('hidden');
      layersBtn.classList.remove('active');
    };

    const camBtn = document.getElementById('camera-panel-btn')!;
    const camDrawer = document.getElementById('camera-panel')!;
    camBtn.onclick = () => {
      camDrawer.classList.toggle('hidden');
      camBtn.classList.toggle('active');
    };
    document.getElementById('camera-close-btn')!.onclick = () => {
      camDrawer.classList.add('hidden');
      camBtn.classList.remove('active');
    };
  }

  private initLayersPanel(): void {
    const bindToggle = (id: string, layerName: string) => {
      const el = document.getElementById(id) as HTMLInputElement;
      if (!el) return;
      el.onchange = () => {
        this.engine.worldLoader.setLayerVisibility(layerName, el.checked);
        this.showToast(`Layer ${layerName}: ${el.checked ? 'ON' : 'OFF'}`);
      };
    };

    bindToggle('layer-terrain', 'terrain');
    bindToggle('layer-props', 'props');
    bindToggle('layer-water', 'water');
    bindToggle('layer-skybox', 'skybox');
    bindToggle('layer-portals', 'portals');
    bindToggle('layer-collision', 'collision');
    bindToggle('layer-spawns', 'spawns');
    bindToggle('layer-wireframe', 'wireframe');
    bindToggle('layer-fog', 'fog');
    bindToggle('layer-particles', 'particles');

    const lightSlider = document.getElementById('light-slider') as HTMLInputElement;
    const lightVal = document.getElementById('light-val')!;
    lightSlider.oninput = () => {
      const val = parseFloat(lightSlider.value);
      lightVal.textContent = `${val.toFixed(1)}x`;
      this.engine.worldLoader.setLightIntensity(val);
    };
  }

  private initCameraSettings(): void {
    const flyBtn = document.getElementById('mode-fly-btn')!;
    const orbitBtn = document.getElementById('mode-orbit-btn')!;

    flyBtn.onclick = () => {
      flyBtn.classList.add('active');
      orbitBtn.classList.remove('active');
      this.engine.cameraController.setMode('fly');
      this.showToast('Camera: Fly / Noclip mode');
    };

    orbitBtn.onclick = () => {
      orbitBtn.classList.add('active');
      flyBtn.classList.remove('active');
      this.engine.cameraController.setMode('orbit');
      this.showToast('Camera: Orbit inspection mode');
    };

    const speedSlider = document.getElementById('cam-speed-slider') as HTMLInputElement;
    const speedVal = document.getElementById('cam-speed-val')!;
    speedSlider.oninput = () => {
      const val = parseFloat(speedSlider.value);
      speedVal.textContent = `${val.toFixed(1)}x`;
      this.engine.cameraController.speedMultiplier = val;
    };

    const fovSlider = document.getElementById('cam-fov-slider') as HTMLInputElement;
    const fovVal = document.getElementById('cam-fov-val')!;
    fovSlider.oninput = () => {
      const val = parseInt(fovSlider.value, 10);
      fovVal.textContent = `${val}°`;
      this.engine.camera.fov = val;
      this.engine.camera.updateProjectionMatrix();
    };

    document.getElementById('reset-cam-btn')!.onclick = () => {
      this.engine.cameraController.teleportTo(this.currentZone.defaultPos, this.currentZone.defaultRot, true);
      this.showToast('Camera Reset to Default');
    };
  }

  private initShareAndScreenshot(): void {
    // Share Modal
    const shareBtn = document.getElementById('share-btn')!;
    const shareUrlInput = document.getElementById('share-url-input') as HTMLInputElement;
    const copyBtn = document.getElementById('copy-url-btn')!;
    const copyText = document.getElementById('copy-btn-text')!;

    shareBtn.onclick = () => {
      const payload: StatePayload = {
        zoneId: this.currentZone.id,
        camPos: [this.engine.cameraController.position.x, this.engine.cameraController.position.y, this.engine.cameraController.position.z],
        camRot: [this.engine.cameraController.yaw, this.engine.cameraController.pitch],
        speed: this.engine.cameraController.speedMultiplier
      };

      const url = StateManager.getShareUrl(payload);
      shareUrlInput.value = url;
      copyText.textContent = 'COPY';
      this.openModal('share-modal');
    };

    document.getElementById('share-modal-close')!.onclick = () => this.closeModal('share-modal');

    copyBtn.onclick = () => {
      navigator.clipboard.writeText(shareUrlInput.value);
      copyText.textContent = 'COPIED!';
      this.showToast('Link copied to clipboard!');
      setTimeout(() => { copyText.textContent = 'COPY'; }, 2000);
    };

    // Screenshot
    document.getElementById('screenshot-btn')!.onclick = () => {
      StateManager.captureScreenshot(this.engine.renderer, this.engine.scene, this.engine.camera);
      this.showToast('Screenshot saved!');
    };
  }

  private initAudio(): void {
    const btn = document.getElementById('audio-toggle-btn')!;
    btn.onclick = () => {
      const isPlaying = this.audioPlayer.toggle();
      if (isPlaying) {
        btn.classList.add('active');
        this.showToast('BGM Synth: Playing Pioneer II Theme');
      } else {
        btn.classList.remove('active');
        this.showToast('BGM Synth: Muted');
      }
    };
  }

  private initFileDrop(): void {
    const overlay = document.getElementById('drop-zone-overlay')!;
    const importBtn = document.getElementById('import-btn')!;

    importBtn.onclick = () => {
      // Trigger hidden file picker
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = '.rel,.nj,.xj,.prs,.bml,.obj,.gltf,.glb';
      input.onchange = (e) => {
        const file = (e.target as HTMLInputElement).files?.[0];
        if (file) this.handleDroppedFile(file);
      };
      input.click();
    };

    window.addEventListener('dragover', (e) => {
      e.preventDefault();
      overlay.classList.remove('hidden');
    });

    overlay.addEventListener('dragleave', () => {
      overlay.classList.add('hidden');
    });

    overlay.addEventListener('drop', (e) => {
      e.preventDefault();
      overlay.classList.add('hidden');
      const files = e.dataTransfer?.files;
      if (files && files.length > 0) {
        this.handleDroppedFile(files[0]);
      }
    });
  }

  private handleDroppedFile(file: File): void {
    const reader = new FileReader();
    reader.onload = (event) => {
      const buffer = event.target?.result as ArrayBuffer;
      if (buffer) {
        const group = NinjaModelParser.parseFile(buffer, file.name);
        this.engine.worldLoader.loadCustomGroup(group, file.name);
        
        document.getElementById('header-episode-tag')!.textContent = 'CUSTOM ASSET';
        document.getElementById('header-zone-name')!.textContent = file.name;
        this.showToast(`Imported PSO map: ${file.name}`);
      }
    };
    reader.readAsArrayBuffer(file);
  }

  private openModal(id: string): void {
    document.getElementById(id)?.classList.remove('hidden');
  }

  private closeModal(id: string): void {
    document.getElementById(id)?.classList.add('hidden');
  }

  private showToast(msg: string): void {
    const container = document.getElementById('toast-container')!;
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.innerHTML = `<i data-lucide="info" class="icon-xs icon-accent"></i><span>${msg}</span>`;
    container.appendChild(toast);
    createIcons({ icons });

    setTimeout(() => {
      toast.style.opacity = '0';
      setTimeout(() => toast.remove(), 300);
    }, 2500);
  }
}

// Bootstrap on DOM Ready
window.addEventListener('DOMContentLoaded', () => {
  new PsoNoclipApp();
});
