import * as THREE from 'three';

export interface StatePayload {
  zoneId: string;
  camPos: [number, number, number];
  camRot: [number, number];
  speed: number;
}

export class StateManager {
  public static parseUrlHash(): Partial<StatePayload> {
    const hash = window.location.hash.replace('#', '');
    if (!hash) return {};

    const result: Partial<StatePayload> = {};
    const parts = hash.split(';');

    // First part: zoneId (e.g. pso/pioneer2-city or pioneer2-city)
    if (parts[0]) {
      const zonePart = parts[0].replace('pso/', '');
      result.zoneId = zonePart;
    }

    for (let i = 1; i < parts.length; i++) {
      const [key, val] = parts[i].split('=');
      if (key === 'cam' && val) {
        const coords = val.split(',').map(Number);
        if (coords.length >= 5) {
          result.camPos = [coords[0], coords[1], coords[2]];
          result.camRot = [coords[3], coords[4]];
        }
      } else if (key === 'speed' && val) {
        result.speed = parseFloat(val);
      }
    }

    return result;
  }

  public static updateUrlHash(payload: StatePayload): void {
    const posStr = `${payload.camPos[0].toFixed(2)},${payload.camPos[1].toFixed(2)},${payload.camPos[2].toFixed(2)}`;
    const rotStr = `${payload.camRot[0].toFixed(3)},${payload.camRot[1].toFixed(3)}`;
    const newHash = `#pso/${payload.zoneId};cam=${posStr},${rotStr};speed=${payload.speed.toFixed(1)}`;
    
    // Replace hash without cluttering browser history
    history.replaceState(null, '', newHash);
  }

  public static getShareUrl(payload: StatePayload): string {
    const posStr = `${payload.camPos[0].toFixed(2)},${payload.camPos[1].toFixed(2)},${payload.camPos[2].toFixed(2)}`;
    const rotStr = `${payload.camRot[0].toFixed(3)},${payload.camRot[1].toFixed(3)}`;
    return `${window.location.origin}${window.location.pathname}#pso/${payload.zoneId};cam=${posStr},${rotStr};speed=${payload.speed.toFixed(1)}`;
  }

  public static captureScreenshot(renderer: THREE.WebGLRenderer, scene: THREE.Scene, camera: THREE.Camera): void {
    renderer.render(scene, camera);
    const dataUrl = renderer.domElement.toDataURL('image/png');

    const a = document.createElement('a');
    a.download = `PSO_Noclip_${Date.now()}.png`;
    a.href = dataUrl;
    a.click();
  }
}
