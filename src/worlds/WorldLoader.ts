import * as THREE from 'three';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js';
import { MTLLoader } from 'three/examples/jsm/loaders/MTLLoader.js';
import { ZoneDefinition, WORLD_REGISTRY } from './WorldRegistry';

export class WorldLoader {
  private scene: THREE.Scene;
  private currentWorldGroup: THREE.Group | null = null;
  private ambientLight: THREE.AmbientLight;
  private dirLight: THREE.DirectionalLight;
  private currentZoneDef: ZoneDefinition | null = null;
  private activeLoadingId = 0;

  constructor(scene: THREE.Scene) {
    this.scene = scene;

    this.ambientLight = new THREE.AmbientLight(0xffffff, 1.2);
    this.ambientLight.name = 'AmbientLight';
    this.scene.add(this.ambientLight);

    this.dirLight = new THREE.DirectionalLight(0xffffff, 1.5);
    this.dirLight.name = 'SunLight';
    this.dirLight.position.set(50, 100, 50);
    this.scene.add(this.dirLight);
  }

  public loadZone(zoneId: string): ZoneDefinition {
    const def = WORLD_REGISTRY.find(z => z.id === zoneId) || WORLD_REGISTRY[0];
    this.currentZoneDef = def;

    // Clean up previous world geometry
    if (this.currentWorldGroup) {
      this.scene.remove(this.currentWorldGroup);
      this.disposeHierarchy(this.currentWorldGroup);
      this.currentWorldGroup = null;
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
    this.loadAuthenticStage(def.id, group, loadingId);

    return def;
  }

  private loadAuthenticStage(zoneId: string, targetGroup: THREE.Group, loadingId: number): void {
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
          if (mat instanceof THREE.MeshPhongMaterial || (mat as any).isMeshPhongMaterial) {
            const phong = mat as THREE.MeshPhongMaterial;
            phong.shininess = 15;
            if (phong.map) {
              phong.map.minFilter = THREE.LinearMipmapLinearFilter;
              phong.map.magFilter = THREE.LinearFilter;
              phong.map.wrapS = THREE.RepeatWrapping;
              phong.map.wrapT = THREE.RepeatWrapping;
              phong.transparent = true;
              phong.alphaTest = 0.05;
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
            console.log(`[PSO] Loaded authentic game asset: ${zoneId} (${vertexCount.toLocaleString()} vertices)`);
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
            loadedGroup.name = `authentic_${zoneId}`;
            targetGroup.add(loadedGroup);
          },
          undefined,
          (objErr) => {
            console.error(`[PSO] Failed to load authentic model for ${zoneId}:`, objErr);
          }
        );
      }
    );
  }

  public loadCustomGroup(group: THREE.Group, name: string): void {
    if (this.currentWorldGroup) {
      this.scene.remove(this.currentWorldGroup);
      this.disposeHierarchy(this.currentWorldGroup);
    }
    this.currentWorldGroup = group;
    this.scene.add(group);

    const box = new THREE.Box3().setFromObject(group);
    const center = box.getCenter(new THREE.Vector3());
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
    this.ambientLight.intensity = 1.0 * factor;
    this.dirLight.intensity = 1.4 * factor;
  }

  private disposeHierarchy(obj: THREE.Object3D): void {
    obj.traverse(child => {
      if (child instanceof THREE.Mesh) {
        if (child.geometry) child.geometry.dispose();
        if (child.material) {
          if (Array.isArray(child.material)) {
            child.material.forEach(m => m.dispose());
          } else {
            child.material.dispose();
          }
        }
      }
    });
  }
}
