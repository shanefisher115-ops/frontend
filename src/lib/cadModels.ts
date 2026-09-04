import * as THREE from 'three';

export interface CadModelDef {
  id: string;
  name: string;
  description: string;
  materialColor: number;
  stockBounds: { minX: number; maxX: number; minY: number; maxY: number; minZ: number; maxZ: number };
  createMesh: () => THREE.Group;
}

/**
 * Creates a Mechanical Mounting Bracket CAD model.
 */
function createMechanicalBracket(): THREE.Group {
  const group = new THREE.Group();
  group.name = 'Mechanical Bracket';

  // Base Plate with Rounded Corners & Holes
  const baseShape = new THREE.Shape();
  const width = 10;
  const depth = 6;
  const radius = 0.8;

  baseShape.moveTo(-width / 2 + radius, -depth / 2);
  baseShape.lineTo(width / 2 - radius, -depth / 2);
  baseShape.quadraticCurveTo(width / 2, -depth / 2, width / 2, -depth / 2 + radius);
  baseShape.lineTo(width / 2, depth / 2 - radius);
  baseShape.quadraticCurveTo(width / 2, depth / 2, width / 2 - radius, depth / 2);
  baseShape.lineTo(-width / 2 + radius, depth / 2);
  baseShape.quadraticCurveTo(-width / 2, depth / 2, -width / 2, depth / 2 - radius);
  baseShape.lineTo(-width / 2, -depth / 2 + radius);
  baseShape.quadraticCurveTo(-width / 2, -depth / 2, -width / 2 + radius, -depth / 2);

  // Mounting holes in base
  const holeRadius = 0.5;
  const holePositions = [
    [-3.8, -1.8],
    [3.8, -1.8],
    [-3.8, 1.8],
    [3.8, 1.8],
  ];

  holePositions.forEach(([hx, hy]) => {
    const holePath = new THREE.Path();
    holePath.absarc(hx, hy, holeRadius, 0, Math.PI * 2, true);
    baseShape.holes.push(holePath);
  });

  const extrudeSettings = {
    steps: 1,
    depth: 1.2,
    bevelEnabled: true,
    bevelThickness: 0.1,
    bevelSize: 0.1,
    bevelSegments: 3,
  };

  const baseGeom = new THREE.ExtrudeGeometry(baseShape, extrudeSettings);
  baseGeom.center();
  baseGeom.rotateX(-Math.PI / 2);

  const cadMaterial = new THREE.MeshStandardMaterial({
    color: 0x3a7bd5,
    metalness: 0.7,
    roughness: 0.3,
  });

  const baseMesh = new THREE.Mesh(baseGeom, cadMaterial);
  baseMesh.position.y = 0.6;
  baseMesh.castShadow = true;
  baseMesh.receiveShadow = true;
  group.add(baseMesh);

  // Vertical Cylinder Boss
  const bossRadius = 2.0;
  const bossHeight = 3.5;
  const bossGeom = new THREE.CylinderGeometry(bossRadius, bossRadius, bossHeight, 32);
  const bossMesh = new THREE.Mesh(bossGeom, cadMaterial);
  bossMesh.position.set(0, 1.2 + bossHeight / 2, 0);
  bossMesh.castShadow = true;
  bossMesh.receiveShadow = true;
  group.add(bossMesh);

  // Center Bore Hole in Boss
  const boreGeom = new THREE.CylinderGeometry(1.2, 1.2, bossHeight + 0.1, 32);
  const darkMaterial = new THREE.MeshStandardMaterial({ color: 0x1a202c, roughness: 0.8 });
  const boreMesh = new THREE.Mesh(boreGeom, darkMaterial);
  boreMesh.position.set(0, 1.2 + bossHeight / 2, 0);
  group.add(boreMesh);

  // Support Ribs
  const ribGeom = new THREE.BoxGeometry(0.6, 2.5, 3.2);
  const rib1 = new THREE.Mesh(ribGeom, cadMaterial);
  rib1.position.set(-2.0, 1.2 + 1.25, 0);
  rib1.castShadow = true;
  rib1.receiveShadow = true;
  group.add(rib1);

  const rib2 = rib1.clone();
  rib2.position.set(2.0, 1.2 + 1.25, 0);
  group.add(rib2);

  return group;
}

/**
 * Creates a Milling Stock / Pocket Block CAD model.
 */
