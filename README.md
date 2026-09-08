# Phantasy Star Online 3D World Explorer (Noclip)

An interactive, web-based 3D map explorer for *Phantasy Star Online* (Blue Burst, Dreamcast, and GameCube) built with WebGL and Three.js. The application allows users to freely inspect and fly through authentic game stages, environments, lobbies, and boss arenas rendered directly from original client binary archives.

---

## Overview

Inspired by open-source map viewers such as [noclip.website](https://noclip.website/), this project provides full 6-DOF collisionless flight and orbit camera controls across all major environments of *Phantasy Star Online*.

Geometry, vertex streams, material parameters, and textures are extracted directly from official client binary formats (`.rel`, `.xvm`, `data.gsl`), ensuring 100% faithful preservation of level layouts, uv coordinates, surface properties, and ambient lighting.

---

## Key Features

- **Full 6-DOF Noclip Camera Navigation**:
  - Smooth acceleration, deceleration, and high-precision mouselook.
  - Variable speed scaling via mouse wheel (0.1x to 10.0x).
  - Dual camera modes: 6-DOF Fly (Noclip) and Orbit Inspection.
- **Authentic Asset Pipeline**:
  - Complete reverse-engineered parser for PSO Blue Burst `.rel` section tables and Ninja node hierarchies.
  - Native texture decompression for DirectDraw Surface formats (DXT1, DXT3, DXT5, RGB565, ARGB4444).
  - Material and shader binding matching original texture IDs to OBJ/MTL archives.
- **Comprehensive Stage Library**:
  - **Colony Ship & Lobbies**: Pioneer II City, Visual Ship Lobby, Festive Cherry Blossom Lobby, Pioneer II Principal's Office, Hunter's Guild, Lab.
  - **Episode I (Ragol Surface & Subterranean)**: Forest 1 & 2, Caves 1-3, Mines 1 & 2, Ruins 1 & 2.
  - **Episode II (Gal Da Val & VR)**: VR Temple, VR Spaceship, Central Control Area (Jungle / Mountain / Seaside), Seabed Facility.
  - **Episode IV (Impact Crater & Sub-Desert)**: Crater Interior, Subterranean Desert.
  - **Boss Arenas**: Dragon, De Rol Le, Vol Opt, Dark Falz, Gal Gryphon, Olga Flow, Saint-Million.
- **Telemetry and Layer Controls**:
  - Real-time HUD displaying camera coordinates (X, Y, Z), Euler orientation (Yaw, Pitch), speed, and mode.
  - Point-of-Interest (POI) teleportation system.
  - Toggleable environment layers (Fog atmosphere, Lighting, Wireframe overlay).
  - Dynamic URL state persistence for deep-linking exact map coordinates and viewpoints.
- **Audio Atmosphere**:
  - Integrated ambient synthesizer and background music streams for Pioneer II, Forest, Caves, Mines, Ruins, and Lobby.

---

## Technical Architecture

### Frontend Engine
- **Core Library**: Three.js (WebGL 2.0)
- **Language**: TypeScript
- **Bundler & Dev Server**: Vite
- **UI Architecture**: Glassmorphic HUD overlay, Vanilla CSS design tokens, Lucide vector icons.

### Binary Parsing & Asset Extraction (`scripts/`)
- **Stage Format (`.rel`)**:
  - Decodes table footers (`fmt2` at `table_ofs - 16`) and 52-byte section descriptors.
  - Traverses hierarchical node trees (`readNode`) with 4x4 matrix transforms (`DashMat4`).
  - Unpacks vertex chunk streams (coordinates, normals, vertex color BGRA, float UV pairs) and triangle strips.
- **Texture Archives (`.xvm`)**:
  - Reads `XVMH` container headers and `XVRT` texture payloads.
  - Pure Python decompressor for DXT1 block color interpolation, DXT3 explicit 4-bit alpha, and DXT5 8-alpha interpolation.

---

## Project Structure

```text
├── public/
│   ├── assets/              # Web icons, UI assets, audio
│   └── models/
│       ├── textures/        # Extracted authentic stage PNG textures (2,600+ files)
│       └── zones/           # Generated OBJ & MTL stage geometry definitions
├── scripts/
│   └── extract_all_authentic_stages_full.py   # Full client binary extraction pipeline
├── src/
│   ├── core/
│   │   ├── CameraController.ts   # 6-DOF noclip physics & input handling
│   │   ├── Engine.ts             # WebGL renderer, loop, scene, lighting
│   │   └── StateManager.ts       # URL hash state serialization & deserialization
│   ├── formats/
│   │   └── NinjaModelParser.ts   # Client-side binary format parsing utilities
│   ├── ui/
│   │   └── AudioPlayer.ts        # Audio playback & spatial sound manager
│   ├── worlds/
│   │   ├── WorldLoader.ts        # Async OBJ/MTL loader & material binding
│   │   └── WorldRegistry.ts      # Stage catalog, POIs, fog, and atmospheric settings
│   ├── main.ts                   # Application lifecycle & UI event bindings
│   └── style.css                 # HUD stylesheet and glassmorphism design system
├── index.html                    # Single-page application entry point
├── package.json
├── tsconfig.json
└── vite.config.ts
```

---

## Getting Started

### Prerequisites
- Node.js (v18.0.0 or later)
- npm (v9.0.0 or later)
- Python 3.10+ (only required if re-running the extraction toolchain)
- Pillow (`pip install Pillow`, for texture generation)

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/ericmaddox/phantasy-star-online-no-clip.git
   cd phantasy-star-online-no-clip
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the local development server:
   ```bash
   npm run dev
   ```

4. Open your browser and navigate to `http://localhost:5173/`.

### Production Build

To compile a production bundle:
```bash
npm run build
```
The compiled static assets will be output to the `dist/` directory, suitable for deployment on any static web host (GitHub Pages, Vercel, Netlify, Cloudflare Pages).

---

## Controls

| Action | Input |
|---|---|
| Move Forward / Left / Back / Right | `W` / `A` / `S` / `D` |
| Move Up (Ascend) | `Space` |
| Move Down (Descend) | `Shift` |
| Look Around (Pitch / Yaw) | `Right-Click` + Drag / Pointer Lock |
| Adjust Movement Speed | `Mouse Scroll Wheel` |
| Toggle Camera Mode (Fly / Orbit) | `C` |
| Toggle Zone Selection Drawer | `M` |
| Reset Camera to Default | `R` |

---

## Asset Extraction Pipeline

If modifying the Python extractor or adding additional custom stages:

```bash
python scripts/extract_all_authentic_stages_full.py
```

The script performs the following operations:
1. Scans `pso_raw_data/data/scene/` for `.rel` stage descriptors and `.xvm` texture archives.
2. Unpacks all compressed texture blocks into `public/models/textures/*.png`.
3. Decodes geometry chunks, strips, and node matrices into standard `.obj` and `.mtl` files placed in `public/models/zones/`.

---

## Legal & Disclaimers

*Phantasy Star Online* is a registered trademark of SEGA Corporation. This project is a non-commercial educational and research tool created for preservation and historical analysis of early 2000s 3D level design and graphics formats. All game assets remain the property of SEGA Corporation.
