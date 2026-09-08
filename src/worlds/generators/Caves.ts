import * as THREE from 'three';
import { TextureGenerator } from '../../utils/TextureGenerator';
import { PsoShaders } from '../shaders/PsoShaders';

export class CavesBuilder {
  public static build(isDeRolLe = false): THREE.Group {
    const root = new THREE.Group();
    root.name = isDeRolLe ? 'Caves_DeRolLe' : 'Caves';

    if (!isDeRolLe) {
      // ==========================================
      // CAVES 1, 2, 3: Subterranean Bioluminescent Grotto
      // ==========================================
      const caveRockMat = new THREE.MeshStandardMaterial({
        color: 0x16202c,
        roughness: 0.9,
        metalness: 0.2
      });

      // Cavern Vault Enclosure (Rough rocky ceiling and floor)
      const caveFloorGeom = new THREE.PlaneGeometry(200, 200, 48, 48);
      const pos = caveFloorGeom.attributes.position;
      for (let i = 0; i < pos.count; i++) {
        const x = pos.getX(i);
        const y = pos.getY(i);
        pos.setZ(i, Math.sin(x * 0.05) * 5 + Math.cos(y * 0.05) * 5 + Math.random() * 2);
      }
      caveFloorGeom.computeVertexNormals();

      const floorMesh = new THREE.Mesh(caveFloorGeom, caveRockMat);
      floorMesh.rotation.x = -Math.PI / 2;
      root.add(floorMesh);

      // Bioluminescent Crystal Spires
      const crystalMat = new THREE.MeshStandardMaterial({
        color: 0x00f0ff,
        emissive: 0x0088cc,
        roughness: 0.1,
        metalness: 0.9,
        transparent: true,
        opacity: 0.85
      });

      const crystalClusters = [
        [-35, 10, -20], [30, 8, 25], [-20, 5, 40],
        [40, 12, -40], [0, 8, -50], [-45, 6, 30]
      ];

      for (const [cx, cy, cz] of crystalClusters) {
        const cluster = new THREE.Group();
        cluster.position.set(cx, cy, cz);

        for (let i = 0; i < 5; i++) {
          const spire = new THREE.Mesh(
            new THREE.ConeGeometry(1.2 - i * 0.15, 8 + i * 2, 6),
            crystalMat
          );
          spire.position.set((Math.random() - 0.5) * 4, 4, (Math.random() - 0.5) * 4);
          spire.rotation.z = (Math.random() - 0.5) * 0.4;
          spire.rotation.x = (Math.random() - 0.5) * 0.4;
          cluster.add(spire);
        }

        // Crystal point light
        const pLight = new THREE.PointLight(0x00f0ff, 1.5, 30);
        pLight.position.y = 5;
        cluster.add(pLight);

        root.add(cluster);
      }

      // Stalactites hanging from ceiling
      for (let i = 0; i < 20; i++) {
        const stal = new THREE.Mesh(
          new THREE.ConeGeometry(1.8, 14, 8),
          caveRockMat
        );
        stal.position.set((Math.random() - 0.5) * 160, 32, (Math.random() - 0.5) * 160);
        stal.rotation.x = Math.PI;
        root.add(stal);
      }

      // Magma Trench Flow
      const magmaMesh = new THREE.Mesh(
        new THREE.PlaneGeometry(30, 140),
        PsoShaders.createLavaMaterial()
      );
      magmaMesh.rotation.x = -Math.PI / 2;
      magmaMesh.position.set(45, 0.4, 0);
      root.add(magmaMesh);

    } else {
      // ==========================================
      // DE ROL LE: Subterranean Sewer Trench & Combat Raft
      // ==========================================
      // Infinite Water Canal
      const canalWater = new THREE.Mesh(
        new THREE.PlaneGeometry(70, 300),
        PsoShaders.createWaterMaterial(new THREE.Color(0x0a4055))
      );
      canalWater.rotation.x = -Math.PI / 2;
      root.add(canalWater);

      // Tunnel Enclosure Walls
      const tunnelMat = new THREE.MeshStandardMaterial({ color: 0x121a22, roughness: 0.8, metalness: 0.3 });
      const tunnelWallLeft = new THREE.Mesh(new THREE.BoxGeometry(10, 40, 300), tunnelMat);
      tunnelWallLeft.position.set(-38, 15, 0);
      root.add(tunnelWallLeft);

      const tunnelWallRight = new THREE.Mesh(new THREE.BoxGeometry(10, 40, 300), tunnelMat);
      tunnelWallRight.position.set(38, 15, 0);
      root.add(tunnelWallRight);

      // Combat Raft Platform
      const raftGroup = new THREE.Group();
      raftGroup.position.set(0, 1.5, 0);

      const raftDeck = new THREE.Mesh(
        new THREE.BoxGeometry(24, 2, 45),
        new THREE.MeshStandardMaterial({
          map: TextureGenerator.createPioneerMetalTexture('#263544', '#162230', '#00f0ff'),
          roughness: 0.4,
          metalness: 0.8
        })
      );
      raftGroup.add(raftDeck);

      // Raft Catamaran Pontoons
      const pontoonMat = new THREE.MeshStandardMaterial({ color: 0x0c1622, metalness: 0.9, roughness: 0.2 });
      for (const px of [-13, 13]) {
        const pontoon = new THREE.Mesh(new THREE.CylinderGeometry(2, 2, 50, 16), pontoonMat);
        pontoon.rotation.x = Math.PI / 2;
        pontoon.position.set(px, -1, 0);
        raftGroup.add(pontoon);
      }

      // Raft Railings & Navigation Lights
      const railMat = new THREE.MeshBasicMaterial({ color: 0x00f0ff });
      const railFront = new THREE.Mesh(new THREE.BoxGeometry(22, 1.2, 0.4), railMat);
      railFront.position.set(0, 2, -22);
      raftGroup.add(railFront);

      const railBack = new THREE.Mesh(new THREE.BoxGeometry(22, 1.2, 0.4), railMat);
      railBack.position.set(0, 2, 22);
      raftGroup.add(railBack);

      root.add(raftGroup);
    }

    return root;
  }
}
