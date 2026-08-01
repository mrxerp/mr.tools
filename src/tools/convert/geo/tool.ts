export interface GeoPoint {
  lat: number;
  lon: number;
  ele?: number;
  time?: string;
  name?: string;
  desc?: string;
}

export interface GeoTrack {
  name: string;
  points: GeoPoint[];
  color?: string;
}

export interface GeoData {
  tracks: GeoTrack[];
  waypoints: GeoPoint[];
  bounds: { minLat: number; maxLat: number; minLon: number; maxLon: number; minEle?: number; maxEle?: number };
  metadata: { name?: string; author?: string; desc?: string; time?: string };
}

export interface ConvertOptions {
  inputFormat: "gpx" | "kml" | "geojson" | "csv";
  outputFormat: "gpx" | "kml" | "geojson" | "csv";
  simplifyTolerance?: number;
  reproject?: "wgs84" | "webmercator";
  mergeTracks?: boolean;
}

const R = 6371000;

export function parseGeo(data: string, format: "gpx" | "kml" | "geojson" | "csv"): GeoData {
  switch (format) {
    case "gpx": return parseGpx(data);
    case "kml": return parseKml(data);
    case "geojson": return parseGeoJSON(data);
    case "csv": return parseCsv(data);
    default: throw new Error(`Unsupported input format: ${format}`);
  }
}

function parseGpx(xml: string): GeoData {
  const doc = new DOMParser().parseFromString(xml, "application/xml");
  const tracks: GeoTrack[] = [];
  const waypoints: GeoPoint[] = [];

  doc.querySelectorAll("trk").forEach((trk, i) => {
    const name = trk.querySelector("name")?.textContent?.trim() || `Track ${i + 1}`;
    const points: GeoPoint[] = [];
    trk.querySelectorAll("trkpt").forEach(pt => {
      const lat = parseFloat(pt.getAttribute("lat") || "0");
      const lon = parseFloat(pt.getAttribute("lon") || "0");
      const ele = pt.querySelector("ele")?.textContent ? parseFloat(pt.querySelector("ele")!.textContent!) : undefined;
      const time = pt.querySelector("time")?.textContent?.trim();
      points.push({ lat, lon, ele, time });
    });
    if (points.length) tracks.push({ name, points });
  });

  doc.querySelectorAll("wpt").forEach(wpt => {
    const lat = parseFloat(wpt.getAttribute("lat") || "0");
    const lon = parseFloat(wpt.getAttribute("lon") || "0");
    const name = wpt.querySelector("name")?.textContent?.trim();
    const desc = wpt.querySelector("desc")?.textContent?.trim();
    waypoints.push({ lat, lon, name, desc });
  });

  const metadata = {
    name: doc.querySelector("metadata > name")?.textContent?.trim(),
    author: doc.querySelector("metadata > author > name")?.textContent?.trim(),
    desc: doc.querySelector("metadata > desc")?.textContent?.trim(),
    time: doc.querySelector("metadata > time")?.textContent?.trim(),
  };

  return buildGeoData(tracks, waypoints, metadata);
}

function parseKml(xml: string): GeoData {
  const doc = new DOMParser().parseFromString(xml, "application/xml");
  const tracks: GeoTrack[] = [];
  const waypoints: GeoPoint[] = [];

  doc.querySelectorAll("Placemark").forEach(placemark => {
    const name = placemark.querySelector("name")?.textContent?.trim() || "Placemark";
    const desc = placemark.querySelector("description")?.textContent?.trim();

    const lineString = placemark.querySelector("LineString");
    if (lineString) {
      const coordsText = lineString.querySelector("coordinates")?.textContent?.trim() || "";
      const points = coordsText.split(/\s+/).filter(Boolean).map(c => {
        const [lon, lat, ele] = c.split(",").map(parseFloat);
        return { lat, lon, ele };
      });
      if (points.length) tracks.push({ name, points });
      return;
    }

    const point = placemark.querySelector("Point");
    if (point) {
      const coordsText = point.querySelector("coordinates")?.textContent?.trim() || "";
      const [lon, lat, ele] = coordsText.split(",").map(parseFloat);
      waypoints.push({ lat, lon, ele, name, desc });
    }
  });

  return buildGeoData(tracks, waypoints, {});
}

function parseGeoJSON(json: string): GeoData {
  const data = JSON.parse(json);
  const tracks: GeoTrack[] = [];
  const waypoints: GeoPoint[] = [];

  const features = data.type === "FeatureCollection" ? data.features : [data];

  for (const feature of features) {
    const geom = feature.geometry;
    const props = feature.properties || {};
    const name = props.name || props.title || "Feature";

    if (geom?.type === "LineString" || geom?.type === "MultiLineString") {
      const coords = geom.type === "LineString" ? [geom.coordinates] : geom.coordinates;
      for (const line of coords) {
        const points = line.map(([lon, lat, ele]: number[]) => ({ lat, lon, ele }));
        tracks.push({ name, points, color: props.color || props.stroke });
      }
    } else if (geom?.type === "Point") {
      const [lon, lat, ele] = geom.coordinates;
      waypoints.push({ lat, lon, ele, name, desc: props.description });
    }
  }

  return buildGeoData(tracks, waypoints, { name: data.name });
}

