import { buildCamDataset, type RawSegmentInput } from "./camEngine";
import type { CamDataset, StockDimensions, ToolInfo } from "../types/cam";

// Helper to format G-code line string
function gcode(
  cmd: string,
  pos: { x?: number; y?: number; z?: number; i?: number; j?: number },
  feed?: number
): string {
  let s = cmd;
  if (pos.x !== undefined) s += ` X${pos.x.toFixed(3)}`;
  if (pos.y !== undefined) s += ` Y${pos.y.toFixed(3)}`;
  if (pos.z !== undefined) s += ` Z${pos.z.toFixed(3)}`;
  if (pos.i !== undefined) s += ` I${pos.i.toFixed(3)}`;
  if (pos.j !== undefined) s += ` J${pos.j.toFixed(3)}`;
  if (feed !== undefined) s += ` F${Math.round(feed)}`;
  return s;
}

// ---------------------------------------------------------------------------
// Preset 1: 3D Adaptive Pocketing & Facing (Aluminum 6061-T6)
// ---------------------------------------------------------------------------
export function createAdaptivePocketDataset(): CamDataset {
  const stock: StockDimensions = {
    width: 120,
    length: 80,
    height: 25,
    origin: { x: 0, y: 0, z: 0 },
  };

  const tools: ToolInfo[] = [
    {
      id: "T1",
      name: "12mm Flat Face Endmill",
      type: "endmill",
      diameter: 12.0,
      length: 45,
      fluteLength: 25,
      flutes: 3,
      color: "#38bdf8", // Cyan
    },
    {
      id: "T2",
      name: "6mm 3-Flute Adaptive Endmill",
      type: "endmill",
      diameter: 6.0,
      length: 35,
      fluteLength: 18,
      flutes: 3,
      color: "#34d39e", // Emerald
    },
    {
      id: "T3",
      name: "3mm 45° Chamfer Mill",
      type: "chamfer",
      diameter: 3.0,
      length: 30,
      fluteLength: 10,
      flutes: 2,
      color: "#f59e0b", // Amber
    },
  ];

  const operations = [
    {
      id: "op1",
      name: "1. Face Milling Top",
      toolId: "T1",
      color: "#38bdf8",
      type: "facing" as const,
      description: "Surface top face to 0.0mm reference height using 12mm face mill",
    },
    {
      id: "op2",
      name: "2. Helical & Adaptive Pocketing",
      toolId: "T2",
      color: "#34d39e",
      type: "adaptive" as const,
      description: "High speed adaptive clearing with helical entry into center pocket",
    },
    {
      id: "op3",
      name: "3. Pocket Wall Finishing Pass",
      toolId: "T2",
      color: "#a855f7",
      type: "contour" as const,
      description: "Precision perimeter wall contour pass at 1200 mm/min",
    },
    {
      id: "op4",
      name: "4. Top Chamfer Deburring",
      toolId: "T3",
      color: "#f59e0b",
      type: "chamfering" as const,
      description: "45-degree edge chamfer around pocket top border",
    },
  ];

  const rawSegments: RawSegmentInput[] = [];

  let currentPos = { x: 0, y: 0, z: 20 }; // Initial safe retract height

  // --- Op 1: Facing ---
  // Rapid to start facing
  let nextPos = { x: -10, y: 10, z: 20 };
  rawSegments.push({
    motionType: "rapid",
    start: currentPos,
    end: nextPos,
    feedRate: 5000,
    spindleSpeed: 0,
    coolant: false,
    operationId: "op1",
    toolId: "T1",
    gcodeRaw: gcode("G0", nextPos),
    comment: "Rapid to safe height above facing start",
  });
  currentPos = nextPos;

  // Plunge facing to Z=0
  nextPos = { x: -10, y: 10, z: 0 };
  rawSegments.push({
    motionType: "linear",
    start: currentPos,
    end: nextPos,
    feedRate: 800,
    spindleSpeed: 12000,
    coolant: true,
    operationId: "op1",
    toolId: "T1",
    gcodeRaw: gcode("G1", nextPos, 800),
    comment: "Plunge facing tool to Z=0.0",
  });
  currentPos = nextPos;

  // Facing raster passes (Y stepover: 10 to 70 step by 15)
  for (let y = 10; y <= 70; y += 15) {
    const xEnd = y % 30 === 10 ? 130 : -10;
    nextPos = { x: xEnd, y: y, z: 0 };
    rawSegments.push({
      motionType: "linear",
      start: currentPos,
      end: nextPos,
      feedRate: 2400,
      spindleSpeed: 12000,
      coolant: true,
      operationId: "op1",
      toolId: "T1",
      gcodeRaw: gcode("G1", nextPos, 2400),
      comment: `Facing cut across Y=${y}mm`,
    });
    currentPos = nextPos;

    if (y + 15 <= 70) {
      nextPos = { x: xEnd, y: y + 15, z: 0 };
      rawSegments.push({
        motionType: "linear",
        start: currentPos,
        end: nextPos,
        feedRate: 1800,
        spindleSpeed: 12000,
        coolant: true,
        operationId: "op1",
        toolId: "T1",
        gcodeRaw: gcode("G1", nextPos, 1800),
        comment: "Facing stepover move",
      });
      currentPos = nextPos;
    }
  }

  // Retract to safe Z after facing
  nextPos = { x: currentPos.x, y: currentPos.y, z: 25 };
  rawSegments.push({
    motionType: "rapid",
    start: currentPos,
    end: nextPos,
    feedRate: 5000,
    spindleSpeed: 12000,
    coolant: false,
    operationId: "op1",
    toolId: "T1",
    gcodeRaw: gcode("G0", nextPos),
    comment: "Retract after facing (Tool change ahead)",
  });
  currentPos = nextPos;

  // --- Op 2: Adaptive Pocketing with Helical Entry ---
  // Tool change T2, move to center of pocket (X=60, Y=40, Z=5)
  const pocketCenter = { x: 60, y: 40 };
  nextPos = { x: pocketCenter.x, y: pocketCenter.y, z: 15 };
  rawSegments.push({
    motionType: "rapid",
    start: currentPos,
    end: nextPos,
    feedRate: 5000,
    spindleSpeed: 0,
    coolant: false,
    operationId: "op2",
    toolId: "T2",
    gcodeRaw: "M6 T2 (Tool Change 6mm Endmill)\n" + gcode("G0", nextPos),
    comment: "Tool change T2 & rapid to pocket center",
  });
  currentPos = nextPos;

  // Helical entry down to Z=-10 in 5 turns
  const helixRadius = 8;
  const targetZ = -10;
  const turns = 5;
  for (let i = 1; i <= turns * 4; i++) {
    const angle = (i * Math.PI) / 2;
    const progress = i / (turns * 4);
    const z = 2 - progress * (2 - targetZ);
    const hx = pocketCenter.x + helixRadius * Math.cos(angle);
    const hy = pocketCenter.y + helixRadius * Math.sin(angle);
    nextPos = { x: hx, y: hy, z: z };

    rawSegments.push({
      motionType: "arc_ccw",
      start: currentPos,
      end: nextPos,
      feedRate: 1200,
      spindleSpeed: 15000,
      coolant: true,
      operationId: "op2",
      toolId: "T2",
      arcCenter: { x: pocketCenter.x, y: pocketCenter.y, z: 0 },
      arcRadius: helixRadius,
      gcodeRaw: gcode("G3", nextPos, 1200),
      comment: `Helical entry turn ${i}/${turns * 4} (Z=${z.toFixed(2)})`,
    });
    currentPos = nextPos;
  }

  // Expanding adaptive spiral trochoidal pocketing passes
  for (let r = 12; r <= 32; r += 5) {
    const steps = 16;
    for (let s = 1; s <= steps; s++) {
      const angle = (s * 2 * Math.PI) / steps;
      // trochoidal oscillation overlay
      const trochR = r + 1.5 * Math.sin(s * 3);
      const px = pocketCenter.x + trochR * Math.cos(angle);
      const py = pocketCenter.y + trochR * Math.sin(angle);
      nextPos = { x: px, y: py, z: targetZ };

      rawSegments.push({
        motionType: "linear",
        start: currentPos,
        end: nextPos,
        feedRate: 2800,
        spindleSpeed: 15000,
        coolant: true,
        operationId: "op2",
        toolId: "T2",
        gcodeRaw: gcode("G1", nextPos, 2800),
        comment: `Adaptive clearing trochoidal pass r=${r}mm`,
      });
      currentPos = nextPos;
    }
  }

  // Retract to clearance height
  nextPos = { x: currentPos.x, y: currentPos.y, z: 5 };
  rawSegments.push({
    motionType: "rapid",
    start: currentPos,
    end: nextPos,
    feedRate: 5000,
    spindleSpeed: 15000,
    coolant: true,
    operationId: "op2",
    toolId: "T2",
    gcodeRaw: gcode("G0", nextPos),
    comment: "Retract Z above pocket floor",
  });
  currentPos = nextPos;

  // --- Op 3: Wall Finishing Pass ---
  // Move to start of rectangular pocket wall contour (X=25, Y=15, Z=-10)
  const pocketRect = { minX: 25, maxX: 95, minY: 15, maxY: 65 };
  nextPos = { x: pocketRect.minX, y: pocketRect.minY, z: 5 };
  rawSegments.push({
    motionType: "rapid",
    start: currentPos,
    end: nextPos,
    feedRate: 5000,
    spindleSpeed: 15000,
    coolant: true,
    operationId: "op3",
    toolId: "T2",
    gcodeRaw: gcode("G0", nextPos),
    comment: "Rapid to start of pocket finishing contour",
  });
  currentPos = nextPos;

  // Plunge finish
  nextPos = { x: pocketRect.minX, y: pocketRect.minY, z: -10 };
  rawSegments.push({
    motionType: "linear",
    start: currentPos,
    end: nextPos,
    feedRate: 600,
    spindleSpeed: 15000,
    coolant: true,
    operationId: "op3",
    toolId: "T2",
    gcodeRaw: gcode("G1", nextPos, 600),
    comment: "Plunge finish depth Z=-10.0mm",
  });
  currentPos = nextPos;

  // Wall perimeter loop (4 sides with corner arcs)
  const corners = [
    { x: pocketRect.maxX - 5, y: pocketRect.minY },
    { x: pocketRect.maxX, y: pocketRect.minY + 5 },
    { x: pocketRect.maxX, y: pocketRect.maxY - 5 },
    { x: pocketRect.maxX - 5, y: pocketRect.maxY },
    { x: pocketRect.minX + 5, y: pocketRect.maxY },
    { x: pocketRect.minX, y: pocketRect.maxY - 5 },
    { x: pocketRect.minX, y: pocketRect.minY + 5 },
    { x: pocketRect.minX + 5, y: pocketRect.minY },
  ];

  for (let i = 0; i < corners.length; i++) {
    nextPos = { x: corners[i].x, y: corners[i].y, z: -10 };
    const isCornerArc = i % 2 === 1;
    rawSegments.push({
      motionType: isCornerArc ? "arc_ccw" : "linear",
      start: currentPos,
      end: nextPos,
      feedRate: isCornerArc ? 1000 : 1600,
      spindleSpeed: 15000,
      coolant: true,
      operationId: "op3",
      toolId: "T2",
      arcRadius: isCornerArc ? 5 : undefined,
      arcCenter: isCornerArc ? { x: corners[i - 1].x, y: corners[i].y, z: -10 } : undefined,
      gcodeRaw: gcode(isCornerArc ? "G3" : "G1", nextPos, isCornerArc ? 1000 : 1600),
      comment: isCornerArc ? "Corner radius arc interpolation" : "Straight wall finish move",
    });
    currentPos = nextPos;
  }

  // Retract safe height
  nextPos = { x: currentPos.x, y: currentPos.y, z: 20 };
  rawSegments.push({
    motionType: "rapid",
    start: currentPos,
    end: nextPos,
    feedRate: 5000,
    spindleSpeed: 0,
    coolant: false,
    operationId: "op3",
    toolId: "T2",
    gcodeRaw: gcode("G0", nextPos),
    comment: "Retract for chamfer tool change",
  });
  currentPos = nextPos;

  // --- Op 4: Top Edge Chamfering ---
  // Move to pocket chamfer start (X=25, Y=15, Z=-0.5)
  nextPos = { x: pocketRect.minX, y: pocketRect.minY, z: -0.5 };
  rawSegments.push({
    motionType: "rapid",
    start: currentPos,
    end: nextPos,
    feedRate: 5000,
    spindleSpeed: 0,
    coolant: false,
    operationId: "op4",
    toolId: "T3",
    gcodeRaw: "M6 T3 (Tool Change Chamfer Mill)\n" + gcode("G0", nextPos),
    comment: "Tool change T3 & rapid to chamfer start",
  });
  currentPos = nextPos;

  // Chamfer loop around pocket border
  for (let i = 0; i < corners.length; i++) {
    nextPos = { x: corners[i].x, y: corners[i].y, z: -0.5 };
    const isCornerArc = i % 2 === 1;
    rawSegments.push({
      motionType: isCornerArc ? "arc_ccw" : "linear",
      start: currentPos,
      end: nextPos,
      feedRate: 1500,
      spindleSpeed: 10000,
      coolant: true,
      operationId: "op4",
      toolId: "T3",
      arcRadius: isCornerArc ? 5 : undefined,
      arcCenter: isCornerArc ? { x: corners[i - 1].x, y: corners[i].y, z: -0.5 } : undefined,
      gcodeRaw: gcode(isCornerArc ? "G3" : "G1", nextPos, 1500),
      comment: "Edge chamfer pass",
    });
    currentPos = nextPos;
  }

  // Park head at home position (0, 0, 30)
  nextPos = { x: 0, y: 0, z: 30 };
  rawSegments.push({
    motionType: "rapid",
    start: currentPos,
    end: nextPos,
    feedRate: 5000,
    spindleSpeed: 0,
    coolant: false,
    operationId: "op4",
    toolId: "T3",
    gcodeRaw: gcode("G0", nextPos) + "\nM30 (End of Program)",
    comment: "Program End - Park machine spindle at Z=30mm home",
  });

  return buildCamDataset({
    id: "preset-adaptive-pocket",
    name: "3D Adaptive Pocketing & Facing",
    description: "High-speed CNC milling cycle with facing, helical entry, trochoidal pocketing, wall finishing and chamfering.",
    material: "Aluminum 6061-T6",
    stock,
    tools,
    operations,
    rawSegments,
  });
}

