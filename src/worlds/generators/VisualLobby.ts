import * as THREE from 'three';
import { TextureGenerator } from '../../utils/TextureGenerator';
import { PsoShaders } from '../shaders/PsoShaders';

export class VisualLobbyBuilder {
  public static build(isFestive = false): THREE.Group {
    const root = new THREE.Group();
    root.name = isFestive ? 'VisualLobbyFestive' : 'VisualLobby';

    const floorColorA = isFestive ? '#2e1224' : '#102034';
    const floorColorB = isFestive ? '#180812' : '#081220';
    const gridColor = isFestive ? '#ff77aa' : '#00f0ff';

    const floorTex = TextureGenerator.createPioneerMetalTexture(floorColorA, floorColorB, gridColor);
    floorTex.repeat.set(6, 6);

    const floorMat = new THREE.MeshStandardMaterial({
      map: floorTex,
      roughness: 0.3,
      metalness: 0.8
    });

    const structureMat = new THREE.MeshStandardMaterial({
      color: isFestive ? 0x24121e : 0x142236,
      roughness: 0.4,
      metalness: 0.6
    });

    const accentMat = new THREE.MeshBasicMaterial({ color: isFestive ? 0xff66aa : 0x00f0ff });
    const holoMat = PsoShaders.createHologramMaterial(new THREE.Color(isFestive ? 0xff88cc : 0x00f0ff), 0.8);

    // ==========================================
    // 1. Main Circular Lobby Arena & Terraces
    // ==========================================
    const lobbyFloor = new THREE.Mesh(
      new THREE.CylinderGeometry(50, 50, 2, 48),
      floorMat
    );
    lobbyFloor.position.y = -1;
    root.add(lobbyFloor);

    // Outer Upper Catwalk / Balcony
    const upperBalcony = new THREE.Mesh(
      new THREE.RingGeometry(48, 62, 48),
      new THREE.MeshStandardMaterial({
        color: isFestive ? 0x301524 : 0x182c48,
        metalness: 0.7,
        roughness: 0.4,
        side: THREE.DoubleSide
      })
    );
    upperBalcony.rotation.x = -Math.PI / 2;
    upperBalcony.position.y = 12;
    root.add(upperBalcony);

    // Balcony Railing
    const railing = new THREE.Mesh(
      new THREE.TorusGeometry(49, 0.6, 12, 48),
      accentMat
    );
    railing.rotation.x = Math.PI / 2;
    railing.position.y = 13.5;
    root.add(railing);

    // Balcony Support Columns
    for (let i = 0; i < 8; i++) {
      const angle = (i * Math.PI) / 4;
      const x = Math.cos(angle) * 49;
      const z = Math.sin(angle) * 49;
      const col = new THREE.Mesh(
        new THREE.CylinderGeometry(1.2, 1.5, 12, 16),
        structureMat
      );
      col.position.set(x, 6, z);
      root.add(col);
    }

    // ==========================================
    // 2. Central Giant Hologram Spire & Warp Rings
    // ==========================================
    const spireBase = new THREE.Mesh(
      new THREE.CylinderGeometry(6, 8, 3, 32),
      new THREE.MeshStandardMaterial({ color: 0x0d1e30, metalness: 0.9 })
    );
    spireBase.position.set(0, 1.5, 0);
    root.add(spireBase);

    // Rotating Holographic Column
    const holoSpire = new THREE.Mesh(
      new THREE.CylinderGeometry(2.5, 2.5, 30, 32, 1, true),
      holoMat
    );
    holoSpire.position.set(0, 15, 0);
    root.add(holoSpire);

    // Concentric Energy Rings
    for (let r = 0; r < 3; r++) {
      const ring = new THREE.Mesh(
        new THREE.TorusGeometry(4 + r * 2, 0.25, 16, 48),
        accentMat
      );
      ring.rotation.x = Math.PI / 2;
      ring.position.y = 8 + r * 6;
      root.add(ring);
    }

    // ==========================================
    // 3. Soccer Field & Interactive Soccer Ball (South)
    // ==========================================
    const soccerField = new THREE.Mesh(
      new THREE.PlaneGeometry(30, 20),
      new THREE.MeshStandardMaterial({
        color: isFestive ? 0x441830 : 0x0c3022,
        roughness: 0.7,
        metalness: 0.2
      })
    );
    soccerField.rotation.x = -Math.PI / 2;
    soccerField.position.set(0, 0.05, 32);
    root.add(soccerField);

    // Goal Nets
    for (const z of [22, 42]) {
      const goalFrame = new THREE.Mesh(
        new THREE.BoxGeometry(10, 4, 0.4),
        new THREE.MeshStandardMaterial({ color: 0xffffff, wireframe: true })
      );
      goalFrame.position.set(0, 2, z);
      root.add(goalFrame);
    }

    // Interactive Soccer Ball (High detail icosahedron)
    const ballGeom = new THREE.IcosahedronGeometry(1.6, 2);
    const ballMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.3,
      metalness: 0.5,
      emissive: isFestive ? 0x331020 : 0x003344
    });
    const soccerBall = new THREE.Mesh(ballGeom, ballMat);
    soccerBall.position.set(0, 1.6, 32);
    soccerBall.name = 'soccer_ball';
    root.add(soccerBall);

    // ==========================================
    // 4. Ship Information Counter & Gateways (North)
    // ==========================================
    const counterDesk = new THREE.Mesh(
      new THREE.BoxGeometry(28, 3, 5),
      new THREE.MeshStandardMaterial({ color: isFestive ? 0x40162a : 0x162c46, metalness: 0.7 })
    );
    counterDesk.position.set(0, 1.5, -42);
    root.add(counterDesk);

    const deskHoloSign = new THREE.Mesh(
      new THREE.PlaneGeometry(24, 3),
      holoMat
    );
    deskHoloSign.position.set(0, 5.5, -42);
    root.add(deskHoloSign);

    // ==========================================
    // 5. Festive Elements: Cherry Blossom Sakura Trees
    // ==========================================
    if (isFestive) {
      const treePositions = [
        [-25, 0, -20],
        [25, 0, -20],
        [-30, 0, 15],
        [30, 0, 15]
      ];

      const trunkMat = new THREE.MeshStandardMaterial({ color: 0x3d2314, roughness: 0.9 });
      const foliageMat = new THREE.MeshStandardMaterial({
        color: 0xff88bb,
        emissive: 0x441122,
        roughness: 0.6
      });

      for (const [tx, ty, tz] of treePositions) {
        const trunk = new THREE.Mesh(
          new THREE.CylinderGeometry(0.8, 1.4, 8, 12),
          trunkMat
        );
        trunk.position.set(tx, ty + 4, tz);
        root.add(trunk);

        // Canopy
        for (let j = 0; j < 4; j++) {
          const canopy = new THREE.Mesh(
            new THREE.SphereGeometry(3.5 - j * 0.4, 16, 16),
            foliageMat
          );
          canopy.position.set(tx + (j % 2 === 0 ? 1 : -1), ty + 8 + j * 1.5, tz);
          root.add(canopy);
        }
      }
    }

    return root;
  }
}