function parseCsv(text: string): GeoData {
  const lines = text.trim().split(/\r?\n/);
  if (lines.length < 2) throw new Error("CSV must have header and at least one row");

  const headers = lines[0].split(",").map(h => h.trim().toLowerCase());
  const latIdx = headers.findIndex(h => ["lat", "latitude", "y"].includes(h));
  const lonIdx = headers.findIndex(h => ["lon", "lng", "longitude", "x"].includes(h));
  const eleIdx = headers.findIndex(h => ["ele", "elevation", "alt", "z"].includes(h));
  const timeIdx = headers.findIndex(h => ["time", "timestamp", "date"].includes(h));
  const nameIdx = headers.findIndex(h => ["name", "title"].includes(h));

  if (latIdx === -1 || lonIdx === -1) throw new Error("CSV must have lat/latitude/y and lon/lng/longitude/x columns");

  const points: GeoPoint[] = [];
  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(",");
    const lat = parseFloat(cols[latIdx]?.trim());
    const lon = parseFloat(cols[lonIdx]?.trim());
    if (isNaN(lat) || isNaN(lon)) continue;
    const pt: GeoPoint = { lat, lon };
    if (eleIdx >= 0) pt.ele = parseFloat(cols[eleIdx]?.trim());
    if (timeIdx >= 0) pt.time = cols[timeIdx]?.trim();
    if (nameIdx >= 0) pt.name = cols[nameIdx]?.trim();
    points.push(pt);
  }

  return buildGeoData(points.length ? [{ name: "CSV Track", points }] : [], [], {});
}

function buildGeoData(tracks: GeoTrack[], waypoints: GeoPoint[], metadata: any): GeoData {
  let minLat = 90, maxLat = -90, minLon = 180, maxLon = -180;
  let minEle: number | undefined, maxEle: number | undefined;

  for (const t of tracks) {
    for (const p of t.points) {
      minLat = Math.min(minLat, p.lat);
      maxLat = Math.max(maxLat, p.lat);
      minLon = Math.min(minLon, p.lon);
      maxLon = Math.max(maxLon, p.lon);
      if (p.ele !== undefined) {
        minEle = minEle === undefined ? p.ele : Math.min(minEle, p.ele);
        maxEle = maxEle === undefined ? p.ele : Math.max(maxEle, p.ele);
      }
    }
  }
  for (const p of waypoints) {
    minLat = Math.min(minLat, p.lat);
    maxLat = Math.max(maxLat, p.lat);
    minLon = Math.min(minLon, p.lon);
    maxLon = Math.max(maxLon, p.lon);
    if (p.ele !== undefined) {
      minEle = minEle === undefined ? p.ele : Math.min(minEle, p.ele);
      maxEle = maxEle === undefined ? p.ele : Math.max(maxEle, p.ele);
    }
  }

  return { tracks, waypoints, bounds: { minLat, maxLat, minLon, maxLon, minEle, maxEle }, metadata };
}

export function convertGeo(data: GeoData, options: ConvertOptions): string {
  let processed = { ...data, tracks: [...data.tracks] };

  if (options.simplifyTolerance && options.simplifyTolerance > 0) {
    processed.tracks = processed.tracks.map(t => ({
      ...t,
      points: simplifyTrack(t.points, options.simplifyTolerance!),
    }));
  }

  if (options.mergeTracks && processed.tracks.length > 1) {
    const mergedPoints = processed.tracks.flatMap(t => t.points);
    processed.tracks = [{ name: "Merged Track", points: mergedPoints }];
  }

  switch (options.outputFormat) {
    case "gpx": return toGpx(processed);
    case "kml": return toKml(processed);
    case "geojson": return toGeoJSON(processed);
    case "csv": return toCsv(processed);
    default: throw new Error(`Unsupported output format: ${options.outputFormat}`);
  }
}

function simplifyTrack(points: GeoPoint[], tolerance: number): GeoPoint[] {
  if (points.length <= 2) return points;
  const simplified: GeoPoint[] = [points[0]];
  for (let i = 1; i < points.length - 1; i++) {
    const dist = haversine(points[i - 1], points[i]) + haversine(points[i], points[i + 1]) - haversine(points[i - 1], points[i + 1]);
    if (dist > tolerance) simplified.push(points[i]);
  }
  simplified.push(points[points.length - 1]);
  return simplified;
}

