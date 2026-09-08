import * as THREE from 'three';
import { TextureGenerator } from '../../utils/TextureGenerator';
import { PsoShaders } from '../shaders/PsoShaders';

export class RuinsBuilder {
  public static build(): THREE.Group {
    const root = new THREE.Group();
    root.name = 'Ruins_DarkFalz';

    const runicTex = TextureGenerator.createRuinsRunicTexture();
    runicTex.repeat.set(4, 4);

    const alienStoneMat = new THREE.MeshStandardMaterial({
      map: runicTex,
      roughness: 0.6,
      metalness: 0.4
    });

    const darkPhotonMat = new THREE.MeshStandardMaterial({
      color: 0x6600cc,
      emissive: 0x330066,
      roughness: 0.2,
      metalness: 0.8
    });

    const holoCyan = PsoShaders.createHologramMaterial(new THREE.Color(0x00f0ff), 0.8);

    // ==========================================
    // 1. Alien Floating Sacred Platform
    // ==========================================
    const mainPlatform = new THREE.Mesh(
      new THREE.CylinderGeometry(55, 45, 4, 32),
      alienStoneMat
    );
    mainPlatform.position.y = -2;
    root.add(mainPlatform);

    // Outer Levitating Geometric Chunks
    for (let i = 0; i < 8; i++) {
      const angle = (i * Math.PI) / 4;
      const x = Math.cos(angle) * 70;
      const z = Math.sin(angle) * 70;

      const chunk = new THREE.Mesh(
        new THREE.OctahedronGeometry(6, 1),
        alienStoneMat
      );
      chunk.position.set(x, 10 + Math.sin(i) * 5, z);
      chunk.rotation.set(angle, angle, 0);
      root.add(chunk);
    }

    // ==========================================
    // 2. Red Ring Rico's Memorial Message Capsule
    // ==========================================
    const ricoGroup = new THREE.Group();
    ricoGroup.position.set(0, 0, 18);

    const capsulePedestal = new THREE.Mesh(
      new THREE.CylinderGeometry(3, 4, 1.5, 16),
      darkPhotonMat
    );
    capsulePedestal.position.y = 0.75;
    ricoGroup.add(capsulePedestal);

    // Red Ring Hologram Core
    const redRing = new THREE.Mesh(
      new THREE.TorusGeometry(1.6, 0.2, 16, 32),
      new THREE.MeshBasicMaterial({ color: 0xff0044 })
    );
    redRing.rotation.x = Math.PI / 3;
    redRing.position.y = 3.2;
    ricoGroup.add(redRing);

    // Message Holotape
    const messageHolo = new THREE.Mesh(
      new THREE.CylinderGeometry(1.2, 1.2, 3, 16, 1, true),
      PsoShaders.createHologramMaterial(new THREE.Color(0xff2266), 0.9)
    );
    messageHolo.position.y = 3.2;
    ricoGroup.add(messageHolo);
    root.add(ricoGroup);

    // ==========================================
    // 3. Dark Falz Core Obelisk & Monolith Spires
    // ==========================================
    const obeliskGroup = new THREE.Group();
    obeliskGroup.position.set(0, 0, -32);

    // Giant Triangular Monolith
    const monolith = new THREE.Mesh(
      new THREE.ConeGeometry(8, 38, 4),
      alienStoneMat
    );
    monolith.position.y = 19;
    monolith.rotation.y = Math.PI / 4;
    obeliskGroup.add(monolith);

    // Floating Dark Energy Orb at Apex
    const darkOrb = new THREE.Mesh(
      new THREE.IcosahedronGeometry(3.5, 3),
      new THREE.MeshStandardMaterial({
        color: 0x9900ee,
        emissive: 0x7700cc,
        roughness: 0.1,
        metalness: 0.9
      })
    );
    darkOrb.position.y = 42;
    obeliskGroup.add(darkOrb);

    // Surrounding Obelisk Spires
    for (let i = 0; i < 4; i++) {
      const angle = (i * Math.PI) / 2;
      const x = Math.cos(angle) * 18;
      const z = Math.sin(angle) * 18;

      const spire = new THREE.Mesh(
        new THREE.ConeGeometry(2.5, 20, 4),
        alienStoneMat
      );
      spire.position.set(x, 10, z);
      spire.rotation.y = angle;
      obeliskGroup.add(spire);
    }
    root.add(obeliskGroup);

    // ==========================================
    // 4. Levitating Runic Concentric Rings
    // ==========================================
    for (let r = 0; r < 2; r++) {
      const runicRing = new THREE.Mesh(
        new THREE.RingGeometry(24 + r * 14, 25 + r * 14, 32),
        holoCyan
      );
      runicRing.rotation.x = -Math.PI / 2;
      runicRing.position.y = 8 + r * 6;
      root.add(runicRing);
    }

    return root;
  }
}
