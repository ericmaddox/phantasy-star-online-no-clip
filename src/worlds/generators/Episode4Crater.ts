import * as THREE from 'three';
import { PsoShaders } from '../shaders/PsoShaders';

export class Episode4Builder {
  /**
   * Crater Interior (Meteorite Impact)
   */
  public static buildCrater(): THREE.Group {
    const root = new THREE.Group();
    root.name = 'Crater_Interior';

    // Crater Rim & Blasted Ground
    const craterMat = new THREE.MeshStandardMaterial({
      color: 0x2e2014,
      roughness: 0.9
    });

    const craterTerrain = new THREE.Mesh(
      new THREE.CylinderGeometry(90, 50, 20, 48, 8, true),
      craterMat
    );
    craterTerrain.position.y = 10;
    root.add(craterTerrain);

    const floor = new THREE.Mesh(new THREE.CircleGeometry(50, 48), craterMat);
    floor.rotation.x = -Math.PI / 2;
    root.add(floor);

    // Glowing Meteorite Fragment Core
    const meteorMat = new THREE.MeshStandardMaterial({
      color: 0xff7722,
      emissive: 0xaa3300,
      roughness: 0.2,
      metalness: 0.8
    });

    const meteorite = new THREE.Mesh(new THREE.DodecahedronGeometry(8, 2), meteorMat);
    meteorite.position.set(0, 8, -30);
    root.add(meteorite);

    // Crystal Shards
    const crystalMat = new THREE.MeshStandardMaterial({
      color: 0xffaa44,
      emissive: 0x884411,
      roughness: 0.1,
      transparent: true,
      opacity: 0.85
    });

    for (let i = 0; i < 16; i++) {
      const angle = (i * Math.PI * 2) / 16;
      const r = 25 + Math.random() * 15;
      const crystal = new THREE.Mesh(
        new THREE.ConeGeometry(2, 12, 6),
        crystalMat
      );
      crystal.position.set(Math.cos(angle) * r, 5, Math.sin(angle) * r);
      crystal.rotation.z = Math.cos(angle) * 0.4;
      crystal.rotation.x = -Math.sin(angle) * 0.4;
      root.add(crystal);
    }

    return root;
  }

  /**
   * Subterranean Desert & Saint-Million
   */
  public static buildDesert(): THREE.Group {
    const root = new THREE.Group();
    root.name = 'Desert_SaintMillion';

    const sandMat = new THREE.MeshStandardMaterial({
      color: 0x8a5828,
      roughness: 0.95
    });

    // Wavy Sand Dunes
    const duneGeom = new THREE.PlaneGeometry(240, 240, 48, 48);
    const pos = duneGeom.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i);
      const y = pos.getY(i);
      pos.setZ(i, Math.sin(x * 0.04) * 8 + Math.cos(y * 0.03) * 5);
    }
    duneGeom.computeVertexNormals();

    const dunes = new THREE.Mesh(duneGeom, sandMat);
    dunes.rotation.x = -Math.PI / 2;
    root.add(dunes);

    // Saint-Million Arena Ring
    const arenaRing = new THREE.Mesh(
      new THREE.TorusGeometry(35, 3, 16, 32),
      new THREE.MeshStandardMaterial({ color: 0x5c381a, roughness: 0.85 })
    );
    arenaRing.rotation.x = Math.PI / 2;
    arenaRing.position.set(0, 1.5, -35);
    root.add(arenaRing);

    // Sand Whirlpool in Center
    const vortex = new THREE.Mesh(
      new THREE.CircleGeometry(24, 32),
      PsoShaders.createHologramMaterial(new THREE.Color(0xffaa33), 0.5)
    );
    vortex.rotation.x = -Math.PI / 2;
    vortex.position.set(0, 0.2, -35);
    root.add(vortex);

    return root;
  }
}