// ---------------------------------------------------------------------------
// Preset 2: 3D Surface Relief Mold (Brass C360)
// ---------------------------------------------------------------------------
export function createMoldReliefDataset(): CamDataset {
  const stock: StockDimensions = {
    width: 100,
    length: 100,
    height: 30,
    origin: { x: 0, y: 0, z: 0 },
  };

  const tools: ToolInfo[] = [
    {
      id: "T1",
      name: "6mm Ball Nose Surface Mill",
      type: "ballnose",
      diameter: 6.0,
      length: 40,
      fluteLength: 20,
      flutes: 2,
      color: "#ec4899", // Pink
    },
  ];

  const operations = [
    {
      id: "op1",
      name: "1. 3D Wave Relief Surface Finish",
      toolId: "T1",
      color: "#ec4899",
      type: "finishing" as const,
      description: "High precision 3D organic sinusoidal surface contouring pass",
    },
  ];

  const rawSegments: RawSegmentInput[] = [];
  let currentPos = { x: 0, y: 0, z: 25 };

  // Generate 3D surface grid (raster scan in X with Y stepover)
  const numPasses = 18;
  const numStepsX = 25;

  for (let pass = 0; pass < numPasses; pass++) {
    const y = 10 + pass * (80 / (numPasses - 1));
    const isEven = pass % 2 === 0;

    for (let step = 0; step <= numStepsX; step++) {
      const xRatio = isEven ? step / numStepsX : (numStepsX - step) / numStepsX;
      const x = 10 + xRatio * 80;

      // Organic wavy 3D Z formula: ripple effect
      const distFromCenter = Math.sqrt(Math.pow(x - 50, 2) + Math.pow(y - 50, 2));
      const z = -6.0 + 4.5 * Math.cos(distFromCenter * 0.18) * Math.sin(x * 0.1);

      const nextPos = { x, y, z };
      const isRapid = pass === 0 && step === 0;

      rawSegments.push({
        motionType: isRapid ? "rapid" : "linear",
        start: currentPos,
        end: nextPos,
        feedRate: isRapid ? 5000 : 2100,
        spindleSpeed: 18000,
        coolant: true,
        operationId: "op1",
        toolId: "T1",
        gcodeRaw: gcode(isRapid ? "G0" : "G1", nextPos, isRapid ? undefined : 2100),
        comment: `3D Relief Pass ${pass + 1}/${numPasses} step ${step}`,
      });
      currentPos = nextPos;
    }
  }

  // Park spindle
  const parkPos = { x: 50, y: 50, z: 35 };
  rawSegments.push({
    motionType: "rapid",
    start: currentPos,
    end: parkPos,
    feedRate: 5000,
    spindleSpeed: 0,
    coolant: false,
    operationId: "op1",
    toolId: "T1",
    gcodeRaw: gcode("G0", parkPos) + "\nM30",
    comment: "Park toolhead at center top",
  });

  return buildCamDataset({
    id: "preset-mold-relief",
    name: "3D Mold Relief Surface Finishing",
    description: "Multi-surface 3D contouring for injection molds and sculptured organic surfaces with a ball nose endmill.",
    material: "Brass C360",
    stock,
    tools,
    operations,
    rawSegments,
  });
}

