import * as THREE from 'three';
import { TextureGenerator } from '../../utils/TextureGenerator';
import { PsoShaders } from '../shaders/PsoShaders';

export class Episode2Builder {
  /**
   * Pioneer 2 Lab (Episode 2 HQ)
   */
  public static buildLab(): THREE.Group {
    const root = new THREE.Group();
    root.name = 'PioneerLab';

    const labFloorTex = TextureGenerator.createPioneerMetalTexture('#182c3c', '#0c1a26', '#00f0ff');
    const floorMat = new THREE.MeshStandardMaterial({ map: labFloorTex, roughness: 0.3, metalness: 0.8 });
    const wallMat = new THREE.MeshStandardMaterial({ color: 0x142838, roughness: 0.4 });
    const tealHolo = PsoShaders.createHologramMaterial(new THREE.Color(0x0de7b9), 0.85);

    // Lab Platform
    const floor = new THREE.Mesh(new THREE.CylinderGeometry(45, 45, 2, 32), floorMat);
    floor.position.y = -1;
    root.add(floor);

    // Natasha Milarose Command Desk
    const desk = new THREE.Mesh(new THREE.BoxGeometry(16, 2.5, 6), wallMat);
    desk.position.set(0, 1.25, -24);
    root.add(desk);

    const deskScreen = new THREE.Mesh(new THREE.PlaneGeometry(14, 4), tealHolo);
    deskScreen.position.set(0, 5, -24);
    root.add(deskScreen);

    // Specimen Bio-Cylinders (West Wing)
    for (let i = 0; i < 3; i++) {
      const tank = new THREE.Mesh(
        new THREE.CylinderGeometry(2.5, 2.5, 10, 16),
        new THREE.MeshStandardMaterial({ color: 0x0de7b9, transparent: true, opacity: 0.6, roughness: 0.1 })
      );
      tank.position.set(-28 + i * 7, 5, 0);
      root.add(tank);

      // Mutated DNA strand inside
      const strand = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 8, 8), new THREE.MeshBasicMaterial({ color: 0xffaa00 }));
      strand.position.set(-28 + i * 7, 5, 0);
      strand.rotation.z = 0.2;
      root.add(strand);
    }

    // VR Simulation Neural Pods (East Wing)
    for (let i = 0; i < 3; i++) {
      const pod = new THREE.Mesh(
        new THREE.CapsuleGeometry(2.5, 6, 8, 16),
        new THREE.MeshStandardMaterial({ color: 0x1a3a50, metalness: 0.9 })
      );
      pod.position.set(28 - i * 7, 4, 0);
      root.add(pod);
    }

    return root;
  }

  /**
   * VR Temple & Spaceship
   */
  public static buildVR(isSpaceship = false): THREE.Group {
    const root = new THREE.Group();
    root.name = isSpaceship ? 'VR_Spaceship' : 'VR_Temple';

    if (!isSpaceship) {
      // VR TEMPLE: Asian Pagoda & Virtual Stream
      const woodMat = new THREE.MeshStandardMaterial({ color: 0x4a2a1a, roughness: 0.7 });
      const roofMat = new THREE.MeshStandardMaterial({ color: 0x18404a, roughness: 0.4 });
      const gridMat = PsoShaders.createHologramMaterial(new THREE.Color(0x00f0ff), 0.6);

      // Virtual Floor Grid
      const floor = new THREE.Mesh(new THREE.PlaneGeometry(180, 180, 32, 32), new THREE.MeshStandardMaterial({ color: 0x081622, roughness: 0.8 }));
      floor.rotation.x = -Math.PI / 2;
      root.add(floor);

      // Torii Gate Entrance
      const gateGroup = new THREE.Group();
      gateGroup.position.set(0, 0, 38);

      const postL = new THREE.Mesh(new THREE.CylinderGeometry(1, 1.2, 16, 12), woodMat);
      postL.position.set(-8, 8, 0);
      gateGroup.add(postL);

      const postR = new THREE.Mesh(new THREE.CylinderGeometry(1, 1.2, 16, 12), woodMat);
      postR.position.set(8, 8, 0);
      gateGroup.add(postR);

      const lintel = new THREE.Mesh(new THREE.BoxGeometry(22, 2, 2.5), roofMat);
      lintel.position.set(0, 15, 0);
      gateGroup.add(lintel);
      root.add(gateGroup);

      // Sanctuary Pagoda
      const pagoda = new THREE.Group();
      pagoda.position.set(0, 0, -20);

      const base = new THREE.Mesh(new THREE.BoxGeometry(24, 6, 24), woodMat);
      base.position.y = 3;
      pagoda.add(base);

      const roof = new THREE.Mesh(new THREE.ConeGeometry(20, 8, 4), roofMat);
      roof.position.y = 10;
      roof.rotation.y = Math.PI / 4;
      pagoda.add(roof);

      // Holographic data waterfall
      const stream = new THREE.Mesh(new THREE.PlaneGeometry(16, 16), gridMat);
      stream.position.set(0, 8, 12.1);
      pagoda.add(stream);

      root.add(pagoda);

    } else {
      // VR SPACESHIP: Combat Bridge & Reactor Core
      const hullMat = new THREE.MeshStandardMaterial({ color: 0x182030, metalness: 0.9, roughness: 0.3 });
      const floor = new THREE.Mesh(new THREE.BoxGeometry(60, 2, 100), hullMat);
      floor.position.y = -1;
      root.add(floor);

      // Command Holotank
      const holotank = new THREE.Mesh(
        new THREE.CylinderGeometry(8, 8, 3, 24),
        new THREE.MeshStandardMaterial({ color: 0x0b1626, metalness: 0.9 })
      );
      holotank.position.set(0, 1.5, -28);
      root.add(holotank);

      const holoSphere = new THREE.Mesh(
        new THREE.SphereGeometry(6, 16, 16),
        PsoShaders.createHologramMaterial(new THREE.Color(0x3388ff), 0.7)
      );
      holoSphere.position.set(0, 8, -28);
      root.add(holoSphere);

      // Reactor Thruster Core
      const reactor = new THREE.Mesh(
        new THREE.CylinderGeometry(10, 10, 20, 24),
        new THREE.MeshStandardMaterial({ color: 0x0044aa, emissive: 0x002266, roughness: 0.2 })
      );
      reactor.rotation.x = Math.PI / 2;
      reactor.position.set(0, 10, 36);
      root.add(reactor);
    }

    return root;
  }

  /**
   * Central Control Area (CCA) & Seabed
   */
  public static buildCCA(): THREE.Group {
    const root = new THREE.Group();
    root.name = 'CCA_GalDaVal';

    // Island Terrain
    const terrain = new THREE.Mesh(
      new THREE.PlaneGeometry(240, 240, 48, 48),
      new THREE.MeshStandardMaterial({
        map: TextureGenerator.createForestGrassTexture(),
        roughness: 0.8
      })
    );
    terrain.rotation.x = -Math.PI / 2;
    root.add(terrain);

    // Ocean Waters surrounding Gal Da Val Island
    const ocean = new THREE.Mesh(
      new THREE.PlaneGeometry(400, 400),
      PsoShaders.createWaterMaterial(new THREE.Color(0x064466))
    );
    ocean.rotation.x = -Math.PI / 2;
    ocean.position.y = -2;
    root.add(ocean);

    // Central Dome Research Tower (North Apex)
    const domeGroup = new THREE.Group();
    domeGroup.position.set(0, 0, -45);

    const domeBase = new THREE.Mesh(
      new THREE.CylinderGeometry(20, 24, 18, 32),
      new THREE.MeshStandardMaterial({ color: 0x1e364a, metalness: 0.8 })
    );
    domeBase.position.y = 9;
    domeGroup.add(domeBase);

    const domeCap = new THREE.Mesh(
      new THREE.SphereGeometry(18, 32, 16, 0, Math.PI * 2, 0, Math.PI * 0.5),
      new THREE.MeshStandardMaterial({ color: 0x00e1ff, transparent: true, opacity: 0.6, metalness: 0.9 })
    );
    domeCap.position.y = 18;
    domeGroup.add(domeCap);
    root.add(domeGroup);

    // Palm / Jungle Trees
    for (let i = 0; i < 18; i++) {
      const angle = (i * Math.PI * 2) / 18;
      const r = 50 + Math.random() * 30;
      const x = Math.cos(angle) * r;
      const z = Math.sin(angle) * r;

      const palmTrunk = new THREE.Mesh(
        new THREE.CylinderGeometry(0.8, 1.4, 16, 8),
        new THREE.MeshStandardMaterial({ color: 0x5a3d28 })
      );
      palmTrunk.position.set(x, 8, z);
      palmTrunk.rotation.z = (Math.random() - 0.5) * 0.2;
      root.add(palmTrunk);

      const palmLeaves = new THREE.Mesh(
        new THREE.ConeGeometry(8, 4, 8),
        new THREE.MeshStandardMaterial({ color: 0x1f8844, roughness: 0.7 })
      );
      palmLeaves.position.set(x, 16, z);
      root.add(palmLeaves);
    }

    return root;
  }

  /**
   * Seabed Research Facility
   */
  public static buildSeabed(): THREE.Group {
    const root = new THREE.Group();
    root.name = 'Seabed_Facility';

    // Deep Ocean Floor
    const seabedFloor = new THREE.Mesh(
      new THREE.PlaneGeometry(200, 200),
      new THREE.MeshStandardMaterial({ color: 0x041424, roughness: 0.9 })
    );
    seabedFloor.rotation.x = -Math.PI / 2;
    root.add(seabedFloor);

    // Glass Research Corridors
    const glassMat = new THREE.MeshStandardMaterial({
      color: 0x00f0ff,
      transparent: true,
      opacity: 0.4,
      roughness: 0.1,
      metalness: 0.9,
      side: THREE.DoubleSide
    });

    const tunnel = new THREE.Mesh(
      new THREE.CylinderGeometry(8, 8, 120, 24, 1, true),
      glassMat
    );
    tunnel.rotation.x = Math.PI / 2;
    tunnel.position.set(0, 8, 0);
    root.add(tunnel);

    // Olga Flow Elevator Descent Shaft
    const shaft = new THREE.Mesh(
      new THREE.CylinderGeometry(20, 20, 60, 32, 1, true),
      new THREE.MeshStandardMaterial({ color: 0x081e32, metalness: 0.85, roughness: 0.3, side: THREE.DoubleSide })
    );
    shaft.position.set(0, -10, -40);
    root.add(shaft);

    return root;
  }
}
