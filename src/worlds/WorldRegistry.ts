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
  hemiSkyColor: number;
  hemiGroundColor: number;
  skyModelId?: string;
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
    fogNear: 400,
    fogFar: 3000,
    bgColor: 0x050c18,
    ambientLight: 0x88ccff,
    sunColor: 0x00f0ff,
    sunPos: [50, 120, 50],
    hemiSkyColor: 0x00d4ff,
    hemiGroundColor: 0x050c18,
    skyModelId: 'sky-pioneer2-city',
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
    fogNear: 300,
    fogFar: 2000,
    bgColor: 0x030812,
    ambientLight: 0x66aacc,
    sunColor: 0x00ffff,
    sunPos: [0, 80, 0],
    hemiSkyColor: 0x00e5ff,
    hemiGroundColor: 0x030812,
    skyModelId: 'sky-visual-lobby',
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
    fogNear: 300,
    fogFar: 2000,
    bgColor: 0x12040e,
    ambientLight: 0xffaacc,
    sunColor: 0xff66bb,
    sunPos: [20, 80, 20],
    hemiSkyColor: 0xff88cc,
    hemiGroundColor: 0x12040e,
    skyModelId: 'sky-visual-lobby-festive',
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
    fogNear: 400,
    fogFar: 3000,
    bgColor: 0x05140b,
    ambientLight: 0x77cc88,
    sunColor: 0xeeffaa,
    sunPos: [80, 140, 60],
    hemiSkyColor: 0xeeffcc,
    hemiGroundColor: 0x05140b,
    skyModelId: 'sky-forest-01',
    pois: [
      { id: 'drop_pod', name: 'Drop Pod Landing', description: 'Hunter initial touchdown zone', position: [0, 8, 45], rotation: [0, 0] },
      { id: 'waterfall', name: 'Twin Waterfalls', description: 'Flowing river basin with ancient archways', position: [-40, 10, -20], rotation: [Math.PI / 3, -0.1] },
      { id: 'monument', name: 'Central Monolith', description: 'Ancient alien stone relic', position: [0, 12, -15], rotation: [0, -0.1] },
      { id: 'laser_fence', name: 'Security Barrier', description: 'Pioneer 1 containment laser barrier', position: [35, 8, 10], rotation: [-Math.PI / 2, 0] }
    ]
  },
  {
    id: 'forest-02',
    name: 'Forest 2',
    episode: 'ep1',
    subArea: 'Surface Level 2',
    description: 'Deep ancient woodland leading to the scorched approach towards the Central Dome.',
    defaultPos: [0, 30, 80],
    defaultRot: [0, -0.3],
    fogColor: 0x181e10,
    fogNear: 400,
    fogFar: 3000,
    bgColor: 0x0b1408,
    ambientLight: 0x88cc77,
    sunColor: 0xffdd88,
    sunPos: [0, 120, -50],
    hemiSkyColor: 0xffeebb,
    hemiGroundColor: 0x0b1408,
    skyModelId: 'sky-forest-02',
    pois: [
      { id: 'entrance', name: 'Valley Entrance', description: 'Approach path surrounded by cliff walls', position: [0, 10, 60], rotation: [0, 0] },
      { id: 'canopy', name: 'Grand Canopy Arch', description: 'Massive towering bio-luminescent trees', position: [0, 15, -10], rotation: [0, -0.1] }
    ]
  },
  {
    id: 'boss-dragon',
    name: 'Dragon Caldera',
    episode: 'ep1',
    subArea: 'Forest Boss Arena',
    description: 'The scorched volcanic crater arena of the colossal Sil Dragon.',
    defaultPos: [0, 25, 70],
    defaultRot: [0, -0.2],
    fogColor: 0x221008,
    fogNear: 300,
    fogFar: 2500,
    bgColor: 0x140803,
    ambientLight: 0xcc8855,
    sunColor: 0xff7722,
    sunPos: [0, 100, 0],
    hemiSkyColor: 0xff8833,
    hemiGroundColor: 0x140803,
    skyModelId: 'sky-boss-dragon',
    pois: [
      { id: 'nest', name: 'Lava Ring Arena', description: 'Molten rock arena surrounded by fiery fissures', position: [0, 8, 0], rotation: [0, 0] }
    ]
  },
  {
    id: 'caves-01',
    name: 'Caves 1',
    episode: 'ep1',
    subArea: 'Subterranean Caverns 1',
    description: 'Vast underground bioluminescent caves filled with crystal formations, stalactites, and waterways.',
    defaultPos: [0, 20, 65],
    defaultRot: [0, -0.15],
    fogColor: 0x051a24,
    fogNear: 350,
    fogFar: 2500,
    bgColor: 0x020a10,
    ambientLight: 0x4488aa,
    sunColor: 0x00e1ff,
    sunPos: [20, 60, 20],
    hemiSkyColor: 0x00d4ff,
    hemiGroundColor: 0x020a10,
    skyModelId: 'sky-caves-01',
    pois: [
      { id: 'crystal_grotto', name: 'Crystal Grotto', description: 'Glowing photon crystal spires', position: [0, 8, 30], rotation: [0, 0] },
      { id: 'underground_river', name: 'Underground Waterfall', description: 'Subterranean cascade flowing into the abyss', position: [-35, 12, -10], rotation: [Math.PI / 3, -0.2] }
    ]
  },
  {
    id: 'caves-02',
    name: 'Caves 2',
    episode: 'ep1',
    subArea: 'Subterranean Caverns 2',
    description: 'Deep subterranean tier with crystal bridges, ancient ruins, and underground magma rivers.',
    defaultPos: [0, 22, 60],
    defaultRot: [0, -0.2],
    fogColor: 0x081820,
    fogNear: 350,
    fogFar: 2500,
    bgColor: 0x030d14,
    ambientLight: 0x5599aa,
    sunColor: 0x00ffff,
    sunPos: [40, 70, 40],
    hemiSkyColor: 0x00f0ff,
    hemiGroundColor: 0x030d14,
    skyModelId: 'sky-caves-02',
    pois: [
      { id: 'bridge', name: 'Crystal Span Bridge', description: 'Arched glowing stone bridge over magma abyss', position: [0, 10, 0], rotation: [0, 0] }
    ]
  },
  {
    id: 'caves-03',
    name: 'Caves 3',
    episode: 'ep1',
    subArea: 'Subterranean Caverns 3',
    description: 'The deepest cave sector with active magma lakes and colossal cavern vaults.',
    defaultPos: [0, 25, 65],
    defaultRot: [0, -0.2],
    fogColor: 0x1f1008,
    fogNear: 350,
    fogFar: 2500,
    bgColor: 0x100803,
    ambientLight: 0xbb7744,
    sunColor: 0xff8833,
    sunPos: [0, 80, 0],
    hemiSkyColor: 0xff9944,
    hemiGroundColor: 0x100803,
    skyModelId: 'sky-caves-03',
    pois: [
      { id: 'magma_core', name: 'Magma Caldera Basin', description: 'Active bubbling lava chambers', position: [0, 12, -20], rotation: [0, -0.1] }
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
    fogNear: 300,
    fogFar: 2200,
    bgColor: 0x020c14,
    ambientLight: 0x337799,
    sunColor: 0x00d4ff,
    sunPos: [0, 50, 0],
    hemiSkyColor: 0x00ccff,
    hemiGroundColor: 0x020c14,
    skyModelId: 'sky-caves-derolle',
    pois: [
      { id: 'raft_helm', name: 'Raft Platform', description: 'Main combat platform with defensive railings', position: [0, 5, 0], rotation: [0, 0] }
    ]
  },
  {
    id: 'mines-01',
    name: 'Mines 1',
    episode: 'ep1',
    subArea: 'Underground Industrial Complex 1',
    description: 'Heavily mechanized mining sector featuring conveyor belts, laser fences, and automation hubs.',
    defaultPos: [0, 22, 60],
    defaultRot: [0, -0.2],
    fogColor: 0x14181f,
    fogNear: 350,
    fogFar: 2600,
    bgColor: 0x080a0e,
    ambientLight: 0x8899aa,
    sunColor: 0xffaa00,
    sunPos: [40, 90, 40],
    hemiSkyColor: 0xffbb44,
    hemiGroundColor: 0x080a0e,
    skyModelId: 'sky-mines-01',
    pois: [
      { id: 'conveyor_line', name: 'Ore Conveyor Hub', description: 'Industrial automated processing lines', position: [-40, 8, 15], rotation: [Math.PI / 2, 0] },
      { id: 'laser_grid', name: 'High-Voltage Transformer', description: 'Humming electrical substation', position: [40, 8, 15], rotation: [-Math.PI / 2, 0] }
    ]
  },
  {
    id: 'mines-02',
    name: 'Mines 2',
    episode: 'ep1',
    subArea: 'Underground Industrial Complex 2',
    description: 'Deep automated processing facility with multi-level catwalks and giant crushing machinery.',
    defaultPos: [0, 25, 65],
    defaultRot: [0, -0.2],
    fogColor: 0x181410,
    fogNear: 350,
    fogFar: 2600,
    bgColor: 0x0a0805,
    ambientLight: 0x998877,
    sunColor: 0xffbb44,
    sunPos: [0, 90, 0],
    hemiSkyColor: 0xffaa33,
    hemiGroundColor: 0x0a0805,
    skyModelId: 'sky-mines-02',
    pois: [
      { id: 'crusher', name: 'Mineral Crusher Shaft', description: 'Towering industrial ore elevators', position: [0, 15, -20], rotation: [0, 0] }
    ]
  },
  {
    id: 'boss-vol-opt',
    name: 'Vol Opt AI Core',
    episode: 'ep1',
    subArea: 'Mines Boss Arena',
    description: 'The supercomputer AI terminal chamber encased in massive computer server arrays.',
    defaultPos: [0, 20, 55],
    defaultRot: [0, -0.15],
    fogColor: 0x0a1420,
    fogNear: 300,
    fogFar: 2200,
    bgColor: 0x04080f,
    ambientLight: 0x5599cc,
    sunColor: 0x00e5ff,
    sunPos: [0, 70, 0],
    hemiSkyColor: 0x00f0ff,
    hemiGroundColor: 0x04080f,
    skyModelId: 'sky-boss-vol-opt',
    pois: [
      { id: 'core', name: 'Central AI Cylinder', description: 'Pulsing supercomputer matrix', position: [0, 10, 0], rotation: [0, 0] }
    ]
  },
  {
    id: 'ruins-01',
    name: 'Ruins 1',
    episode: 'ep1',
    subArea: 'Ancient Alien Spaceship 1',
    description: 'The ancient alien starship covered in glowing geometric hieroglyphs and levitating rings.',
    defaultPos: [0, 25, 70],
    defaultRot: [0, -0.25],
    fogColor: 0x0a1024,
    fogNear: 350,
    fogFar: 2800,
    bgColor: 0x040612,
    ambientLight: 0x5566aa,
    sunColor: 0x9944ff,
    sunPos: [0, 90, 0],
    hemiSkyColor: 0xaa55ff,
    hemiGroundColor: 0x040612,
    skyModelId: 'sky-ruins-01',
    pois: [
      { id: 'rico_monument', name: "Red Ring Rico's Memorial", description: 'The final message capsule left by Principal Tyrell’s daughter', position: [0, 8, 20], rotation: [0, 0] },
      { id: 'alien_throne', name: 'Ancient Core Obelisk', description: 'Geometric alien artifact humming with dark photon energy', position: [0, 18, -40], rotation: [0, -0.1] }
    ]
  },
  {
    id: 'ruins-02',
    name: 'Ruins 2',
    episode: 'ep1',
    subArea: 'Ancient Alien Spaceship 2',
    description: 'The deeper inner sanctum of the ancient ruins leading to the portal to Dark Falz.',
    defaultPos: [0, 25, 65],
    defaultRot: [0, -0.2],
    fogColor: 0x100820,
    fogNear: 350,
    fogFar: 2800,
    bgColor: 0x080310,
    ambientLight: 0x7755aa,
    sunColor: 0xbb33ff,
    sunPos: [0, 90, 0],
    hemiSkyColor: 0xbb44ff,
    hemiGroundColor: 0x080310,
    skyModelId: 'sky-ruins-02',
    pois: [
      { id: 'portal', name: 'Dimensional Warp Seal', description: 'Pulsing dark energy portal ring', position: [0, 12, 0], rotation: [0, 0] }
    ]
  },
  {
    id: 'boss-dark-falz-meadow',
    name: 'Dark Falz - Sanctuary Meadow (Intro)',
    episode: 'ep1',
    subArea: 'Ruins - Core Lair',
    description: 'The tranquil sunny meadow and monument entered prior to the Dark Falz confrontation, before the illusion shatters into the void.',
    defaultPos: [0, 20, 90],
    defaultRot: [0, -0.1],
    fogColor: 0x4488bb,
    fogNear: 600,
    fogFar: 4000,
    bgColor: 0x225588,
    ambientLight: 0xffffff,
    sunColor: 0xfff8e0,
    sunPos: [80, 140, 60],
    hemiSkyColor: 0x66bbff,
    hemiGroundColor: 0x2a5518,
    skyModelId: 'sky-forest-01',
    pois: [
      { id: 'spawn', name: 'Meadow Entrance', description: 'Sunlit grassy entry overlook', position: [0, 15, 80], rotation: [0, -0.1] },
      { id: 'monument', name: 'Central Memorial Monument', description: 'Ancient glowing monolith in the center of the field', position: [0, 15, 0], rotation: [0, 0] },
      { id: 'hills', name: 'Rolling Grassy Ridge', description: 'Surrounding green hills and flowerbeds', position: [50, 25, -40], rotation: [-Math.PI / 4, -0.1] }
    ]
  },
  {
    id: 'boss-dark-falz',
    name: 'Dark Falz Arena',
    episode: 'ep1',
    subArea: 'Final Boss Realm',
    description: 'The cosmic dimensional void where Dark Falz awakens above a field of floating soul monuments.',
    defaultPos: [0, 30, 80],
    defaultRot: [0, -0.2],
    fogColor: 0x180524,
    fogNear: 400,
    fogFar: 3000,
    bgColor: 0x0a0112,
    ambientLight: 0x9944cc,
    sunColor: 0xff33aa,
    sunPos: [0, 100, 0],
    hemiSkyColor: 0xff44bb,
    hemiGroundColor: 0x0a0112,
    skyModelId: 'sky-boss-dark-falz',
    pois: [
      { id: 'monuments', name: 'Soul Pillars', description: 'Floating geometric crystals hovering above the void', position: [0, 15, 0], rotation: [0, 0] }
    ]
  },

  // ==========================================
  // EPISODE II: LAB, VR, CCA, SEABED
  // ==========================================
  {
    id: 'pioneer2-lab',
    name: 'Pioneer II - Principal Lab',
    episode: 'ep2',
    subArea: 'Episode II Headquarters',
    description: 'The advanced scientific research laboratory operated by Natasha Milarose and Pioneer II Gov.',
    defaultPos: [0, 18, 50],
    defaultRot: [0, -0.2],
    fogColor: 0x081e28,
    fogNear: 300,
    fogFar: 2200,
    bgColor: 0x030d12,
    ambientLight: 0x55bbcc,
    sunColor: 0x00ffcc,
    sunPos: [0, 70, 30],
    hemiSkyColor: 0x00ffee,
    hemiGroundColor: 0x030d12,
    skyModelId: 'sky-pioneer2-lab',
    pois: [
      { id: 'natasha_desk', name: 'Director Natasha Desk', description: 'Central research command console', position: [0, 8, -25], rotation: [0, 0] },
      { id: 'vr_pod', name: 'VR Simulation Pod', description: 'Neural simulator for Temple and Spaceship exercises', position: [-30, 8, 10], rotation: [Math.PI / 2, 0] }
    ]
  },
  {
    id: 'vr-temple',
    name: 'VR Temple',
    episode: 'ep2',
    subArea: 'Virtual Reality Sector Alpha',
    description: 'A holographic recreation of ancient Asian floating pavilions surrounded by cascading streams.',
    defaultPos: [0, 22, 65],
    defaultRot: [0, -0.2],
    fogColor: 0x142838,
    fogNear: 400,
    fogFar: 3500,
    bgColor: 0x0a1420,
    ambientLight: 0x77aacc,
    sunColor: 0x00e5ff,
    sunPos: [50, 100, 50],
    hemiSkyColor: 0x00eeff,
    hemiGroundColor: 0x0a1420,
    skyModelId: 'sky-vr-temple',
    pois: [
      { id: 'temple_gate', name: 'Torii Virtual Gate', description: 'Holographic grand entrance arch', position: [0, 8, 40], rotation: [0, 0] },
      { id: 'central_pavilion', name: 'Sanctuary Pavilion', description: 'Floating pagodas with glowing runic lanterns', position: [0, 14, -20], rotation: [0, -0.1] }
    ]
  },
  {
    id: 'vr-spaceship',
    name: 'VR Spaceship',
    episode: 'ep2',
    subArea: 'Virtual Reality Sector Beta',
    description: 'A simulated battle through a derelict combat battleship with exposed conduits and engine thrusters.',
    defaultPos: [0, 20, 55],
    defaultRot: [0, -0.15],
    fogColor: 0x101420,
    fogNear: 350,
    fogFar: 2800,
    bgColor: 0x080a10,
    ambientLight: 0x7788aa,
    sunColor: 0x4488ff,
    sunPos: [0, 80, 0],
    hemiSkyColor: 0x5599ff,
    hemiGroundColor: 0x080a10,
    skyModelId: 'sky-vr-spaceship',
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
    fogNear: 400,
    fogFar: 3500,
    bgColor: 0x041614,
    ambientLight: 0x66ccaa,
    sunColor: 0xaaffdd,
    sunPos: [60, 140, 60],
    hemiSkyColor: 0x99ffee,
    hemiGroundColor: 0x041614,
    skyModelId: 'sky-cca-jungle-mountain',
    pois: [
      { id: 'central_dome', name: 'Central Dome Tower', description: 'The grand research facility at the island apex', position: [0, 24, -40], rotation: [0, -0.1] },
      { id: 'jungle_canopy', name: 'Tropical Jungle Canopy', description: 'Dense palm trees and ancient ruin fragments', position: [-40, 12, 10], rotation: [Math.PI / 3, 0] }
    ]
  },
  {
    id: 'boss-gol-dragon',
    name: 'Gol Dragon Caldera',
    episode: 'ep2',
    subArea: 'VR Sector Boss Arena',
    description: 'The virtual reality holographic simulation of the Gol Dragon arena.',
    defaultPos: [0, 25, 70],
    defaultRot: [0, -0.2],
    fogColor: 0x14202c,
    fogNear: 350,
    fogFar: 2600,
    bgColor: 0x0a1018,
    ambientLight: 0x66aacc,
    sunColor: 0x00f0ff,
    sunPos: [0, 90, 0],
    hemiSkyColor: 0x00e5ff,
    hemiGroundColor: 0x0a1018,
    skyModelId: 'sky-boss-gol-dragon',
    pois: [
      { id: 'arena', name: 'VR Simulation Grid', description: 'Holographic hexagon combat platform', position: [0, 10, 0], rotation: [0, 0] }
    ]
  },
  {
    id: 'boss-gryphon',
    name: 'Gal Gryphon Coastal Cliffs',
    episode: 'ep2',
    subArea: 'CCA Boss Arena',
    description: 'High seaside mountain cliff summit overlooking Gal Da Val Island.',
    defaultPos: [0, 25, 65],
    defaultRot: [0, -0.2],
    fogColor: 0x102830,
    fogNear: 350,
    fogFar: 3000,
    bgColor: 0x08161c,
    ambientLight: 0x77bbcc,
    sunColor: 0x88eeff,
    sunPos: [50, 100, 50],
    hemiSkyColor: 0x99eeff,
    hemiGroundColor: 0x08161c,
    skyModelId: 'sky-boss-gryphon',
    pois: [
      { id: 'clifftop', name: 'Summit Apex', description: 'High stone arena open to the ocean skies', position: [0, 12, 0], rotation: [0, 0] }
    ]
  },
  {
    id: 'seabed-01',
    name: 'Seabed Research Facility',
    episode: 'ep2',
    subArea: 'Undersea Laboratory',
    description: 'Submerged oceanic laboratories enclosed in reinforced glass tunnels beneath the waves.',
    defaultPos: [0, 20, 60],
    defaultRot: [0, -0.2],
    fogColor: 0x021626,
    fogNear: 350,
    fogFar: 2800,
    bgColor: 0x010c16,
    ambientLight: 0x3388aa,
    sunColor: 0x00f0ff,
    sunPos: [0, 70, 0],
    hemiSkyColor: 0x00d4ff,
    hemiGroundColor: 0x010c16,
    skyModelId: 'sky-seabed-01',
    pois: [
      { id: 'glass_tunnel', name: 'Undersea Glass Corridor', description: 'Surrounded by dark abyss waters and schools of fish', position: [0, 8, 25], rotation: [0, 0] }
    ]
  },
  {
    id: 'boss-olga-flow',
    name: 'Olga Flow Test Elevator',
    episode: 'ep2',
    subArea: 'Seabed Final Arena',
    description: 'The giant vertical shaft and subterranean chasm where Olga Flow awaits.',
    defaultPos: [0, 30, 75],
    defaultRot: [0, -0.25],
    fogColor: 0x061828,
    fogNear: 350,
    fogFar: 3000,
    bgColor: 0x020c16,
    ambientLight: 0x4488aa,
    sunColor: 0x00ddff,
    sunPos: [0, 90, 0],
    hemiSkyColor: 0x00e1ff,
    hemiGroundColor: 0x020c16,
    skyModelId: 'sky-boss-olga-flow',
    pois: [
      { id: 'elevator', name: 'Descending Elevator Platform', description: 'Industrial test rig plunging into the bottom of Ragol', position: [0, 15, 0], rotation: [0, 0] }
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
    fogNear: 400,
    fogFar: 3200,
    bgColor: 0x140e08,
    ambientLight: 0xddaa77,
    sunColor: 0xffbb66,
    sunPos: [70, 110, 50],
    hemiSkyColor: 0xffcc77,
    hemiGroundColor: 0x140e08,
    skyModelId: 'sky-crater-interior',
    pois: [
      { id: 'meteorite_core', name: 'Meteorite Core Apex', description: 'Ground zero of the cosmic impact', position: [0, 14, -30], rotation: [0, -0.15] },
      { id: 'crystal_ridges', name: 'Crystalline Formations', description: 'Alien minerals sprouting from the blasted soil', position: [-35, 12, 10], rotation: [Math.PI / 4, -0.1] }
    ]
  },
  {
    id: 'subterranean-desert',
    name: 'Subterranean Desert',
    episode: 'ep4',
    subArea: 'Arid Canyons & Sandstone Caves',
    description: 'Vast sandstone dunes and underground desert caverns on the scorched frontier.',
    defaultPos: [0, 25, 75],
    defaultRot: [0, -0.2],
    fogColor: 0x2a1c0d,
    fogNear: 400,
    fogFar: 3500,
    bgColor: 0x181007,
    ambientLight: 0xee9944,
    sunColor: 0xffaa33,
    sunPos: [0, 130, 60],
    hemiSkyColor: 0xffbb55,
    hemiGroundColor: 0x181007,
    skyModelId: 'sky-subterranean-desert',
    pois: [
      { id: 'dune_ridge', name: 'Sand Dune Vista', description: 'High ridge looking out over endless desert wastes', position: [0, 15, 30], rotation: [0, -0.1] }
    ]
  },
  {
    id: 'boss-saint-million',
    name: 'Saint-Million Nest',
    episode: 'ep4',
    subArea: 'Subterranean Desert Lair',
    description: 'The colossal underground circular sandstone arena of the beast Saint-Million.',
    defaultPos: [0, 25, 70],
    defaultRot: [0, -0.2],
    fogColor: 0x2c1a0c,
    fogNear: 350,
    fogFar: 2800,
    bgColor: 0x160c05,
    ambientLight: 0xee9944,
    sunColor: 0xff8822,
    sunPos: [0, 100, 0],
    hemiSkyColor: 0xff9933,
    hemiGroundColor: 0x160c05,
    skyModelId: 'sky-boss-saint-million',
    pois: [
      { id: 'arena_center', name: 'Sandstone Pit', description: 'Grand circular beast arena surrounded by canyon monoliths', position: [0, 10, 0], rotation: [0, 0] }
    ]
  }
];
