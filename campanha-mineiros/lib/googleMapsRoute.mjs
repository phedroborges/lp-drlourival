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
