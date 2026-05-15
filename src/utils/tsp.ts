export type Coordinate = [number, number];

export interface OptimizedRouteResult {
  origin: Coordinate;
  orderedStops: Coordinate[];
  loop: Coordinate[];
  totalDistance: number;
}

function euclideanDistance(a: Coordinate, b: Coordinate): number {
  const dx = a[0] - b[0];
  const dy = a[1] - b[1];
  return Math.sqrt(dx * dx + dy * dy);
}

export function parseCoordinateString(origin: string): Coordinate {
  const [lat, lng] = origin.split(',').map(Number);
  if (Number.isNaN(lat) || Number.isNaN(lng)) {
    throw new Error(`Invalid origin coordinate string: ${origin}`);
  }
  return [lat, lng];
}

/**
 * Greedy nearest-neighbor TSP approximation.
 * - Starts at the origin
 * - Repeatedly picks the closest remaining stop
 * - Returns to origin to form a loop
 */
export function optimizeTankerLoop(originCoordString: string, targets: Coordinate[]): OptimizedRouteResult {
  const origin = parseCoordinateString(originCoordString);
  if (targets.length === 0) {
    return {
      origin,
      orderedStops: [],
      loop: [origin],
      totalDistance: 0,
    };
  }

  const remaining = [...targets];
  const orderedStops: Coordinate[] = [];
  let current = origin;
  let totalDistance = 0;

  while (remaining.length > 0) {
    let nearestIndex = 0;
    let nearestDistance = euclideanDistance(current, remaining[0]);

    for (let i = 1; i < remaining.length; i += 1) {
      const dist = euclideanDistance(current, remaining[i]);
      if (dist < nearestDistance) {
        nearestDistance = dist;
        nearestIndex = i;
      }
    }

    const next = remaining.splice(nearestIndex, 1)[0];
    orderedStops.push(next);
    totalDistance += nearestDistance;
    current = next;
  }

  totalDistance += euclideanDistance(current, origin);

  return {
    origin,
    orderedStops,
    loop: [origin, ...orderedStops, origin],
    totalDistance,
  };
}

/**
 * Densifies a path so a marker can animate by snapping through many small points.
 * This creates a smoother movement path for the tanker.
 */
export function densifyPath(path: Coordinate[], subdivisions = 12): Coordinate[] {
  if (path.length <= 1) return path;

  const dense: Coordinate[] = [];

  for (let i = 0; i < path.length - 1; i += 1) {
    const start = path[i];
    const end = path[i + 1];

    for (let step = 0; step < subdivisions; step += 1) {
      const t = step / subdivisions;
      dense.push([
        start[0] + (end[0] - start[0]) * t,
        start[1] + (end[1] - start[1]) * t,
      ]);
    }
  }

  dense.push(path[path.length - 1]);
  return dense;
}
