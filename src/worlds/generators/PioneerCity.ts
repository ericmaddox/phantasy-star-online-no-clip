import * as THREE from 'three';
import { TextureGenerator } from '../../utils/TextureGenerator';
import { PsoShaders } from '../shaders/PsoShaders';

export class PioneerCityBuilder {
  public static build(): THREE.Group {
    const root = new THREE.Group();
    root.name = 'PioneerCity';

    // Materials
    const floorTexture = TextureGenerator.createPioneerMetalTexture('#162232', '#0a1420', '#00f0ff');
    floorTexture.repeat.set(8, 8);
    const floorMat = new THREE.MeshStandardMaterial({
      map: floorTexture,
      roughness: 0.4,
      metalness: 0.7
    });

    const wallMat = new THREE.MeshStandardMaterial({
      color: 0x182536,
      roughness: 0.5,
      metalness: 0.5
    });

    const accentCyanMat = new THREE.MeshBasicMaterial({ color: 0x00f0ff });
    const hologramMat = PsoShaders.createHologramMaterial(new THREE.Color(0x00f0ff), 0.7);
    const orangeHolomat = PsoShaders.createHologramMaterial(new THREE.Color(0xff9900), 0.8);

    // ==========================================
    // 1. Central Plaza Main Deck (Circular Tiered Floor)
    // ==========================================
    const floorMesh = new THREE.Mesh(
      new THREE.CylinderGeometry(60, 60, 2, 48),
      floorMat
    );
    floorMesh.position.y = -1;
    floorMesh.receiveShadow = true;
    root.add(floorMesh);

    // Outer ring barrier
    const ringBarrier = new THREE.Mesh(
      new THREE.TorusGeometry(59, 1.2, 16, 64),
      new THREE.MeshStandardMaterial({ color: 0x0c1b2c, metalness: 0.8, roughness: 0.3 })
    );
    ringBarrier.rotation.x = Math.PI / 2;
    ringBarrier.position.y = 1.2;
    root.add(ringBarrier);

    // ==========================================
    // 2. Giant Observation Dome & Planet Ragol Vista
    // ==========================================
    const domeWindowGeom = new THREE.SphereGeometry(140, 32, 16, 0, Math.PI * 2, 0, Math.PI * 0.4);
    const domeWindowMat = new THREE.MeshStandardMaterial({
      color: 0x051a30,
      transparent: true,
      opacity: 0.35,
      roughness: 0.1,
      metalness: 0.9,
      side: THREE.BackSide
    });
    const dome = new THREE.Mesh(domeWindowGeom, domeWindowMat);
    dome.position.set(0, 0, 0);
    root.add(dome);

    // Planet Ragol in Background (Green/Blue swirling planet)
    const ragolGroup = new THREE.Group();
    ragolGroup.position.set(0, 50, 180);

    const ragolPlanet = new THREE.Mesh(
      new THREE.SphereGeometry(45, 32, 32),
      new THREE.MeshStandardMaterial({
        color: 0x1a7a60,
        roughness: 0.8,
        emissive: 0x042818
      })
    );
    ragolGroup.add(ragolPlanet);

    // Ragol atmosphere glow ring
    const atmosphereRing = new THREE.Mesh(
      new THREE.RingGeometry(46, 52, 64),
      new THREE.MeshBasicMaterial({ color: 0x00f0ff, transparent: true, opacity: 0.4, side: THREE.DoubleSide })
    );
    atmosphereRing.lookAt(0, 50, 180);
    ragolGroup.add(atmosphereRing);
    root.add(ragolGroup);

    // ==========================================
    // 3. Principal Tyrell's Office (North Elevated Chamber)
    // ==========================================
    const officeGroup = new THREE.Group();
    officeGroup.position.set(0, 6, -42);

    // Office Platform
    const officeFloor = new THREE.Mesh(
      new THREE.BoxGeometry(32, 2, 24),
      floorMat
    );
    officeGroup.add(officeFloor);

    // Office Desk & Command Console
    const desk = new THREE.Mesh(
      new THREE.CylinderGeometry(8, 9, 2.5, 32, 1, false, 0, Math.PI),
      new THREE.MeshStandardMaterial({ color: 0x1a2e45, metalness: 0.8, roughness: 0.2 })
    );
    desk.position.set(0, 2.2, -4);
    desk.rotation.y = Math.PI;
    officeGroup.add(desk);

    // Principal Office Hologram Display
    const holoscreen = new THREE.Mesh(
      new THREE.PlaneGeometry(12, 4),
      orangeHolomat
    );
    holoscreen.position.set(0, 6, -6);
    officeGroup.add(holoscreen);

    // Council Chairs
    for (let i = -1; i <= 1; i++) {
      const chair = new THREE.Mesh(
        new THREE.BoxGeometry(2, 3, 2),
        new THREE.MeshStandardMaterial({ color: 0x0b1624 })
      );
      chair.position.set(i * 4, 2.5, -8);
      officeGroup.add(chair);
    }

    // Stairs leading to Office
    const stairs = new THREE.Mesh(
      new THREE.BoxGeometry(16, 2, 8),
      wallMat
    );
    stairs.position.set(0, 1, -26);
    root.add(stairs);
    root.add(officeGroup);

    // ==========================================
    // 4. Hunter's Guild Counter (West Wing)
    // ==========================================
    const guildGroup = new THREE.Group();
    guildGroup.position.set(-36, 0, 5);
    guildGroup.rotation.y = Math.PI / 2;

    const guildCounter = new THREE.Mesh(
      new THREE.BoxGeometry(20, 3, 4),
      new THREE.MeshStandardMaterial({ color: 0x163428, metalness: 0.6, roughness: 0.4 })
    );
    guildCounter.position.y = 1.5;
    guildGroup.add(guildCounter);

    const guildSign = new THREE.Mesh(
      new THREE.BoxGeometry(16, 2, 0.5),
      new THREE.MeshStandardMaterial({ color: 0x2bf88e, emissive: 0x1a7a40, roughness: 0.2 })
    );
    guildSign.position.set(0, 5, 0);
    guildGroup.add(guildSign);

    // Quest terminal screens
    for (let x = -6; x <= 6; x += 4) {
      const term = new THREE.Mesh(new THREE.BoxGeometry(1.5, 2, 1), wallMat);
      term.position.set(x, 4, 1.2);
      guildGroup.add(term);
    }
    root.add(guildGroup);

    // ==========================================
    // 5. Shopping District / Item / Weapon Shops (East Wing)
    // ==========================================
    const shopGroup = new THREE.Group();
    shopGroup.position.set(36, 0, 5);
    shopGroup.rotation.y = -Math.PI / 2;

    const shopCounter = new THREE.Mesh(
      new THREE.BoxGeometry(22, 3, 4),
      new THREE.MeshStandardMaterial({ color: 0x362416, metalness: 0.6, roughness: 0.4 })
    );
    shopCounter.position.y = 1.5;
    shopGroup.add(shopCounter);

    const shopSign = new THREE.Mesh(
      new THREE.BoxGeometry(18, 2, 0.5),
      new THREE.MeshStandardMaterial({ color: 0xffaa00, emissive: 0x884400, roughness: 0.2 })
    );
    shopSign.position.set(0, 5, 0);
    shopGroup.add(shopSign);

    // Spinning Holographic Item Icon above shop
    const itemIco = new THREE.Mesh(
      new THREE.OctahedronGeometry(1.8),
      orangeHolomat
    );
    itemIco.position.set(0, 8.5, 0);
    shopGroup.add(itemIco);
    root.add(shopGroup);

    // ==========================================
    // 6. Medical Center / Hospital Counter (South West)
    // ==========================================
    const medGroup = new THREE.Group();
    medGroup.position.set(-25, 0, 30);
    medGroup.rotation.y = Math.PI / 4;

    const medCounter = new THREE.Mesh(
      new THREE.BoxGeometry(12, 3, 3),
      new THREE.MeshStandardMaterial({ color: 0x1b3040, metalness: 0.5 })
    );
    medCounter.position.y = 1.5;
    medGroup.add(medCounter);

    const medCross = new THREE.Mesh(
      new THREE.BoxGeometry(3, 3, 0.5),
      new THREE.MeshStandardMaterial({ color: 0x2bf88e, emissive: 0x18a850 })
    );
    medCross.position.set(0, 5.5, 0);
    medGroup.add(medCross);
    root.add(medGroup);

    // ==========================================
    // 7. Ragol Beam Teleporter Platform (Center)
    // ==========================================
    const teleporterBase = new THREE.Mesh(
      new THREE.CylinderGeometry(9, 10, 1.2, 32),
      new THREE.MeshStandardMaterial({ color: 0x0f2035, metalness: 0.9, roughness: 0.2 })
    );
    teleporterBase.position.set(0, 0.6, -10);
    root.add(teleporterBase);

    // Swirling Warp Vortex Portal
    const warpPlane = new THREE.Mesh(
      new THREE.PlaneGeometry(14, 14),
      PsoShaders.createWarpMaterial()
    );
    warpPlane.rotation.x = -Math.PI / 2;
    warpPlane.position.set(0, 1.3, -10);
    root.add(warpPlane);

    // Teleporter 4 Hologram Pillar Emitters
    for (let i = 0; i < 4; i++) {
      const angle = (i * Math.PI) / 2 + Math.PI / 4;
      const x = Math.cos(angle) * 7.5;
      const z = -10 + Math.sin(angle) * 7.5;
      const pillar = new THREE.Mesh(
        new THREE.CylinderGeometry(0.5, 0.6, 6, 16),
        wallMat
      );
      pillar.position.set(x, 3, z);
      root.add(pillar);

      const lightTip = new THREE.Mesh(new THREE.SphereGeometry(0.4, 16, 16), accentCyanMat);
      lightTip.position.set(x, 6, z);
      root.add(lightTip);
    }

    // ==========================================
    // 8. Holographic Directory & Info Kiosks
    // ==========================================
    const infoPillar = new THREE.Mesh(
      new THREE.CylinderGeometry(1.5, 1.5, 5, 16),
      new THREE.MeshStandardMaterial({ color: 0x122438, metalness: 0.8 })
    );
    infoPillar.position.set(0, 2.5, 18);
    root.add(infoPillar);

    const infoHolo = new THREE.Mesh(
      new THREE.CylinderGeometry(3.5, 3.5, 3, 16, 1, true),
      hologramMat
    );
    infoHolo.position.set(0, 6.5, 18);
    root.add(infoHolo);

    return root;
  }
}