// ---------------------------------------------------------------------------
// Preset 3: Multi-Tool Aerospace Housing (Titanium 6Al-4V)
// ---------------------------------------------------------------------------
export function createAerospaceHousingDataset(): CamDataset {
  const stock: StockDimensions = {
    width: 150,
    length: 100,
    height: 40,
    origin: { x: 0, y: 0, z: 0 },
  };

  const tools: ToolInfo[] = [
    {
      id: "T1",
      name: "16mm Heavy Face Mill",
      type: "endmill",
      diameter: 16.0,
      length: 50,
      fluteLength: 20,
      flutes: 4,
      color: "#6366f1", // Indigo
    },
    {
      id: "T2",
      name: "8mm Roughing Endmill",
      type: "endmill",
      diameter: 8.0,
      length: 40,
      fluteLength: 25,
      flutes: 4,
      color: "#10b981", // Emerald
    },
    {
      id: "T3",
      name: "4.2mm Carbide Drill",
      type: "drill",
      diameter: 4.2,
      length: 35,
      fluteLength: 25,
      flutes: 2,
      color: "#f43f5e", // Rose
    },
  ];

  const operations = [
    {
      id: "op1",
      name: "1. Heavy Facing Pass",
      toolId: "T1",
      color: "#6366f1",
      type: "facing" as const,
      description: "Flatten stock top surface to Z=0.0mm reference",
    },
    {
      id: "op2",
      name: "2. Dual Internal Bore Roughing",
      toolId: "T2",
      color: "#10b981",
      type: "adaptive" as const,
      description: "Trochoidal pocketing for primary left and right mounting bores",
    },
    {
      id: "op3",
      name: "3. 4x Flange Hole Drilling",
      toolId: "T3",
      color: "#f43f5e",
      type: "drilling" as const,
      description: "G81 peck drilling sequence for M5 tapped mounting hole grid",
    },
  ];

  const rawSegments: RawSegmentInput[] = [];
  let currentPos = { x: 0, y: 0, z: 30 };

  // --- Op 1: Face Mill ---
  let nextPos = { x: -15, y: 25, z: 30 };
  rawSegments.push({
    motionType: "rapid",
    start: currentPos,
    end: nextPos,
    feedRate: 5000,
    spindleSpeed: 0,
    coolant: false,
    operationId: "op1",
    toolId: "T1",
    gcodeRaw: gcode("G0", nextPos),
    comment: "Rapid to heavy facing start",
  });
  currentPos = nextPos;

  // Plunge Z=0
  nextPos = { x: -15, y: 25, z: 0 };
  rawSegments.push({
    motionType: "linear",
    start: currentPos,
    end: nextPos,
    feedRate: 600,
    spindleSpeed: 4500,
    coolant: true,
    operationId: "op1",
    toolId: "T1",
    gcodeRaw: gcode("G1", nextPos, 600),
    comment: "Plunge facing depth Z=0.0mm",
  });
  currentPos = nextPos;

  // Face milling passes
  for (let y = 25; y <= 75; y += 25) {
    const xTarget = y % 50 === 25 ? 165 : -15;
    nextPos = { x: xTarget, y: y, z: 0 };
    rawSegments.push({
      motionType: "linear",
      start: currentPos,
      end: nextPos,
      feedRate: 1400,
      spindleSpeed: 4500,
      coolant: true,
      operationId: "op1",
      toolId: "T1",
      gcodeRaw: gcode("G1", nextPos, 1400),
      comment: `Titanium facing pass Y=${y}mm`,
    });
    currentPos = nextPos;
  }

  // Retract
  nextPos = { x: currentPos.x, y: currentPos.y, z: 25 };
  rawSegments.push({
    motionType: "rapid",
    start: currentPos,
    end: nextPos,
    feedRate: 5000,
    spindleSpeed: 0,
    coolant: false,
    operationId: "op1",
    toolId: "T1",
    gcodeRaw: gcode("G0", nextPos),
    comment: "Retract for T2 tool change",
  });
  currentPos = nextPos;

  // --- Op 2: Bore roughing (2 Bores at X=45, Y=50 and X=105, Y=50) ---
  const bores = [
    { x: 45, y: 50, radius: 18 },
    { x: 105, y: 50, radius: 18 },
  ];

  bores.forEach((bore, bIdx) => {
    nextPos = { x: bore.x, y: bore.y, z: 10 };
    rawSegments.push({
      motionType: "rapid",
      start: currentPos,
      end: nextPos,
      feedRate: 5000,
      spindleSpeed: 0,
      coolant: false,
      operationId: "op2",
      toolId: "T2",
      gcodeRaw: bIdx === 0 ? "M6 T2 (Tool Change 8mm Endmill)\n" + gcode("G0", nextPos) : gcode("G0", nextPos),
      comment: `Rapid to Bore ${bIdx + 1} center`,
    });
    currentPos = nextPos;

    // Helical entry down to Z=-15mm
    for (let step = 1; step <= 12; step++) {
      const angle = (step * Math.PI) / 2;
      const z = 2 - (step / 12) * 17;
      const hx = bore.x + 6 * Math.cos(angle);
      const hy = bore.y + 6 * Math.sin(angle);
      nextPos = { x: hx, y: hy, z: z };

      rawSegments.push({
        motionType: "arc_ccw",
        start: currentPos,
        end: nextPos,
        feedRate: 900,
        spindleSpeed: 8000,
        coolant: true,
        operationId: "op2",
        toolId: "T2",
        arcCenter: { x: bore.x, y: bore.y, z: 0 },
        arcRadius: 6,
        gcodeRaw: gcode("G3", nextPos, 900),
        comment: `Bore ${bIdx + 1} Helical plunge Z=${z.toFixed(1)}`,
      });
      currentPos = nextPos;
    }

    // Circular expansion passes
    for (let r = 8; r <= bore.radius; r += 5) {
      for (let s = 1; s <= 8; s++) {
        const angle = (s * Math.PI) / 4;
        const bx = bore.x + r * Math.cos(angle);
        const by = bore.y + r * Math.sin(angle);
        nextPos = { x: bx, y: by, z: -15 };

        rawSegments.push({
          motionType: "arc_ccw",
          start: currentPos,
          end: nextPos,
          feedRate: 1500,
          spindleSpeed: 8000,
          coolant: true,
          operationId: "op2",
          toolId: "T2",
          arcCenter: { x: bore.x, y: bore.y, z: -15 },
          arcRadius: r,
          gcodeRaw: gcode("G3", nextPos, 1500),
          comment: `Bore ${bIdx + 1} expansion r=${r}mm`,
        });
        currentPos = nextPos;
      }
    }

    // Retract
    nextPos = { x: currentPos.x, y: currentPos.y, z: 15 };
    rawSegments.push({
      motionType: "rapid",
      start: currentPos,
      end: nextPos,
      feedRate: 5000,
      spindleSpeed: 8000,
      coolant: false,
      operationId: "op2",
      toolId: "T2",
      gcodeRaw: gcode("G0", nextPos),
      comment: `Clear bore ${bIdx + 1}`,
    });
    currentPos = nextPos;
  });

  // --- Op 3: 4x Flange Hole Drilling ---
  const holeGrid = [
    { x: 20, y: 20 },
    { x: 130, y: 20 },
    { x: 130, y: 80 },
    { x: 20, y: 80 },
  ];

  holeGrid.forEach((hole, hIdx) => {
    // Rapid to hole X, Y
    nextPos = { x: hole.x, y: hole.y, z: 10 };
    rawSegments.push({
      motionType: "rapid",
      start: currentPos,
      end: nextPos,
      feedRate: 5000,
      spindleSpeed: 0,
      coolant: false,
      operationId: "op3",
      toolId: "T3",
      gcodeRaw: hIdx === 0 ? "M6 T3 (Tool Change 4.2mm Drill)\n" + gcode("G0", nextPos) : gcode("G0", nextPos),
      comment: `Rapid to Hole ${hIdx + 1} location (${hole.x}, ${hole.y})`,
    });
    currentPos = nextPos;

    // Drill peck cycle down to Z=-20mm
    const pecks = 4;
    for (let p = 1; p <= pecks; p++) {
      const pDepth = -(p * 5);
      // Peck down
      nextPos = { x: hole.x, y: hole.y, z: pDepth };
      rawSegments.push({
        motionType: "linear",
        start: currentPos,
        end: nextPos,
        feedRate: 450,
        spindleSpeed: 5000,
        coolant: true,
        operationId: "op3",
        toolId: "T3",
        gcodeRaw: gcode("G81", nextPos, 450),
        comment: `Peck ${p}/${pecks} to Z=${pDepth}mm`,
      });
      currentPos = nextPos;

      // Retract chip clear
      nextPos = { x: hole.x, y: hole.y, z: 2 };
      rawSegments.push({
        motionType: "rapid",
        start: currentPos,
        end: nextPos,
        feedRate: 5000,
        spindleSpeed: 5000,
        coolant: true,
        operationId: "op3",
        toolId: "T3",
        gcodeRaw: gcode("G0", nextPos),
        comment: "Drill peck chip break retract",
      });
      currentPos = nextPos;
    }
  });

  // Final park home
  nextPos = { x: 0, y: 0, z: 40 };
  rawSegments.push({
    motionType: "rapid",
    start: currentPos,
    end: nextPos,
    feedRate: 5000,
    spindleSpeed: 0,
    coolant: false,
    operationId: "op3",
    toolId: "T3",
    gcodeRaw: gcode("G0", nextPos) + "\nM30",
    comment: "Aerospace Housing Program End",
  });

  return buildCamDataset({
    id: "preset-aerospace-housing",
    name: "Multi-Tool Aerospace Housing",
    description: "4-axis aerospace titanium bracket machining with face milling, dual bore roughing, and G81 flange hole drilling.",
    material: "Titanium 6Al-4V",
    stock,
    tools,
    operations,
    rawSegments,
  });
}

export const CAM_PRESETS: Record<string, () => CamDataset> = {
  "adaptive-pocket": createAdaptivePocketDataset,
  "mold-relief": createMoldReliefDataset,
  "aerospace-housing": createAerospaceHousingDataset,
};
