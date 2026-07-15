const GOOGLE_MAPS_DIRECTIONS_URL = "https://www.google.com/maps/dir/";
const MAX_POINTS_PER_SEGMENT = 5;

function coordinate(point) {
  return `${point.lat},${point.lng}`;
}

export function googleMapsUrl(points) {
  if (!Array.isArray(points) || points.length < 2) return "";

  const parameters = new URLSearchParams({
    api: "1",
    origin: coordinate(points[0]),
    destination: coordinate(points.at(-1)),
    travelmode: "driving",
  });
  const waypoints = points.slice(1, -1).map(coordinate);
  if (waypoints.length) parameters.set("waypoints", waypoints.join("|"));

  return `${GOOGLE_MAPS_DIRECTIONS_URL}?${parameters.toString()}`;
}

function pointImportance(previous, current, next) {
  const ax = Number(previous.lng);
  const ay = Number(previous.lat);
  const bx = Number(next.lng);
  const by = Number(next.lat);
  const px = Number(current.lng);
  const py = Number(current.lat);
  const dx = bx - ax;
  const dy = by - ay;

  if (dx === 0 && dy === 0) return Math.hypot(px - ax, py - ay);
  const projection = Math.max(0, Math.min(1, ((px - ax) * dx + (py - ay) * dy) / (dx * dx + dy * dy)));
  return Math.hypot(px - (ax + projection * dx), py - (ay + projection * dy));
}

export function simplifyRoutePoints(points, maximum = MAX_POINTS_PER_SEGMENT) {
  if (!Array.isArray(points)) return [];
  const simplified = [...points];

  while (simplified.length > maximum) {
    let removeIndex = 1;
    let lowestImportance = Number.POSITIVE_INFINITY;
    for (let index = 1; index < simplified.length - 1; index += 1) {
      const importance = pointImportance(simplified[index - 1], simplified[index], simplified[index + 1]);
      if (importance < lowestImportance) {
        lowestImportance = importance;
        removeIndex = index;
      }
    }
    simplified.splice(removeIndex, 1);
  }

  return simplified;
}

export function googleMapsMobileUrl(points) {
  return googleMapsUrl(simplifyRoutePoints(points));
}

export function googleMapsSegments(points) {
  if (!Array.isArray(points) || points.length < 2) return [];

  const segments = [];
  let cursor = 0;
  while (cursor < points.length - 1) {
    const segment = points.slice(cursor, cursor + MAX_POINTS_PER_SEGMENT);
    segments.push(googleMapsUrl(segment));
    cursor += segment.length - 1;
  }
  return segments;
}
