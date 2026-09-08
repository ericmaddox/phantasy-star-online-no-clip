import * as THREE from 'three';

export type CameraMode = 'fly' | 'orbit';

export class CameraController {
  public camera: THREE.PerspectiveCamera;
  public mode: CameraMode = 'fly';
  public speedMultiplier = 1.0;
  
  // Position & Rotation
  public position = new THREE.Vector3(0, 15, 60);
  public yaw = 0; // horizontal angle
  public pitch = -0.2; // vertical angle

  // Orbit mode parameters
  public orbitTarget = new THREE.Vector3(0, 0, 0);
  public orbitDistance = 50;

  // Movement keys
  private keys: { [key: string]: boolean } = {};
  private isMouseDown = false;
  private lastMouseX = 0;
  private lastMouseY = 0;

  // Smoothing
  private velocity = new THREE.Vector3();
  private targetPosition = new THREE.Vector3(0, 15, 60);
  private isInterpolating = false;
  private interpStartPos = new THREE.Vector3();
  private interpTargetPos = new THREE.Vector3();
  private interpStartRot = [0, 0];
  private interpTargetRot = [0, 0];
  private interpTime = 0;

  private domElement: HTMLElement;
  private onTelemetryUpdate?: (pos: THREE.Vector3, yaw: number, pitch: number, mode: CameraMode, speed: number) => void;

  constructor(camera: THREE.PerspectiveCamera, domElement: HTMLElement) {
    this.camera = camera;
    this.domElement = domElement;

    this.setupEvents();
  }

  public setTelemetryCallback(cb: (pos: THREE.Vector3, yaw: number, pitch: number, mode: CameraMode, speed: number) => void): void {
    this.onTelemetryUpdate = cb;
  }

  private setupEvents(): void {
    window.addEventListener('keydown', (e) => {
      this.keys[e.code] = true;
      if (e.code === 'KeyC') {
        this.setMode(this.mode === 'fly' ? 'orbit' : 'fly');
      }
    });

    window.addEventListener('keyup', (e) => {
      this.keys[e.code] = false;
    });

    this.domElement.addEventListener('mousedown', (e) => {
      this.isMouseDown = true;
      this.lastMouseX = e.clientX;
      this.lastMouseY = e.clientY;
    });

    window.addEventListener('mouseup', () => {
      this.isMouseDown = false;
    });

    window.addEventListener('mousemove', (e) => {
      if (!this.isMouseDown) return;

      const deltaX = e.clientX - this.lastMouseX;
      const deltaY = e.clientY - this.lastMouseY;
      this.lastMouseX = e.clientX;
      this.lastMouseY = e.clientY;

      const sensitivity = 0.003;
      this.yaw -= deltaX * sensitivity;
      this.pitch -= deltaY * sensitivity;

      // Clamp pitch to prevent gimbal flip
      this.pitch = Math.max(-Math.PI / 2 + 0.05, Math.min(Math.PI / 2 - 0.05, this.pitch));
    });

    // Mouse wheel adjustments for flight speed
    this.domElement.addEventListener('wheel', (e) => {
      e.preventDefault();
      if (e.deltaY < 0) {
        this.speedMultiplier = Math.min(5.0, this.speedMultiplier + 0.15);
      } else {
        this.speedMultiplier = Math.max(0.1, this.speedMultiplier - 0.15);
      }
    }, { passive: false });
  }

  public setMode(newMode: CameraMode): void {
    this.mode = newMode;
    if (newMode === 'orbit') {
      // Calculate orbit target from forward vector
      const forward = new THREE.Vector3(0, 0, -1).applyEuler(new THREE.Euler(this.pitch, this.yaw, 0, 'YXZ'));
      this.orbitTarget.copy(this.position).addScaledVector(forward, this.orbitDistance);
    }
  }

  public teleportTo(pos: [number, number, number], rot: [number, number], smooth = true): void {
    if (!smooth) {
      this.position.set(...pos);
      this.targetPosition.set(...pos);
      this.yaw = rot[0];
      this.pitch = rot[1];
      this.isInterpolating = false;
      return;
    }

    this.isInterpolating = true;
    this.interpTime = 0;
    this.interpStartPos.copy(this.position);
    this.interpTargetPos.set(...pos);
    this.interpStartRot = [this.yaw, this.pitch];
    this.interpTargetRot = [rot[0], rot[1]];
  }

  public update(delta: number): void {
    if (this.isInterpolating) {
      this.interpTime += delta * 2.0;
      const t = Math.min(1.0, this.interpTime);
      const ease = t * t * (3 - 2 * t); // smoothstep

      this.position.lerpVectors(this.interpStartPos, this.interpTargetPos, ease);
      this.yaw = THREE.MathUtils.lerp(this.interpStartRot[0], this.interpTargetRot[0], ease);
      this.pitch = THREE.MathUtils.lerp(this.interpStartRot[1], this.interpTargetRot[1], ease);

      if (t >= 1.0) {
        this.isInterpolating = false;
      }
    } else if (this.mode === 'fly') {
      // Noclip Free-fly physics
      const baseSpeed = 40.0 * this.speedMultiplier;
      const moveVec = new THREE.Vector3();

      if (this.keys['KeyW'] || this.keys['ArrowUp']) moveVec.z -= 1;
      if (this.keys['KeyS'] || this.keys['ArrowDown']) moveVec.z += 1;
      if (this.keys['KeyA'] || this.keys['ArrowLeft']) moveVec.x -= 1;
      if (this.keys['KeyD'] || this.keys['ArrowRight']) moveVec.x += 1;
      if (this.keys['Space'] || this.keys['KeyE']) moveVec.y += 1;
      if (this.keys['ShiftLeft'] || this.keys['ShiftRight'] || this.keys['KeyQ']) moveVec.y -= 1;

      if (moveVec.lengthSq() > 0) {
        moveVec.normalize();
        
        // Transform direction relative to yaw and pitch
        const rotEuler = new THREE.Euler(0, this.yaw, 0, 'YXZ');
        const forward = new THREE.Vector3(0, 0, moveVec.z).applyEuler(new THREE.Euler(this.pitch, this.yaw, 0, 'YXZ'));
        const strafe = new THREE.Vector3(moveVec.x, 0, 0).applyEuler(rotEuler);
        const vertical = new THREE.Vector3(0, moveVec.y, 0);

        const targetVel = forward.add(strafe).add(vertical).multiplyScalar(baseSpeed);
        this.velocity.lerp(targetVel, delta * 10);
      } else {
        this.velocity.lerp(new THREE.Vector3(0, 0, 0), delta * 12);
      }

      this.position.addScaledVector(this.velocity, delta);
    } else {
      // Orbit camera physics
      const x = this.orbitTarget.x + Math.sin(this.yaw) * Math.cos(this.pitch) * this.orbitDistance;
      const y = this.orbitTarget.y + Math.sin(-this.pitch) * this.orbitDistance;
      const z = this.orbitTarget.z + Math.cos(this.yaw) * Math.cos(this.pitch) * this.orbitDistance;
      this.position.set(x, y, z);
    }

    // Apply to Three.js camera
    this.camera.position.copy(this.position);
    this.camera.rotation.set(this.pitch, this.yaw, 0, 'YXZ');

    if (this.onTelemetryUpdate) {
      this.onTelemetryUpdate(this.position, this.yaw, this.pitch, this.mode, this.speedMultiplier);
    }
  }
}
