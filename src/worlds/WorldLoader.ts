import * as THREE from 'three';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js';
import { MTLLoader } from 'three/examples/jsm/loaders/MTLLoader.js';
import { ZoneDefinition, WORLD_REGISTRY } from './WorldRegistry';
import { PioneerCityBuilder } from './generators/PioneerCity';
import { VisualLobbyBuilder } from './generators/VisualLobby';
import { ForestBuilder } from './generators/Forest';
import { CavesBuilder } from './generators/Caves';
import { MinesBuilder } from './generators/Mines';
import { RuinsBuilder } from './generators/Ruins';
import { Episode2Builder } from './generators/Episode2VR';
import { Episode4Builder } from './generators/Episode4Crater';

export class WorldLoader {
  private scene: THREE.Scene;
  private currentWorldGroup: THREE.Group | null = null;
  private particleSystem: THREE.Points | null = null;
  private ambientLight: THREE.AmbientLight;
  private dirLight: THREE.DirectionalLight;
  private currentZoneDef: ZoneDefinition | null = null;

  constructor(scene: THREE.Scene) {
    this.scene = scene;

    this.ambientLight = new THREE.AmbientLight(0xffffff, 1.0);
    this.ambientLight.name = 'AmbientLight';
    this.scene.add(this.ambientLight);

    this.dirLight = new THREE.DirectionalLight(0xffffff, 1.4);
    this.dirLight.name = 'SunLight';
    this.dirLight.position.set(50, 100, 50);
    this.scene.add(this.dirLight);
  }

  public loadZone(zoneId: string): ZoneDefinition {
    const def = WORLD_REGISTRY.find(z => z.id === zoneId) || WORLD_REGISTRY[0];
    this.currentZoneDef = def;

    // Clean up previous world
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

    // Build specific world geometry
    let group: THREE.Group;
    switch (def.id) {
      case 'pioneer2-city':
        group = PioneerCityBuilder.build();
        break;
      case 'visual-lobby':
        group = VisualLobbyBuilder.build(false);
        break;
      case 'visual-lobby-festive':
        group = VisualLobbyBuilder.build(true);
        break;
      case 'forest-01':
        group = ForestBuilder.build(false);
        break;
      case 'forest-02':
        group = ForestBuilder.build(true);
        break;
      case 'caves-01':
        group = CavesBuilder.build(false);
        break;
      case 'caves-derolle':
        group = CavesBuilder.build(true);
        break;
      case 'mines-01':
        group = MinesBuilder.build();
        break;
      case 'ruins-01':
        group = RuinsBuilder.build();
        break;
      case 'pioneer2-lab':
        group = Episode2Builder.buildLab();
        break;
      case 'vr-temple':
        group = Episode2Builder.buildVR(false);
        break;
      case 'vr-spaceship':
        group = Episode2Builder.buildVR(true);
        break;
      case 'cca-jungle-mountain':
        group = Episode2Builder.buildCCA();
        break;
      case 'seabed-01':
        group = Episode2Builder.buildSeabed();
        break;
      case 'crater-interior':
        group = Episode4Builder.buildCrater();
        break;
      case 'subterranean-desert':
        group = Episode4Builder.buildDesert();
        break;
      default:
        group = PioneerCityBuilder.build();
    }

    this.currentWorldGroup = group;
    this.scene.add(group);

    // Asynchronously try loading extracted authentic map model with materials & textures
    this.loadAuthenticZoneModel(def.id, group);

    return def;
  }

  private async loadAuthenticZoneModel(zoneId: string, baseGroup: THREE.Group): Promise<void> {
    try {
      const mtlLoader = new MTLLoader();
      mtlLoader.setPath('/models/zones/');
      const mtlFile = `${zoneId}.mtl`;
      const objFile = `${zoneId}.obj`;

      mtlLoader.load(
        mtlFile,
        (materialsCreator) => {
          materialsCreator.preload();

          // Optimize texture mapping & material settings
          Object.values(materialsCreator.materials).forEach((mat) => {
            mat.side = THREE.DoubleSide;
            if (mat instanceof THREE.MeshPhongMaterial || (mat as any).isMeshPhongMaterial) {
              const phong = mat as THREE.MeshPhongMaterial;
              phong.shininess = 20;
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

              // Remove placeholder geometry
              const toRemove: THREE.Object3D[] = [];
              baseGroup.children.forEach((child) => {
                if (child.name !== 'PhotonParticles' && !child.name.includes('warp') && !child.name.includes('portal')) {
                  toRemove.push(child);
                }
              });
              toRemove.forEach((c) => baseGroup.remove(c));

              baseGroup.add(loadedGroup);
              console.log(`[PSO] Rendered 100% authentic game map: ${zoneId} (${vertexCount.toLocaleString()} vertices)`);
            },
            undefined,
            (err) => {
              console.log(`[PSO] Authentic OBJ loading deferred for ${zoneId}:`, err);
            }
          );
        },
        undefined,
        (err) => {
          // Fallback to plain OBJ loader if MTL is absent
          const objLoader = new OBJLoader();
          objLoader.load(
            `/models/zones/${objFile}`,
            (loadedGroup) => {
              loadedGroup.name = `authentic_${zoneId}`;
              baseGroup.add(loadedGroup);
            },
            undefined,
            () => console.log(`[PSO] No authentic model found for ${zoneId}, procedural fallback active`)
          );
        }
      );
    } catch (e) {
      console.warn('Could not load authentic model, fallback active:', e);
    }
  }

  public loadCustomGroup(group: THREE.Group, name: string): void {
    if (this.currentWorldGroup) {
      this.scene.remove(this.currentWorldGroup);
      this.disposeHierarchy(this.currentWorldGroup);
    }
    this.currentWorldGroup = group;
    this.scene.add(group);

    // Center camera on custom model bounds
    const box = new THREE.Box3().setFromObject(group);
    const center = box.getCenter(new THREE.Vector3());
    console.log(`Loaded custom map ${name} at center:`, center);
  }

  public update(time: number): void {
    // Animate shader uniforms across current world
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

    if (layer === 'particles') {
      if (this.particleSystem) this.particleSystem.visible = visible;
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

    // Traverse mesh names / properties
    this.currentWorldGroup.traverse(obj => {
      if (layer === 'props' && (obj.name.includes('box') || obj.name.includes('desk') || obj.name.includes('chair') || obj.name.includes('ball'))) {
        obj.visible = visible;
      } else if (layer === 'water' && (obj.name.toLowerCase().includes('water') || obj.name.toLowerCase().includes('lava') || obj.name.toLowerCase().includes('ocean'))) {
        obj.visible = visible;
      } else if (layer === 'portals' && (obj.name.toLowerCase().includes('warp') || obj.name.toLowerCase().includes('teleport'))) {
        obj.visible = visible;
      }
    });
  }

  public setLightIntensity(factor: number): void {
    this.ambientLight.intensity = 0.8 * factor;
    this.dirLight.intensity = 1.2 * factor;
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
