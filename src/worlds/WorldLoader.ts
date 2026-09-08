import * as THREE from 'three';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js';
import { MTLLoader } from 'three/examples/jsm/loaders/MTLLoader.js';
import { ZoneDefinition, WORLD_REGISTRY } from './WorldRegistry';

export class WorldLoader {
  private scene: THREE.Scene;
  private currentWorldGroup: THREE.Group | null = null;
  private currentBoundingBox: THREE.Box3 | null = null;
  private ambientLight: THREE.AmbientLight;
  private dirLight: THREE.DirectionalLight;
  private currentZoneDef: ZoneDefinition | null = null;
  private activeLoadingId = 0;
  private onLoadedCallback?: (zoneDef: ZoneDefinition, vertexCount: number, box: THREE.Box3) => void;
  private raycaster = new THREE.Raycaster();

  constructor(scene: THREE.Scene) {
    this.scene = scene;

    this.ambientLight = new THREE.AmbientLight(0xffffff, 1.4);
    this.ambientLight.name = 'AmbientLight';
    this.scene.add(this.ambientLight);

    this.dirLight = new THREE.DirectionalLight(0xffffff, 1.8);
    this.dirLight.name = 'SunLight';
    this.dirLight.position.set(50, 120, 50);
    this.scene.add(this.dirLight);
  }

  public getCurrentWorldGroup(): THREE.Group | null {
    return this.currentWorldGroup;
  }

  public getCurrentBoundingBox(): THREE.Box3 | null {
    return this.currentBoundingBox;
  }

  public setOnLoadedCallback(cb: (zoneDef: ZoneDefinition, vertexCount: number, box: THREE.Box3) => void): void {
    this.onLoadedCallback = cb;
  }

  public loadZone(zoneId: string): ZoneDefinition {
    const def = WORLD_REGISTRY.find(z => z.id === zoneId) || WORLD_REGISTRY[0];
    this.currentZoneDef = def;

    // Clean up previous world geometry
    if (this.currentWorldGroup) {
      this.scene.remove(this.currentWorldGroup);
      this.disposeHierarchy(this.currentWorldGroup);
      this.currentWorldGroup = null;
      this.currentBoundingBox = null;
    }

    // Set atmosphere / fog / lighting
    this.scene.background = new THREE.Color(def.bgColor);
    this.scene.fog = new THREE.Fog(def.fogColor, def.fogNear, def.fogFar);

    this.ambientLight.color.setHex(def.ambientLight);
    this.dirLight.color.setHex(def.sunColor);
    this.dirLight.position.set(...def.sunPos);

    // Create a clean root group for the authentic stage
    const group = new THREE.Group();
    group.name = `zone_${def.id}`;
    this.currentWorldGroup = group;
    this.scene.add(group);

    // Increment loading transaction ID to prevent race conditions on fast zone switches
    const loadingId = ++this.activeLoadingId;

    // Load authentic stage OBJ/MTL directly
    this.loadAuthenticStage(def, group, loadingId);

    return def;
  }

