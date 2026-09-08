export interface POI {
  id: string;
  name: string;
  description: string;
  position: [number, number, number];
  rotation: [number, number]; // [yaw, pitch] in radians
}

export interface ZoneDefinition {
  id: string;
  name: string;
  episode: 'ep1' | 'ep2' | 'ep4' | 'lobby';
  subArea: string;
  description: string;
  defaultPos: [number, number, number];
  defaultRot: [number, number];
  fogColor: number;
  fogNear: number;
  fogFar: number;
  bgColor: number;
  ambientLight: number;
  sunColor: number;
  sunPos: [number, number, number];
  pois: POI[];
}

export const WORLD_REGISTRY: ZoneDefinition[] = [
  // ==========================================
  // PIONEER II & LOBBIES
  // ==========================================
  {
    id: 'pioneer2-city',
    name: 'Pioneer II - City',
    episode: 'ep1',
    subArea: 'Pioneer II Colony Ship',
    description: 'The main civilian and hunter hub aboard the colony ship Pioneer II, overlooking Planet Ragol.',
    defaultPos: [0, 15, 60],
    defaultRot: [0, -0.2],
    fogColor: 0x0a1c36,
    fogNear: 250,
    fogFar: 1800,
    bgColor: 0x050c18,
    ambientLight: 0x88ccff,
    sunColor: 0x00f0ff,
    sunPos: [50, 100, 50],
    pois: [
      { id: 'spawn', name: 'Central Plaza', description: 'Central teleportation concourse', position: [0, 6, 35], rotation: [0, -0.1] },
      { id: 'principal', name: "Principal's Office", description: 'Executive command desk & council chamber', position: [0, 18, -40], rotation: [Math.PI, -0.1] },
      { id: 'guild', name: "Hunter's Guild", description: 'Quest board and guild counter', position: [-38, 7, 5], rotation: [Math.PI / 2, -0.1] },
      { id: 'shops', name: 'Shopping District', description: 'Weapon, Armor, and Item vendors', position: [38, 7, 5], rotation: [-Math.PI / 2, -0.1] },
      { id: 'teleporter', name: 'Ragol Beam Teleporter', description: 'Planetary surface transit portal', position: [0, 6, -10], rotation: [0, -0.2] },
      { id: 'dome_window', name: 'Observation Dome', description: 'Panoramic vista overlooking Planet Ragol', position: [0, 28, 80], rotation: [0, 0.1] }
    ]
  },
  {
    id: 'visual-lobby',
    name: 'Visual Ship Lobby',
    episode: 'lobby',
    subArea: 'Pioneer II Ship Deck',
    description: 'The multiplayer meeting hall featuring interactive terminals, warp portals, and soccer arena.',
    defaultPos: [0, 20, 55],
    defaultRot: [0, -0.3],
    fogColor: 0x061426,
    fogNear: 70,
    fogFar: 300,
    bgColor: 0x030812,
    ambientLight: 0x66aacc,
    sunColor: 0x00ffff,
    sunPos: [0, 80, 0],
    pois: [
      { id: 'center', name: 'Lobby Center', description: 'Central photon ring & hologram spire', position: [0, 5, 0], rotation: [0, 0] },
      { id: 'soccer', name: 'Soccer Pitch', description: 'Interactive photon ball field', position: [0, 5, 38], rotation: [Math.PI, 0] },
      { id: 'counter', name: 'Ship Counter', description: 'Information desk and team registrar', position: [0, 8, -45], rotation: [0, 0] },
      { id: 'balcony', name: 'Mezzanine Balcony', description: 'Upper catwalk overlooking the whole lobby', position: [35, 22, 0], rotation: [-Math.PI / 2, -0.2] }
    ]
  },
  {
    id: 'visual-lobby-festive',
    name: 'Festive Cherry Blossom Lobby',
    episode: 'lobby',
    subArea: 'Pioneer II Ship Deck (Seasonal)',
    description: 'Seasonal Japanese spring variation with glowing sakura cherry blossom trees and floating petals.',
    defaultPos: [0, 18, 50],
    defaultRot: [0, -0.25],
    fogColor: 0x220c1e,
    fogNear: 60,
    fogFar: 280,
    bgColor: 0x12040e,
    ambientLight: 0xffaacc,
    sunColor: 0xff66bb,
    sunPos: [20, 70, 20],
    pois: [
      { id: 'sakura_tree', name: 'Grand Sakura Tree', description: 'Giant illuminated cherry blossom tree', position: [0, 8, 0], rotation: [0, -0.1] },
      { id: 'bridge', name: 'Moon Bridge', description: 'Traditional arched bridge over photon stream', position: [0, 12, 30], rotation: [Math.PI, -0.15] }
    ]
  },

  // ==========================================
  // EPISODE I: RAGOL
  // ==========================================
  {
    id: 'forest-01',
    name: 'Forest 1',
    episode: 'ep1',
    subArea: 'Surface Level 1',
    description: 'The lush surface of Planet Ragol with giant flora, ancient ruins, and tranquil waterfalls.',
    defaultPos: [0, 25, 75],
    defaultRot: [0, -0.2],
    fogColor: 0x0b2416,
    fogNear: 60,
    fogFar: 320,
    bgColor: 0x05140b,
    ambientLight: 0x77cc88,
    sunColor: 0xeeffaa,
    sunPos: [80, 120, 60],
    pois: [
      { id: 'drop_pod', name: 'Drop Pod Landing', description: 'Hunter initial touchdown zone', position: [0, 8, 45], rotation: [0, 0] },
      { id: 'waterfall', name: 'Twin Waterfalls', description: 'Flowing river basin with ancient archways', position: [-40, 10, -20], rotation: [Math.PI / 3, -0.1] },
      { id: 'monument', name: 'Central Monolith', description: 'Ancient alien stone relic', position: [0, 12, -15], rotation: [0, -0.1] },
      { id: 'laser_fence', name: 'Security Barrier', description: 'Pioneer 1 containment laser barrier', position: [35, 8, 10], rotation: [-Math.PI / 2, 0] }
    ]
  },
  {
    id: 'forest-02',
    name: 'Forest 2 & Dragon Lair',
    episode: 'ep1',
    subArea: 'Surface Level 2 & Boss Arena',
    description: 'Deep ancient woodland leading to the scorched volcanic caldera of the Sil Dragon.',
    defaultPos: [0, 30, 80],
    defaultRot: [0, -0.3],
    fogColor: 0x22140a,
    fogNear: 50,
    fogFar: 300,
    bgColor: 0x140a04,
    ambientLight: 0xcc8855,
    sunColor: 0xff8833,
    sunPos: [0, 100, -50],
    pois: [
      { id: 'entrance', name: 'Valley Entrance', description: 'Approach path surrounded by cliff walls', position: [0, 10, 60], rotation: [0, 0] },
      { id: 'dragon_nest', name: 'Dragon Nest Caldera', description: 'Molten volcanic arena with glowing fissures', position: [0, 6, -30], rotation: [0, -0.2] },
      { id: 'lava_fissure', name: 'Magma Fissure', description: 'Bubbling lava pools', position: [-30, 8, -25], rotation: [Math.PI / 4, -0.2] }
    ]
  },
  {
    id: 'caves-01',
    name: 'Caves 1, 2 & 3',
    episode: 'ep1',
    subArea: 'Subterranean Caverns',
    description: 'Vast underground bioluminescent caves filled with crystal formations, stalactites, and magma streams.',
    defaultPos: [0, 20, 65],
    defaultRot: [0, -0.15],
    fogColor: 0x051a24,
    fogNear: 40,
    fogFar: 260,
    bgColor: 0x020a10,
    ambientLight: 0x4488aa,
    sunColor: 0x00e1ff,
    sunPos: [20, 50, 20],
    pois: [
      { id: 'crystal_grotto', name: 'Crystal Grotto', description: 'Glowing photon crystal spires', position: [0, 8, 30], rotation: [0, 0] },
      { id: 'underground_river', name: 'Underground Waterfall', description: 'Subterranean cascade flowing into the abyss', position: [-35, 12, -10], rotation: [Math.PI / 3, -0.2] },
      { id: 'magma_chamber', name: 'Magma Chamber', description: 'Active lava pools lighting the rock formations', position: [35, 10, -25], rotation: [-Math.PI / 3, -0.2] }
    ]
  },
  {
    id: 'caves-derolle',
    name: 'De Rol Le - Aquatic Sewer Raft',
    episode: 'ep1',
    subArea: 'Caves Boss Arena',
    description: 'A speeding mechanical cargo raft traveling along an endless subterranean sewer channel.',
    defaultPos: [0, 15, 45],
    defaultRot: [0, -0.1],
    fogColor: 0x041822,
    fogNear: 50,
    fogFar: 280,
    bgColor: 0x020c14,
    ambientLight: 0x337799,
    sunColor: 0x00d4ff,
    sunPos: [0, 40, 0],
    pois: [
      { id: 'raft_helm', name: 'Raft Platform', description: 'Main combat platform with defensive railings', position: [0, 5, 0], rotation: [0, 0] },
      { id: 'water_chasm', name: 'Subterranean Chasm', description: 'Endless rushing underground waterway', position: [0, 25, -60], rotation: [0, -0.3] }
    ]
  },
  {
    id: 'mines-01',
    name: 'Mines & Vol Opt AI Core',
    episode: 'ep1',
    subArea: 'Underground Industrial Complex',
    description: 'Heavily mechanized mining sector featuring conveyor belts, laser fences, and the supercomputer Vol Opt.',
    defaultPos: [0, 22, 60],
    defaultRot: [0, -0.2],
    fogColor: 0x14181f,
    fogNear: 50,
    fogFar: 270,
    bgColor: 0x080a0e,
    ambientLight: 0x8899aa,
    sunColor: 0xffaa00,
    sunPos: [40, 80, 40],
    pois: [
      { id: 'vol_opt_core', name: 'Vol Opt Central Core', description: 'Giant cylindrical supercomputer AI terminal', position: [0, 14, -30], rotation: [0, -0.15] },
      { id: 'conveyor_line', name: 'Ore Conveyor Hub', description: 'Industrial automated processing lines', position: [-40, 8, 15], rotation: [Math.PI / 2, 0] },
      { id: 'laser_grid', name: 'High-Voltage Transformer', description: 'Humming electrical substation', position: [40, 8, 15], rotation: [-Math.PI / 2, 0] }
    ]
  },
  {
    id: 'ruins-01',
    name: 'Ruins & Dark Falz Monument',
    episode: 'ep1',
    subArea: 'Ancient Alien Spaceship & Arena',
    description: 'The deeply buried ancient alien vessel covered in glowing geometric hieroglyphs, leading to Dark Falz.',
    defaultPos: [0, 25, 70],
    defaultRot: [0, -0.25],
    fogColor: 0x0a1024,
    fogNear: 50,
    fogFar: 300,
    bgColor: 0x040612,
    ambientLight: 0x5566aa,
    sunColor: 0x9944ff,
    sunPos: [0, 90, 0],
    pois: [
      { id: 'rico_monument', name: "Red Ring Rico's Memorial", description: 'The final message capsule left by Principal Tyrell’s daughter', position: [0, 8, 20], rotation: [0, 0] },
      { id: 'alien_throne', name: 'Ancient Core Obelisk', description: 'Geometric alien artifact humming with dark photon energy', position: [0, 18, -40], rotation: [0, -0.1] },
      { id: 'floating_platforms', name: 'Levitating Rings', description: 'Defying gravity around the central chasm', position: [-35, 15, -10], rotation: [Math.PI / 3, -0.2] }
    ]
  },

  // ==========================================
  // EPISODE II: LAB & VR
  // ==========================================
  {
    id: 'pioneer2-lab',
    name: 'Pioneer II - Principal Lab',
    episode: 'ep2',
    subArea: 'Episode II Headquarters',
    description: 'The advanced scientific research laboratory operated by Natasha Milarose and the Government of Pioneer II.',
    defaultPos: [0, 18, 50],
    defaultRot: [0, -0.2],
    fogColor: 0x081e28,
    fogNear: 60,
    fogFar: 280,
    bgColor: 0x030d12,
    ambientLight: 0x55bbcc,
    sunColor: 0x00ffcc,
    sunPos: [0, 60, 30],
    pois: [
      { id: 'natasha_desk', name: 'Director Natasha Desk', description: 'Central research command console', position: [0, 8, -25], rotation: [0, 0] },
      { id: 'vr_pod', name: 'VR Simulation Pod', description: 'Neural simulator for Temple and Spaceship exercises', position: [-30, 8, 10], rotation: [Math.PI / 2, 0] },
      { id: 'specimen_tank', name: 'Ragol Bio-Tanks', description: 'Preserved biological specimens and mutated organisms', position: [30, 10, 10], rotation: [-Math.PI / 2, 0] }
    ]
  },
  {
    id: 'vr-temple',
    name: 'VR Temple',
    episode: 'ep2',
    subArea: 'Virtual Reality Sector Alpha & Beta',
    description: 'A holographic recreation of ancient Asian floating pavilions surrounded by cascading streams.',
    defaultPos: [0, 22, 65],
    defaultRot: [0, -0.2],
    fogColor: 0x142838,
    fogNear: 60,
    fogFar: 300,
    bgColor: 0x0a1420,
    ambientLight: 0x77aacc,
    sunColor: 0x00e5ff,
    sunPos: [50, 90, 50],
    pois: [
      { id: 'temple_gate', name: 'Torii Virtual Gate', description: 'Holographic grand entrance arch', position: [0, 8, 40], rotation: [0, 0] },
      { id: 'central_pavilion', name: 'Sanctuary Pavilion', description: 'Floating pagodas with glowing runic lanterns', position: [0, 14, -20], rotation: [0, -0.1] }
    ]
  },
  {
    id: 'vr-spaceship',
    name: 'VR Spaceship',
    episode: 'ep2',
    subArea: 'Virtual Reality Sector Alpha & Beta',
    description: 'A simulated battle through a derelict combat battleship with exposed conduits and engine thrusters.',
    defaultPos: [0, 20, 55],
    defaultRot: [0, -0.15],
    fogColor: 0x101420,
    fogNear: 50,
    fogFar: 280,
    bgColor: 0x080a10,
    ambientLight: 0x7788aa,
    sunColor: 0x4488ff,
    sunPos: [0, 70, 0],
    pois: [
      { id: 'bridge', name: 'Command Bridge', description: 'Holographic tactical holotank and consoles', position: [0, 10, -35], rotation: [0, 0] },
      { id: 'engine_core', name: 'Warp Drive Core', description: 'Pulsing containment reactor', position: [0, 15, 30], rotation: [Math.PI, -0.2] }
    ]
  },
  {
    id: 'cca-jungle-mountain',
    name: 'Central Control Area (CCA) & Jungle',
    episode: 'ep2',
    subArea: 'Gal Da Val Island',
    description: 'The tropical paradise of Gal Da Val Island: Jungle, Mountain pass, Seaside cliffs, and Central Dome.',
    defaultPos: [0, 30, 85],
    defaultRot: [0, -0.25],
    fogColor: 0x082824,
    fogNear: 60,
    fogFar: 350,
    bgColor: 0x041614,
    ambientLight: 0x66ccaa,
    sunColor: 0xaaffdd,
    sunPos: [60, 120, 60],
    pois: [
      { id: 'central_dome', name: 'Central Dome Tower', description: 'The grand research facility at the island apex', position: [0, 24, -40], rotation: [0, -0.1] },
      { id: 'jungle_canopy', name: 'Tropical Jungle Canopy', description: 'Dense palm trees and ancient ruin fragments', position: [-40, 12, 10], rotation: [Math.PI / 3, 0] },
      { id: 'seaside_cliff', name: 'Seaside Coastal Bluff', description: 'Overlooking the ocean waves crashing on the reef', position: [45, 16, 20], rotation: [-Math.PI / 3, -0.1] }
    ]
  },
  {
    id: 'seabed-01',
    name: 'Seabed Research Facility',
    episode: 'ep2',
    subArea: 'Undersea Laboratory & Olga Flow Pit',
    description: 'Submerged oceanic laboratories enclosed in reinforced glass tunnels with deep-sea creatures and Olga Flow.',
    defaultPos: [0, 20, 60],
    defaultRot: [0, -0.2],
    fogColor: 0x021626,
    fogNear: 40,
    fogFar: 280,
    bgColor: 0x010c16,
    ambientLight: 0x3388aa,
    sunColor: 0x00f0ff,
    sunPos: [0, 60, 0],
    pois: [
      { id: 'glass_tunnel', name: 'Undersea Glass Corridor', description: 'Surrounded by dark abyss waters and schools of fish', position: [0, 8, 25], rotation: [0, 0] },
      { id: 'olga_pit', name: 'Olga Flow Test Elevator', description: 'The vertical shaft descending to the bottom of Ragol', position: [0, 15, -35], rotation: [0, -0.3] }
    ]
  },

  // ==========================================
  // EPISODE IV: CRATER & DESERT
  // ==========================================
  {
    id: 'crater-interior',
    name: 'Crater Interior',
    episode: 'ep4',
    subArea: 'Meteorite Impact Zone',
    description: 'The cataclysmic impact site of the giant meteorite on Planet Ragol with alien crystal anomalies.',
    defaultPos: [0, 30, 80],
    defaultRot: [0, -0.3],
    fogColor: 0x221a10,
    fogNear: 50,
    fogFar: 320,
    bgColor: 0x140e08,
    ambientLight: 0xddaa77,
    sunColor: 0xffbb66,
    sunPos: [70, 100, 50],
    pois: [
      { id: 'meteorite_core', name: 'Meteorite Core Apex', description: 'Ground zero of the cosmic impact', position: [0, 14, -30], rotation: [0, -0.15] },
      { id: 'crystal_ridges', name: 'Crystalline Formations', description: 'Alien minerals sprouting from the blasted soil', position: [-35, 12, 10], rotation: [Math.PI / 4, -0.1] }
    ]
  },
  {
    id: 'subterranean-desert',
    name: 'Subterranean Desert & Saint-Million',
    episode: 'ep4',
    subArea: 'Arid Canyons & Beast Lair',
    description: 'Vast sandstone dunes and underground desert caverns leading to the colossal beast Saint-Million.',
    defaultPos: [0, 25, 75],
    defaultRot: [0, -0.2],
    fogColor: 0x2a1c0d,
    fogNear: 60,
    fogFar: 350,
    bgColor: 0x181007,
    ambientLight: 0xee9944,
    sunColor: 0xffaa33,
    sunPos: [0, 120, 60],
    pois: [
      { id: 'dune_ridge', name: 'Sand Dune Vista', description: 'High ridge looking out over endless desert wastes', position: [0, 15, 30], rotation: [0, -0.1] },
      { id: 'saint_nest', name: 'Saint-Million Nest', description: 'Giant circular sandstone arena', position: [0, 8, -40], rotation: [0, -0.2] }
    ]
  }
];
