import type { Toolpath } from '../types/cad';

export const SAMPLE_TOOLPATHS: Record<string, Toolpath> = {
  pocketAndContour: {
    id: 'pocketAndContour',
    name: '2.5D Pocket & Outline Contour',
    description: 'Rectangular pocket machining followed by perimeter contouring pass.',
    estimatedTimeSec: 120,
    stockDimensions: { width: 100, height: 20, depth: 80 },
    points: [
      // Home/Rapid positioning above stock
      { x: 0, y: 30, z: 0, feedRate: 3000, type: 'rapid' },
      { x: -30, y: 30, z: -25, feedRate: 3000, type: 'rapid' },

      // Plunge to first pocket layer (z = 5 in model coords, where top surface is z=10, depth is -10 to +10)
      { x: -30, y: 5, z: -25, feedRate: 500, type: 'plunge' },
      // Pocket Spiral/Clearing pass 1
      { x: -30, y: 5, z: 25, feedRate: 1200, type: 'cut' },
      { x: 30, y: 5, z: 25, feedRate: 1200, type: 'cut' },
      { x: 30, y: 5, z: -25, feedRate: 1200, type: 'cut' },
      { x: -30, y: 5, z: -25, feedRate: 1200, type: 'cut' },

      // Inner pocket pass
      { x: -20, y: 5, z: -15, feedRate: 1200, type: 'cut' },
      { x: -20, y: 5, z: 15, feedRate: 1200, type: 'cut' },
      { x: 20, y: 5, z: 15, feedRate: 1200, type: 'cut' },
      { x: 20, y: 5, z: -15, feedRate: 1200, type: 'cut' },
      { x: -20, y: 5, z: -15, feedRate: 1200, type: 'cut' },

      // Deep Pocket Plunge (z = 0)
      { x: -20, y: 0, z: -15, feedRate: 400, type: 'plunge' },
      { x: -20, y: 0, z: 15, feedRate: 1000, type: 'cut' },
      { x: 20, y: 0, z: 15, feedRate: 1000, type: 'cut' },
      { x: 20, y: 0, z: -15, feedRate: 1000, type: 'cut' },
      { x: -20, y: 0, z: -15, feedRate: 1000, type: 'cut' },

      // Retract
      { x: -20, y: 25, z: -15, feedRate: 3000, type: 'retract' },

      // Move to Contour Start
      { x: -45, y: 25, z: -35, feedRate: 3000, type: 'rapid' },
      { x: -45, y: -5, z: -35, feedRate: 500, type: 'plunge' },

      // Perimeter Contour Chamfered/Rounded Cut
      { x: 45, y: -5, z: -35, feedRate: 1500, type: 'cut' },
      { x: 45, y: -5, z: 35, feedRate: 1500, type: 'cut' },
      { x: -45, y: -5, z: 35, feedRate: 1500, type: 'cut' },
      { x: -45, y: -5, z: -35, feedRate: 1500, type: 'cut' },

      // Finishing Depth Pass (-8)
      { x: -45, y: -8, z: -35, feedRate: 400, type: 'plunge' },
      { x: 45, y: -8, z: -35, feedRate: 1800, type: 'cut' },
      { x: 45, y: -8, z: 35, feedRate: 1800, type: 'cut' },
      { x: -45, y: -8, z: 35, feedRate: 1800, type: 'cut' },
      { x: -45, y: -8, z: -35, feedRate: 1800, type: 'cut' },

      // Final retract to safe height
      { x: -45, y: 30, z: -35, feedRate: 3000, type: 'retract' },
      { x: 0, y: 35, z: 0, feedRate: 3000, type: 'rapid' },
    ],
  },
  logoEngraving: {
    id: 'logoEngraving',
    name: '3D Spiral Engraving',
    description: 'Helical circular milling and surfacing toolpath pattern.',
    estimatedTimeSec: 90,
    stockDimensions: { width: 100, height: 20, depth: 80 },
    points: (() => {
      const pts: Toolpath['points'] = [];
      pts.push({ x: 0, y: 30, z: 0, feedRate: 3000, type: 'rapid' });

      // Generate spiral points
      const loops = 8;
      const pointsPerLoop = 20;
      const maxRadius = 35;

      for (let i = 0; i <= loops * pointsPerLoop; i++) {
        const angle = (i / pointsPerLoop) * Math.PI * 2;
        const progress = i / (loops * pointsPerLoop);
        const radius = progress * maxRadius;
        const x = Math.cos(angle) * radius;
        const z = Math.sin(angle) * radius;
        const y = 10 - Math.sin(progress * Math.PI) * 12; // Curved cut depth profile

        if (i === 0) {
          pts.push({ x, y: 25, z, feedRate: 3000, type: 'rapid' });
          pts.push({ x, y, z, feedRate: 600, type: 'plunge' });
        } else {
          pts.push({ x, y, z, feedRate: 1600, type: 'cut' });
        }
      }

      const last = pts[pts.length - 1];
      pts.push({ x: last.x, y: 30, z: last.z, feedRate: 3000, type: 'retract' });
      pts.push({ x: 0, y: 35, z: 0, feedRate: 3000, type: 'rapid' });
      return pts;
    })(),
  },
};
