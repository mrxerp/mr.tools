import type { ToolMeta } from "../../../types/tool";

export const meta: ToolMeta = {
  slug: "geo",
  name: "mr geo",
  tagline: "Convert GPS: GPX, KML, GeoJSON, CSV. Reproject, simplify, merge, elevation preview.",
  description: "Convert GPS data between GPX, KML, GeoJSON, and CSV coordinate formats. Reproject coordinate systems, simplify tracks by distance, merge multiple files into one route, and preview elevation profiles. Runs entirely in your browser.",
  tags: ["gps", "gpx", "kml", "geojson", "csv", "convert", "reproject", "elevation"],
  icon: "data",
  difficulty: "Medium",
  offline: true,
  related: ["archive", "mesh"],
};