function haversine(a: GeoPoint, b: GeoPoint): number {
  const dLat = (b.lat - a.lat) * Math.PI / 180;
  const dLon = (b.lon - a.lon) * Math.PI / 180;
  const lat1 = a.lat * Math.PI / 180;
  const lat2 = b.lat * Math.PI / 180;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

function toGpx(data: GeoData): string {
  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n<gpx version="1.1" creator="mr.geo" xmlns="http://www.topografix.com/GPX/1/1">\n';
  if (data.metadata.name) xml += `  <metadata><name>${escapeXml(data.metadata.name)}</name></metadata>\n`;
  for (const t of data.tracks) {
    xml += `  <trk>\n    <name>${escapeXml(t.name)}</name>\n    <trkseg>\n`;
    for (const p of t.points) {
      xml += `      <trkpt lat="${p.lat}" lon="${p.lon}">`;
      if (p.ele !== undefined) xml += `<ele>${p.ele}</ele>`;
      if (p.time) xml += `<time>${escapeXml(p.time)}</time>`;
      xml += `</trkpt>\n`;
    }
    xml += `    </trkseg>\n  </trk>\n`;
  }
  for (const w of data.waypoints) {
    xml += `  <wpt lat="${w.lat}" lon="${w.lon}">`;
    if (w.name) xml += `<name>${escapeXml(w.name)}</name>`;
    if (w.desc) xml += `<desc>${escapeXml(w.desc)}</desc>`;
    xml += `</wpt>\n`;
  }
  xml += "</gpx>";
  return xml;
}

function toKml(data: GeoData): string {
  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n<kml xmlns="http://www.opengis.net/kml/2.2">\n<Document>\n';
  if (data.metadata.name) xml += `  <name>${escapeXml(data.metadata.name)}</name>\n`;
  for (const t of data.tracks) {
    xml += `  <Placemark>\n    <name>${escapeXml(t.name)}</name>\n    <LineString>\n      <coordinates>`;
    xml += t.points.map(p => `${p.lon},${p.lat}${p.ele !== undefined ? "," + p.ele : ""}`).join(" ");
    xml += `</coordinates>\n    </LineString>\n  </Placemark>\n`;
  }
  for (const w of data.waypoints) {
    xml += `  <Placemark>\n    <name>${escapeXml(w.name || "Waypoint")}</name>`;
    if (w.desc) xml += `<description>${escapeXml(w.desc)}</description>`;
    xml += `\n    <Point>\n      <coordinates>${w.lon},${w.lat}${w.ele !== undefined ? "," + w.ele : ""}</coordinates>\n    </Point>\n  </Placemark>\n`;
  }
  xml += "</Document>\n</kml>";
  return xml;
}

function toGeoJSON(data: GeoData): string {
  const features = [];
  for (const t of data.tracks) {
    features.push({
      type: "Feature",
      properties: { name: t.name, color: t.color },
      geometry: { type: "LineString", coordinates: t.points.map(p => [p.lon, p.lat, p.ele].filter(v => v !== undefined)) },
    });
  }
  for (const w of data.waypoints) {
    features.push({
      type: "Feature",
      properties: { name: w.name, description: w.desc },
      geometry: { type: "Point", coordinates: [w.lon, w.lat, w.ele].filter(v => v !== undefined) },
    });
  }
  return JSON.stringify({ type: "FeatureCollection", features }, null, 2);
}

function toCsv(data: GeoData): string {
  const rows = ["lat,lon,ele,time,name,desc,track"];
  for (const t of data.tracks) {
    for (const p of t.points) {
      rows.push(`${p.lat},${p.lon},${p.ele ?? ""},${p.time ?? ""},${escapeCsv(p.name)},${escapeCsv(p.desc)},${escapeCsv(t.name)}`);
    }
  }
  for (const w of data.waypoints) {
    rows.push(`${w.lat},${w.lon},${w.ele ?? ""},${w.time ?? ""},${escapeCsv(w.name)},${escapeCsv(w.desc)},waypoint`);
  }
  return rows.join("\n");
}

function escapeXml(s: string): string {
  return s.replace(/&/g, "&").replace(/</g, "<").replace(/>/g, ">").replace(/"/g, "\"").replace(/'/g, "'");
}

function escapeCsv(s: string | undefined): string {
  if (!s) return "";
  if (s.includes(",") || s.includes('"') || s.includes("\n")) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

export function getElevationProfile(track: GeoTrack): Array<{ dist: number; ele: number }> {
  if (track.points.length < 2) return [];
  const profile = [{ dist: 0, ele: track.points[0].ele || 0 }];
  let totalDist = 0;
  for (let i = 1; i < track.points.length; i++) {
    totalDist += haversine(track.points[i - 1], track.points[i]);
    profile.push({ dist: totalDist, ele: track.points[i].ele || 0 });
  }
  return profile;
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}