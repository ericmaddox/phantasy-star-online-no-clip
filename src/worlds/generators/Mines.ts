import * as THREE from 'three';
import { TextureGenerator } from '../../utils/TextureGenerator';
import { PsoShaders } from '../shaders/PsoShaders';

export class MinesBuilder {
  public static build(): THREE.Group {
    const root = new THREE.Group();
    root.name = 'Mines_VolOpt';

    const steelMat = new THREE.MeshStandardMaterial({
      color: 0x222a36,
      metalness: 0.85,
      roughness: 0.35
    });

    const hazardTex = TextureGenerator.createMinesHazardTexture();
    hazardTex.repeat.set(4, 1);
    const hazardMat = new THREE.MeshStandardMaterial({
      map: hazardTex,
      roughness: 0.5,
      metalness: 0.4
    });

    // ==========================================
    // 1. Industrial Octagonal Arena Floor
    // ==========================================
    const floorMesh = new THREE.Mesh(
      new THREE.CylinderGeometry(55, 55, 2, 8),
      steelMat
    );
    floorMesh.position.y = -1;
    root.add(floorMesh);

    // Outer hazard rim
    const rim = new THREE.Mesh(
      new THREE.RingGeometry(50, 55, 8),
      hazardMat
    );
    rim.rotation.x = -Math.PI / 2;
    rim.position.y = 0.05;
    root.add(rim);

    // ==========================================
    // 2. Vol Opt Central Supercomputer AI Core
    // ==========================================
    const coreGroup = new THREE.Group();
    coreGroup.position.set(0, 0, -25);

    // Core base
    const coreBase = new THREE.Mesh(
      new THREE.CylinderGeometry(10, 12, 4, 32),
      new THREE.MeshStandardMaterial({ color: 0x141e2a, metalness: 0.9 })
    );
    coreBase.position.y = 2;
    coreGroup.add(coreBase);

    // Central Glass AI Cylinder
    const aiCylinder = new THREE.Mesh(
      new THREE.CylinderGeometry(7, 7, 24, 32),
      new THREE.MeshStandardMaterial({
        color: 0xff3300,
        emissive: 0x991100,
        roughness: 0.1,
        transparent: true,
        opacity: 0.85
      })
    );
    aiCylinder.position.y = 14;
    coreGroup.add(aiCylinder);

    // Inner pulsating energy core
    const innerPillar = new THREE.Mesh(
      new THREE.CylinderGeometry(3, 3, 22, 16),
      new THREE.MeshBasicMaterial({ color: 0xffaa00 })
    );
    innerPillar.position.y = 14;
    coreGroup.add(innerPillar);

    // Vol Opt Multi-screen Display Monoliths
    const monitorMat = PsoShaders.createHologramMaterial(new THREE.Color(0xff4400), 0.9);
    for (let i = 0; i < 6; i++) {
      const angle = (i * Math.PI) / 3;
      const x = Math.cos(angle) * 14;
      const z = Math.sin(angle) * 14;

      const monitorPillar = new THREE.Mesh(
        new THREE.BoxGeometry(3, 18, 1),
        steelMat
      );
      monitorPillar.position.set(x, 11, z);
      monitorPillar.lookAt(0, 11, 0);
      coreGroup.add(monitorPillar);

      const screen = new THREE.Mesh(
        new THREE.PlaneGeometry(2.6, 6),
        monitorMat
      );
      screen.position.set(x, 13, z);
      screen.lookAt(0, 13, 0);
      coreGroup.add(screen);
    }

    root.add(coreGroup);

    // ==========================================
    // 3. Heavy Industrial Conveyors & Server Racks
    // ==========================================
    const rackMat = new THREE.MeshStandardMaterial({ color: 0x18202c, metalness: 0.8 });
    for (let side = -1; side <= 1; side += 2) {
      for (let i = 0; i < 4; i++) {
        const rack = new THREE.Mesh(new THREE.BoxGeometry(4, 12, 4), rackMat);
        rack.position.set(side * (30 + i * 4), 6, (i - 1.5) * 12);
        root.add(rack);

        // Server status LEDs
        for (let l = 0; l < 4; l++) {
          const led = new THREE.Mesh(
            new THREE.BoxGeometry(3.6, 0.4, 0.2),
            new THREE.MeshBasicMaterial({ color: l % 2 === 0 ? 0x00f0ff : 0xff3344 })
          );
          led.position.set(side * (30 + i * 4), 3 + l * 2, (i - 1.5) * 12 + (side > 0 ? -2.1 : 2.1));
          root.add(led);
        }
      }
    }

    return root;
  }
}