  private loadAuthenticStage(def: ZoneDefinition, targetGroup: THREE.Group, loadingId: number): void {
    const zoneId = def.id;
    const mtlLoader = new MTLLoader();
    mtlLoader.setPath('/models/zones/');
    const mtlFile = `${zoneId}.mtl`;
    const objFile = `${zoneId}.obj`;

    mtlLoader.load(
      mtlFile,
      (materialsCreator) => {
        if (loadingId !== this.activeLoadingId) return;

        materialsCreator.preload();

        // Configure authentic texture mapping & surface properties
        Object.values(materialsCreator.materials).forEach((mat) => {
          mat.side = THREE.DoubleSide;
          mat.depthWrite = true;
          mat.depthTest = true;

          if (mat instanceof THREE.MeshPhongMaterial || (mat as any).isMeshPhongMaterial) {
            const phong = mat as THREE.MeshPhongMaterial;
            phong.shininess = 20;
            phong.specular = new THREE.Color(0x222222);

            // Essential fix: Opaque stage meshes MUST NOT be marked transparent!
            // Marking opaque meshes transparent breaks per-pixel Z-buffer occlusion.
            phong.transparent = false;

            if (phong.map) {
              phong.map.colorSpace = THREE.SRGBColorSpace;
              phong.map.minFilter = THREE.LinearMipmapLinearFilter;
              phong.map.magFilter = THREE.LinearFilter;
              phong.map.wrapS = THREE.RepeatWrapping;
              phong.map.wrapT = THREE.RepeatWrapping;

              // Alpha cutoff for foliage, railings, grates, laser bars, fences
              phong.alphaTest = 0.25;
            }
          }
        });

        const objLoader = new OBJLoader();
        objLoader.setMaterials(materialsCreator);
        objLoader.setPath('/models/zones/');

        objLoader.load(
          objFile,
          (loadedGroup) => {
            if (loadingId !== this.activeLoadingId) return;

            let vertexCount = 0;
            loadedGroup.traverse((child) => {
              if ((child as THREE.Mesh).isMesh) {
                const mesh = child as THREE.Mesh;
                mesh.castShadow = true;
                mesh.receiveShadow = true;

                if (mesh.material) {
                  const mats = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
                  mats.forEach(m => {
                    m.side = THREE.DoubleSide;
                    m.depthWrite = true;
                    m.depthTest = true;
                    if (m instanceof THREE.MeshPhongMaterial && m.map) {
                      m.map.colorSpace = THREE.SRGBColorSpace;
                      m.alphaTest = 0.25;
                    }
                  });
                }

                if (mesh.geometry) {
                  if (!mesh.geometry.attributes.normal) {
                    mesh.geometry.computeVertexNormals();
                  }
                  vertexCount += mesh.geometry.attributes.position ? mesh.geometry.attributes.position.count : 0;
                }
              }
            });

            loadedGroup.name = `authentic_${zoneId}`;
            targetGroup.add(loadedGroup);

            const box = new THREE.Box3().setFromObject(loadedGroup);
            this.currentBoundingBox = box;
            console.log(`[PSO] Loaded authentic game asset: ${zoneId} (${vertexCount.toLocaleString()} vertices)`, box);

            if (this.onLoadedCallback) {
              this.onLoadedCallback(def, vertexCount, box);
            }
          },
          undefined,
          (err) => {
            console.error(`[PSO] Error loading authentic OBJ for ${zoneId}:`, err);
          }
        );
      },
      undefined,
      (err) => {
        if (loadingId !== this.activeLoadingId) return;
        console.warn(`[PSO] MTL not found for ${zoneId}, loading raw OBJ geometry...`, err);

        const objLoader = new OBJLoader();
        objLoader.load(
          `/models/zones/${objFile}`,
          (loadedGroup) => {
            if (loadingId !== this.activeLoadingId) return;

            let vertexCount = 0;
            loadedGroup.traverse((child) => {
              if ((child as THREE.Mesh).isMesh) {
                const mesh = child as THREE.Mesh;
                mesh.castShadow = true;
                mesh.receiveShadow = true;
                if (!mesh.material) {
                  mesh.material = new THREE.MeshStandardMaterial({
                    color: 0x88bbdd,
                    roughness: 0.6,
                    metalness: 0.2,
                    side: THREE.DoubleSide
                  });
                }
                if (mesh.geometry) {
                  if (!mesh.geometry.attributes.normal) {
                    mesh.geometry.computeVertexNormals();
                  }
                  vertexCount += mesh.geometry.attributes.position ? mesh.geometry.attributes.position.count : 0;
                }
              }
            });

            loadedGroup.name = `authentic_${zoneId}`;
            targetGroup.add(loadedGroup);

            const box = new THREE.Box3().setFromObject(loadedGroup);
            this.currentBoundingBox = box;
            if (this.onLoadedCallback) {
              this.onLoadedCallback(def, vertexCount, box);
            }
          },
          undefined,
          (objErr) => {
            console.error(`[PSO] Failed to load authentic model for ${zoneId}:`, objErr);
          }
        );
      }
    );
  }

