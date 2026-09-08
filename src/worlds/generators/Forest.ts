import * as THREE from 'three';
import { TextureGenerator } from '../../utils/TextureGenerator';
import { PsoShaders } from '../shaders/PsoShaders';

export class ForestBuilder {
  public static build(isDragonLair = false): THREE.Group {
    const root = new THREE.Group();
    root.name = isDragonLair ? 'Forest02_DragonLair' : 'Forest01';

    if (!isDragonLair) {
      // ==========================================
      // FOREST 1: Lush Flora, Rivers & Stone Ruins
      // ==========================================
      const grassTex = TextureGenerator.createForestGrassTexture();
      grassTex.repeat.set(16, 16);

      const terrainMat = new THREE.MeshStandardMaterial({
        map: grassTex,
        roughness: 0.85,
        metalness: 0.1
      });

      // Procedural undulating terrain
      const terrainGeom = new THREE.PlaneGeometry(240, 240, 64, 64);
      const posAttr = terrainGeom.attributes.position;
      for (let i = 0; i < posAttr.count; i++) {
        const x = posAttr.getX(i);
        const y = posAttr.getY(i);
        // Hill noise
        const z = Math.sin(x * 0.03) * 6 + Math.cos(y * 0.03) * 6 + Math.sin((x + y) * 0.05) * 3;
        // Carve river path
        const distToRiver = Math.abs(x - Math.sin(y * 0.04) * 25);
        if (distToRiver < 18) {
          posAttr.setZ(i, z - (18 - distToRiver) * 0.4 - 2);
        } else {
          posAttr.setZ(i, z);
        }
      }
      terrainGeom.computeVertexNormals();

      const terrainMesh = new THREE.Mesh(terrainGeom, terrainMat);
      terrainMesh.rotation.x = -Math.PI / 2;
      root.add(terrainMesh);

      // Flowing Water River
      const waterMesh = new THREE.Mesh(
        new THREE.PlaneGeometry(35, 200, 32, 32),
        PsoShaders.createWaterMaterial(new THREE.Color(0x10b5c0))
      );
      waterMesh.rotation.x = -Math.PI / 2;
      waterMesh.position.set(-10, -0.2, 0);
      root.add(waterMesh);

      // Giant Forest Trees
      const trunkMat = new THREE.MeshStandardMaterial({ color: 0x3d2716, roughness: 0.9 });
      const foliageMat = new THREE.MeshStandardMaterial({ color: 0x1f6629, roughness: 0.7 });

      const treeCoords = [
        [-50, 40], [45, 60], [-70, -20], [60, -50],
        [-30, 80], [30, -80], [-80, 20], [80, 30],
        [-20, -60], [50, 10], [-60, -70], [70, 70]
      ];

      for (const [tx, tz] of treeCoords) {
        const treeGroup = new THREE.Group();
        treeGroup.position.set(tx, 0, tz);

        const trunk = new THREE.Mesh(new THREE.CylinderGeometry(1.5, 3.5, 24, 12), trunkMat);
        trunk.position.y = 12;
        treeGroup.add(trunk);

        // Multi-tier canopy
        for (let l = 0; l < 3; l++) {
          const canopy = new THREE.Mesh(
            new THREE.ConeGeometry(9 - l * 2, 12, 12),
            foliageMat
          );
          canopy.position.y = 18 + l * 6;
          treeGroup.add(canopy);
        }
        root.add(treeGroup);
      }

      // Ancient Stone Ruins & Monoliths
      const stoneMat = new THREE.MeshStandardMaterial({ color: 0x4a584e, roughness: 0.8 });
      for (let i = 0; i < 6; i++) {
        const angle = (i * Math.PI) / 3;
        const x = Math.cos(angle) * 35;
        const z = Math.sin(angle) * 35;
        const pillar = new THREE.Mesh(new THREE.BoxGeometry(4, 18, 4), stoneMat);
        pillar.position.set(x, 9, z);
        pillar.rotation.y = angle;
        root.add(pillar);

        // Glowing glyph ring
        const glyph = new THREE.Mesh(
          new THREE.RingGeometry(2.5, 3, 16),
          new THREE.MeshBasicMaterial({ color: 0x2bf88e, side: THREE.DoubleSide })
        );
        glyph.position.set(x, 14, z + 2.1);
        root.add(glyph);
      }

      // Pioneer 1 Drop Pod Initial Touchdown Site
      const podGroup = new THREE.Group();
      podGroup.position.set(0, 2, 45);

      const podBase = new THREE.Mesh(
        new THREE.CylinderGeometry(5, 7, 3, 16),
        new THREE.MeshStandardMaterial({ color: 0x1e3048, metalness: 0.8 })
      );
      podGroup.add(podBase);

      const podAntenna = new THREE.Mesh(
        new THREE.CylinderGeometry(0.2, 0.2, 8, 8),
        new THREE.MeshBasicMaterial({ color: 0x00f0ff })
      );
      podAntenna.position.y = 5;
      podGroup.add(podAntenna);
      root.add(podGroup);

      // Laser Security Fence Barrier
      const fenceMat = PsoShaders.createHologramMaterial(new THREE.Color(0x00f0ff), 0.7);
      const fenceMesh = new THREE.Mesh(new THREE.PlaneGeometry(16, 6), fenceMat);
      fenceMesh.position.set(35, 3, 10);
      root.add(fenceMesh);

    } else {
      // ==========================================
      // FOREST 2: Dragon Lair / Volcanic Caldera
      // ==========================================
      const rockMat = new THREE.MeshStandardMaterial({
        color: 0x241510,
        roughness: 0.95
      });

      // Crater Bowl Terrain
      const craterGeom = new THREE.CylinderGeometry(80, 50, 15, 48, 8, true);
      const craterMesh = new THREE.Mesh(craterGeom, rockMat);
      craterMesh.position.y = 7.5;
      root.add(craterMesh);

      // Scorched Arena Floor
      const arenaFloor = new THREE.Mesh(
        new THREE.CircleGeometry(50, 48),
        new THREE.MeshStandardMaterial({ color: 0x1c0f08, roughness: 0.9 })
      );
      arenaFloor.rotation.x = -Math.PI / 2;
      root.add(arenaFloor);

      // Bubbling Lava Core
      const lavaMesh = new THREE.Mesh(
        new THREE.CircleGeometry(26, 32),
        PsoShaders.createLavaMaterial()
      );
      lavaMesh.rotation.x = -Math.PI / 2;
      lavaMesh.position.set(0, 0.2, -15);
      root.add(lavaMesh);

      // Jagged Volcanic Spikes / Dragon Horn Fossils
      for (let i = 0; i < 14; i++) {
        const angle = (i * Math.PI * 2) / 14;
        const rad = 46;
        const spike = new THREE.Mesh(
          new THREE.ConeGeometry(3, 16, 6),
          rockMat
        );
        spike.position.set(Math.cos(angle) * rad, 8, Math.sin(angle) * rad);
        spike.rotation.z = Math.cos(angle) * 0.3;
        spike.rotation.x = -Math.sin(angle) * 0.3;
        root.add(spike);
      }
    }

    return root;
  }
}
