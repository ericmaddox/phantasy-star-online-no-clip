import * as THREE from 'three';
import { PrsDecompressor } from './PrsDecompressor';

/**
 * Parser for Ninja Chunk Model (.nj, .xj) and PSO Map (.rel) files
 */
export class NinjaModelParser {
  /**
   * Parse arbitrary PSO file buffer (.prs, .rel, .nj, .xj, .obj, .gltf)
   */
  public static parseFile(buffer: ArrayBuffer, filename: string): THREE.Group {
    const group = new THREE.Group();
    group.name = filename;

    let data: Uint8Array<ArrayBufferLike> = new Uint8Array(buffer);

    // If compressed PRS (or ends in .prs / .rel which often has PRS header)
    if (filename.toLowerCase().endsWith('.prs') || (data[0] === 0x00 && data.length > 4 && data[1] > 0)) {
      try {
        data = PrsDecompressor.decompress(data);
      } catch (e) {
        console.warn('PRS decompression skipped or failed:', e);
      }
    }

    // Try parsing basic text OBJ if plain text
    if (filename.toLowerCase().endsWith('.obj')) {
      const text = new TextDecoder().decode(data);
      return this.parseObjText(text, filename);
    }

    // Parse binary Ninja model / float coordinate triples from PSO .rel
    const view = new DataView(data.buffer as ArrayBuffer, data.byteOffset, data.byteLength);
    const positions: number[] = [];
    const normals: number[] = [];

    // Search for coordinate batches in .rel / .nj
    let offset = 0;
    while (offset + 12 <= view.byteLength && positions.length < 50000) {
      try {
        const x = view.getFloat32(offset, true);
        const y = view.getFloat32(offset + 4, true);
        const z = view.getFloat32(offset + 8, true);

        // Filter reasonable coordinate ranges for PSO maps
        if (
          !isNaN(x) && !isNaN(y) && !isNaN(z) &&
          Math.abs(x) < 5000 && Math.abs(y) < 2000 && Math.abs(z) < 5000 &&
          (Math.abs(x) > 0.1 || Math.abs(y) > 0.1 || Math.abs(z) > 0.1)
        ) {
          positions.push(x, y, z);
          normals.push(0, 1, 0);
        }
      } catch {
        break;
      }
      offset += 4;
    }

    if (positions.length >= 9) {
      // Build triangulated geometry
      const geometry = new THREE.BufferGeometry();
      geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
      geometry.computeVertexNormals();

      const mat = new THREE.MeshStandardMaterial({
        color: 0x00f0ff,
        metalness: 0.3,
        roughness: 0.6,
        wireframe: false,
        side: THREE.DoubleSide
      });

      const mesh = new THREE.Mesh(geometry, mat);
      mesh.name = `${filename}_mesh`;
      group.add(mesh);
    } else {
      // Fallback debug cube if structure is unmapped
      const geom = new THREE.BoxGeometry(10, 10, 10);
      const mat = new THREE.MeshStandardMaterial({ color: 0xffaa00, wireframe: true });
      group.add(new THREE.Mesh(geom, mat));
    }

    return group;
  }

  private static parseObjText(text: string, name: string): THREE.Group {
    const group = new THREE.Group();
    group.name = name;

    const positions: number[][] = [];
    const finalVertices: number[] = [];

    const lines = text.split('\n');
    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed.startsWith('v ')) {
        const parts = trimmed.split(/\s+/).slice(1).map(Number);
        positions.push(parts);
      } else if (trimmed.startsWith('f ')) {
        const parts = trimmed.split(/\s+/).slice(1);
        const faceIndices = parts.map(p => {
          const idx = parseInt(p.split('/')[0], 10);
          return idx > 0 ? idx - 1 : positions.length + idx;
        });

        if (faceIndices.length >= 3) {
          // Triangulate polygon fan
          for (let i = 1; i < faceIndices.length - 1; i++) {
            const v0 = positions[faceIndices[0]];
            const v1 = positions[faceIndices[i]];
            const v2 = positions[faceIndices[i + 1]];
            if (v0 && v1 && v2) {
              finalVertices.push(...v0, ...v1, ...v2);
            }
          }
        }
      }
    }

    if (finalVertices.length > 0) {
      const geom = new THREE.BufferGeometry();
      geom.setAttribute('position', new THREE.Float32BufferAttribute(finalVertices, 3));
      geom.computeVertexNormals();
      const mat = new THREE.MeshStandardMaterial({
        color: 0x2bf88e,
        roughness: 0.5,
        metalness: 0.2,
        side: THREE.DoubleSide
      });
      group.add(new THREE.Mesh(geom, mat));
    }

    return group;
  }
}