  /**
   * Find the highest walkable floor height directly beneath (x, z)
   */
  public findFloorHeight(x: number, z: number, startY?: number): number | null {
    if (!this.currentWorldGroup) return null;

    const startHeight = startY ?? (this.currentBoundingBox ? this.currentBoundingBox.max.y + 100 : 500);
    const origin = new THREE.Vector3(x, startHeight, z);
    const direction = new THREE.Vector3(0, -1, 0);

    this.raycaster.set(origin, direction);
    this.raycaster.near = 0.1;
    this.raycaster.far = 10000;

    const intersects = this.raycaster.intersectObjects(this.currentWorldGroup.children, true);
    if (intersects.length > 0) {
      // Find the highest intersection point that is below startHeight
      for (const hit of intersects) {
        if (hit.point.y <= startHeight) {
          return hit.point.y;
        }
      }
      return intersects[0].point.y;
    }

    return null;
  }

  /**
   * Calculates a safe standing eye-level position above the floor, avoiding spawning under geometry.
   */
  public getSafeSpawnPosition(desiredPos: [number, number, number]): [number, number, number] {
    const floorY = this.findFloorHeight(desiredPos[0], desiredPos[2], desiredPos[1] + 150);
    if (floorY !== null) {
      const eyeHeight = 10.0;
      // Position camera safely at player eye-height above the actual floor polygon
      return [desiredPos[0], floorY + eyeHeight, desiredPos[2]];
    }

    // Fallback: If position missed geometry completely, check bounding box
    if (this.currentBoundingBox && !this.currentBoundingBox.isEmpty()) {
      const center = this.currentBoundingBox.getCenter(new THREE.Vector3());
      const min = this.currentBoundingBox.min;
      const centerFloor = this.findFloorHeight(center.x, center.z);
      if (centerFloor !== null) {
        return [center.x, centerFloor + 15, center.z + 40];
      }
      return [center.x, min.y + 20, center.z + 50];
    }

    return desiredPos;
  }

  public loadCustomGroup(group: THREE.Group, name: string): void {
    if (this.currentWorldGroup) {
      this.scene.remove(this.currentWorldGroup);
      this.disposeHierarchy(this.currentWorldGroup);
    }
    this.currentWorldGroup = group;
    this.currentBoundingBox = new THREE.Box3().setFromObject(group);
    this.scene.add(group);

    const center = this.currentBoundingBox.getCenter(new THREE.Vector3());
    console.log(`[PSO] Loaded custom user map ${name} at:`, center);
  }

  public update(time: number): void {
    if (this.currentWorldGroup) {
      this.currentWorldGroup.traverse(obj => {
        if (obj instanceof THREE.Mesh && obj.material) {
          const mat = obj.material as THREE.ShaderMaterial;
          if (mat.uniforms && mat.uniforms.uTime) {
            mat.uniforms.uTime.value = time;
          }
        }
      });
    }
  }

  public setLayerVisibility(layer: string, visible: boolean): void {
    if (!this.currentWorldGroup) return;

    if (layer === 'fog') {
      if (!visible) {
        this.scene.fog = null;
      } else if (this.currentZoneDef) {
        this.scene.fog = new THREE.Fog(
          this.currentZoneDef.fogColor,
          this.currentZoneDef.fogNear,
          this.currentZoneDef.fogFar
        );
      }
      return;
    }

    if (layer === 'wireframe') {
      this.currentWorldGroup.traverse(obj => {
        if (obj instanceof THREE.Mesh && obj.material) {
          if (Array.isArray(obj.material)) {
            obj.material.forEach(m => (m.wireframe = visible));
          } else {
            obj.material.wireframe = visible;
          }
        }
      });
      return;
    }
  }

  public setLightIntensity(factor: number): void {
    this.ambientLight.intensity = 1.4 * factor;
    this.dirLight.intensity = 1.8 * factor;
  }

  private disposeHierarchy(obj: THREE.Object3D): void {
    obj.traverse(child => {
      if (child instanceof THREE.Mesh) {
        if (child.geometry) child.geometry.dispose();
        if (child.material) {
          if (Array.isArray(child.material)) {
            child.material.forEach(m => {
              if (m.map) m.map.dispose();
              m.dispose();
            });
          } else {
            if (child.material.map) child.material.map.dispose();
            child.material.dispose();
          }
        }
      }
    });
  }
}