function createPocketBlock(): THREE.Group {
  const group = new THREE.Group();
  group.name = 'Milling Workpiece';

  const cadMaterial = new THREE.MeshStandardMaterial({
    color: 0x2e8b57,
    metalness: 0.6,
    roughness: 0.3,
  });

  // Main block workpiece shape (10x10x3)
  const outerShape = new THREE.Shape();
  const size = 5;
  outerShape.moveTo(-size, -size);
  outerShape.lineTo(size, -size);
  outerShape.lineTo(size, size);
  outerShape.lineTo(-size, size);
  outerShape.lineTo(-size, -size);

  // Rectangular pocket hole inside
  const pocketPath = new THREE.Path();
  const pSize = 3.2;
  pocketPath.moveTo(-pSize, -pSize);
  pocketPath.lineTo(-pSize, pSize);
  pocketPath.lineTo(pSize, pSize);
  pocketPath.lineTo(pSize, -pSize);
  pocketPath.lineTo(-pSize, -pSize);
  outerShape.holes.push(pocketPath);

  const extrudeSettings = {
    steps: 1,
    depth: 2.5,
    bevelEnabled: true,
    bevelThickness: 0.08,
    bevelSize: 0.08,
    bevelSegments: 2,
  };

  const geom = new THREE.ExtrudeGeometry(outerShape, extrudeSettings);
  geom.center();
  geom.rotateX(-Math.PI / 2);

  const blockMesh = new THREE.Mesh(geom, cadMaterial);
  blockMesh.position.y = 1.25;
  blockMesh.castShadow = true;
  blockMesh.receiveShadow = true;
  group.add(blockMesh);

  // Bottom floor inside the pocket
  const floorGeom = new THREE.BoxGeometry(6.4, 0.5, 6.4);
  const floorMesh = new THREE.Mesh(floorGeom, new THREE.MeshStandardMaterial({ color: 0x226644, roughness: 0.5 }));
  floorMesh.position.set(0, 0.25, 0);
  group.add(floorMesh);

  return group;
}

/**
 * Creates a Turbine Impeller / Gear CAD model.
 */
function createTurbineImpeller(): THREE.Group {
  const group = new THREE.Group();
  group.name = 'Turbine Impeller';

  const cadMaterial = new THREE.MeshStandardMaterial({
    color: 0x9b51e0,
    metalness: 0.8,
    roughness: 0.2,
  });

  // Hub cylinder
  const hubRadius = 1.8;
  const hubHeight = 2.0;
  const hubGeom = new THREE.CylinderGeometry(hubRadius, hubRadius + 0.4, hubHeight, 32);
  const hubMesh = new THREE.Mesh(hubGeom, cadMaterial);
  hubMesh.position.y = hubHeight / 2;
  hubMesh.castShadow = true;
  hubMesh.receiveShadow = true;
  group.add(hubMesh);

  // Center shaft hole
  const holeGeom = new THREE.CylinderGeometry(0.7, 0.7, hubHeight + 0.1, 32);
  const holeMesh = new THREE.Mesh(holeGeom, new THREE.MeshStandardMaterial({ color: 0x111111 }));
  holeMesh.position.y = hubHeight / 2;
  group.add(holeMesh);

  // Blades array around hub
  const numBlades = 8;
  for (let i = 0; i < numBlades; i++) {
    const angle = (i / numBlades) * Math.PI * 2;
    const bladeGeom = new THREE.BoxGeometry(0.3, 1.6, 2.8);
    const bladeMesh = new THREE.Mesh(bladeGeom, cadMaterial);

    // Twist/curve blade
    bladeMesh.rotation.y = angle;
    bladeMesh.rotation.z = Math.PI / 12;

    const posX = Math.cos(angle) * 2.8;
    const posZ = Math.sin(angle) * 2.8;
    bladeMesh.position.set(posX, 1.0, posZ);
    bladeMesh.rotation.y = angle + Math.PI / 4;
    bladeMesh.castShadow = true;
    group.add(bladeMesh);
  }

  return group;
}

export const CAD_MODELS: Record<string, CadModelDef> = {
  bracket: {
    id: 'bracket',
    name: 'Mechanical Mounting Bracket',
    description: 'Aircraft aluminum mounting bracket with 4 corner bolt holes and central bore.',
    materialColor: 0x3a7bd5,
    stockBounds: { minX: -5, maxX: 5, minY: 0, maxY: 4.8, minZ: -3, maxZ: 3 },
    createMesh: createMechanicalBracket,
  },
  pocket: {
    id: 'pocket',
    name: 'CNC Pocket Milling Stock',
    description: 'Precision milled rectangular workpiece block with pocket feature.',
    materialColor: 0x2e8b57,
    stockBounds: { minX: -5, maxX: 5, minY: 0, maxY: 2.5, minZ: -5, maxZ: 5 },
    createMesh: createPocketBlock,
  },
  impeller: {
    id: 'impeller',
    name: 'Turbine Impeller',
    description: '8-blade curved turbine impeller hub for high-speed machining.',
    materialColor: 0x9b51e0,
    stockBounds: { minX: -4.5, maxX: 4.5, minY: 0, maxY: 2.2, minZ: -4.5, maxZ: 4.5 },
    createMesh: createTurbineImpeller,
  },
};
