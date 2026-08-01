import type { ToolMeta } from "../../../types/tool";

export const meta: ToolMeta = {
  slug: "mesh",
  name: "mr mesh",
  tagline: "Convert 3D: STL, OBJ, PLY, GLTF. Report triangle counts, fix normals, live preview.",
  description: "Convert 3D mesh files between STL, OBJ, PLY, and GLTF formats. Report triangle counts and bounding boxes, fix flipped normals and duplicate vertices with repair logging. Live WebGL preview shows the mesh before export. Runs entirely in your browser.",
  tags: ["3d", "stl", "obj", "ply", "gltf", "mesh", "convert", "repair", "preview"],
  icon: "code",
  difficulty: "Hard",
  offline: true,
  related: ["geo", "archive"],
};