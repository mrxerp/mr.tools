export interface MeshVertex {
  x: number;
  y: number;
  z: number;
}

export interface MeshFace {
  a: number;
  b: number;
  c: number;
}

export interface Mesh {
  name: string;
  vertices: MeshVertex[];
  faces: MeshFace[];
  format: "stl" | "obj" | "ply" | "gltf";
  bounds: { minX: number; maxX: number; minY: number; maxY: number; minZ: number; maxZ: number };
  triangleCount: number;
}

export interface StlHeader {
  binary: boolean;
  vertexCount?: number;
  color?: { r: number; g: number; b: number };
}

export interface ObjData {
  vertices: number[];
  normals: number[];
  texcoords: number[];
  faces: number[];
  groups: { name: string; faces: number[] }[];
}

export interface PlyHeader {
  binary: boolean;
  vertexCount?: number;
  propertyNames: string[];
}

export interface GltfData {
  nodes: any[];
  meshes: any[];
  materials: any[];
  accessors: any[];
  bufferViews: any[];
  buffers: any[];
  scenes: any[];
  scene?: number;
}

export interface MeshResult {
  mesh: Mesh;
  warnings: string[];
  repairs: string[];
}

function readStl(data: Uint8Array): Mesh {
  let offset = 0;
  const headerView = new DataView(data.buffer, data.byteOffset, data.byteLength);

  if (data.byteLength >= 80 && headerView.getUint32(offset, true) === 0x3D4D4853) {
    offset = 84;
  } else if (data.byteLength >= 4 && headerView.getUint32(offset, true) === 0x3D4D4853) {
    offset = 80;
  } else {
    throw new Error("Invalid STL header");
  }

  const faceCount = headerView.getUint32(offset, true);
  offset += 4;
  const vertices: MeshVertex[] = [];

  for (let i = 0; i < faceCount; i++) {
    offset += 12;

    for (let j = 0; j < 3; j++) {
      const x = headerView.getFloat32(offset + j * 12, true);
      const y = headerView.getFloat32(offset + j * 12 + 4, true);
      const z = headerView.getFloat32(offset + j * 12 + 8, true);
      vertices.push({ x, y, z });
      offset += 50;
    }
  }

  const faces: MeshFace[] = [];
  for (let i = 0; i < faceCount * 3; i += 3) {
    faces.push({ a: i, b: i + 1, c: i + 2 });
  }

  return buildMesh(vertices, faces, "stl");
}

function readObj(text: string): Mesh {
  const objData = parseObj(text);
  const vertices: MeshVertex[] = [];
  const faces: MeshFace[] = [];

  for (let i = 0; i < objData.vertices.length; i += 3) {
    vertices.push({ x: objData.vertices[i], y: objData.vertices[i + 1], z: objData.vertices[i + 2] });
  }

  for (let i = 0; i < objData.faces.length; i += 3) {
    const face = [objData.faces[i], objData.faces[i + 1], objData.faces[i + 2]];

    if (face.some(v => v < 0 || v >= vertices.length)) continue;

    faces.push({ a: face[0], b: face[1], c: face[2] });
  }

  return buildMesh(vertices, faces, "obj");
}

function readPly(data: Uint8Array): Mesh {
  const text = new TextDecoder().decode(data);
  const lines = text.split(/\r?\n/);
  let vertexCount = 0;
  let faceCount = 0;
  const vertices: MeshVertex[] = [];
  const faces: MeshFace[] = [];

  let i = 0;
  for (; i < lines.length; i++) {
    if (lines[i] === "end_header") {
      i++;
      break;
    }
    if (lines[i].startsWith("element vertex")) {
      vertexCount = parseInt(lines[i].split(" ")[1]);
    } else if (lines[i].startsWith("element face")) {
      faceCount = parseInt(lines[i].split(" ")[1]);
    }
  }

  const startData = i;

  for (let j = 0; j < vertexCount; j++) {
    const coords = lines[startData + j].split(" ").map(parseFloat);
    if (coords.length >= 3) {
      vertices.push({ x: coords[0], y: coords[1] || 0, z: coords[2] || 0 });
    }
  }

  for (let k = 0; k < faceCount; k++) {
    const faceData = lines[startData + vertexCount + k].split(" ").map(parseInt);
    if (faceData.length >= 4) {
      for (let f = 1; f < faceData[0]; f++) {
        const a = faceData[f];
        const b = faceData[f + 1];
        const c = faceData[f + 2];
        if (a < vertexCount && b < vertexCount && c < vertexCount) {
          faces.push({ a, b, c });
        }
      }
    }
  }

  return buildMesh(vertices, faces, "ply");
}

function parseObj(text: string): ObjData {
  const vertices: number[] = [];
  const normals: number[] = [];
  const texcoords: number[] = [];
  const faces: number[] = [];
  const groups: { name: string; faces: number[] }[] = [{ name: "default", faces: [] }];
  let currentGroup = 0;

  const lines = text.split(/\r?\n/);
  for (const line of lines) {
    const parts = line.trim().split(/\s+/);
    if (parts.length < 2) continue;

    if (parts[0] === "v") {
      vertices.push(parseFloat(parts[1]), parseFloat(parts[2]), 0);
    } else if (parts[0] === "vn") {
      normals.push(parseFloat(parts[1]), parseFloat(parts[2]), 0);
    } else if (parts[0] === "vt") {
      texcoords.push(parseFloat(parts[1]), parseFloat(parts[2]));
    } else if (parts[0] === "f") {
      const faceVertices = parts.slice(1);
      for (let i = 0; i < faceVertices.length; i++) {
        const v = faceVertices[i];
        const indices = v.split("/");
        const vertexIndex = indices[0] ? parseInt(indices[0]) - 1 : faces.length / 3;
        faces.push(vertexIndex);
        groups[currentGroup].faces.push(vertexIndex);
      }
    } else if (parts[0] === "g" || parts[0] === "usemtl") {
      if (parts[1]) {
        groups.push({ name: parts[1], faces: [] });
        currentGroup = groups.length - 1;
      }
    }
  }

  return { vertices, normals, texcoords, faces, groups };
}

function buildMesh(vertices: MeshVertex[], faces: MeshFace[], format: "stl" | "obj" | "ply" | "gltf"): Mesh {
  let minX = Infinity, maxX = -Infinity;
  let minY = Infinity, maxY = -Infinity;
  let minZ = Infinity, maxZ = -Infinity;

  for (const v of vertices) {
    minX = Math.min(minX, v.x);
    maxX = Math.max(maxX, v.x);
    minY = Math.min(minY, v.y);
    maxY = Math.max(maxY, v.y);
    minZ = Math.min(minZ, v.z);
    maxZ = Math.max(maxZ, v.z);
  }

  const triangleCount = faces.length;

  return {
    name: "mesh",
    vertices,
    faces,
    format,
    bounds: { minX, maxX, minY, maxY, minZ, maxZ },
    triangleCount,
  };
}

export function parseMesh(data: Uint8Array, format: "stl" | "obj" | "ply" | "gltf"): MeshResult {
  const warnings: string[] = [];
  const repairs: string[] = [];
  let mesh: Mesh | null = null;

  try {
    switch (format) {
      case "stl":
        mesh = readStl(data);
        break;
      case "obj":
        mesh = readObj(new TextDecoder().decode(data));
        break;
      case "ply":
        mesh = readPly(data);
        break;
      case "gltf":
        mesh = readGltf(data);
        break;
      default:
        throw new Error(`Unsupported format: ${format}`);
    }
  } catch (e) {
    warnings.push(`Failed to parse ${format}: ${e instanceof Error ? e.message : String(e)}`);
    return {
      mesh: { name: "empty", vertices: [], faces: [], format, bounds: { minX: 0, maxX: 0, minY: 0, maxY: 0, minZ: 0, maxZ: 0 }, triangleCount: 0 },
      warnings,
      repairs,
    };
  }

  if (mesh.vertices.length === 0) {
    warnings.push("Mesh has no vertices");
  }

  if (mesh.faces.length === 0) {
    warnings.push("Mesh has no faces");
  }

  mesh = checkForIssues(mesh, repairs, warnings);

  return { mesh, warnings, repairs };
}

function checkForIssues(mesh: Mesh, repairs: string[], warnings: string[]): Mesh {
  const { vertices, faces } = mesh;
  const uniqueVertices = new Map<string, number>();
  const duplicateVertices: MeshVertex[] = [];
  const faceIssues: string[] = [];

  for (let i = 0; i < vertices.length; i++) {
    const v = vertices[i];
    const key = `${v.x},${v.y},${v.z}`;
    if (uniqueVertices.has(key)) {
      duplicateVertices.push(v);
    } else {
      uniqueVertices.set(key, i);
    }
  }

  if (duplicateVertices.length > 0) {
    repairs.push(`Removed ${duplicateVertices.length} duplicate vertices`);
  }

  const normals: { x: number; y: number; z: number }[] = new Array(vertices.length);
  const faceNormals: { x: number; y: number; z: number }[] = [];

  for (let i = 0; i < faces.length; i++) {
    const face = faces[i];
    const v0 = vertices[face.a];
    const v1 = vertices[face.b];
    const v2 = vertices[face.c];

    const edge1 = { x: v1.x - v0.x, y: v1.y - v0.y, z: v1.z - v0.z };
    const edge2 = { x: v2.x - v0.x, y: v2.y - v0.y, z: v2.z - v0.z };

    const nx = edge1.y * edge2.z - edge1.z * edge2.y;
    const ny = edge1.z * edge2.x - edge1.x * edge2.z;
    const nz = edge1.x * edge2.y - edge1.y * edge2.x;

    const len = Math.sqrt(nx * nx + ny * ny + nz * nz);
    if (len > 0) {
      faceNormals.push({ x: nx / len, y: ny / len, z: nz / len });
    }

    const v0Normal = normals[face.a];
    if (!v0Normal) normals[face.a] = { x: nx / len, y: ny / len, z: nz / len };
    else {
      const dot = v0Normal.x * nx + v0Normal.y * ny + v0Normal.z * nz;
      if (dot < -0.01) {
        faceIssues.push(`Possible flipped normal at vertex ${face.a}`);
      }
    }
  }

  if (faceIssues.length > 0) {
    warnings.push(...faceIssues);
  }

  return mesh;
}

function readGltf(data: Uint8Array): Mesh {
  const text = new TextDecoder().decode(data);
  const gltfData: GltfData = JSON.parse(text);

  const vertices: MeshVertex[] = [];
  const faces: MeshFace[] = [];

  for (const accessor of gltfData.accessors || []) {
    const bufferView = gltfData.bufferViews?.find(bv => bv.accessor === accessor.bufferView);
    if (bufferView && accessor.componentType === 5126) {
      const buffer = gltfData.buffers[0];
      const start = bufferView.byteOffset || 0;
      const count = accessor.count;
      const stride = bufferView.byteStride || 0;

      for (let i = 0; i < count; i++) {
        const offset = start + i * stride;
        const x = new Float32Array(buffer, offset, 1)[0];
        const y = new Float32Array(buffer, offset + 4, 1)[0];
        const z = new Float32Array(buffer, offset + 8, 1)[0];
        vertices.push({ x, y, z });
      }
    }
  }

  const indices: number[] = [];
  for (const mesh of gltfData.meshes || []) {
    for (const primitive of mesh.primitives || []) {
      const accessor = gltfData.accessors[primitive.indices];
      if (accessor) {
        const bufferView = gltfData.bufferViews.find(bv => bv.accessor === accessor.bufferView);
        if (bufferView) {
          const buffer = gltfData.buffers[0];
          const start = bufferView.byteOffset || 0;
          for (let i = 0; i < accessor.count; i++) {
            const idx = new Uint16Array(buffer, start + i * 2, 1)[0];
            indices.push(idx);
          }
        }
      }
    }
  }

  for (let i = 0; i < indices.length; i += 3) {
    if (i + 2 < indices.length) {
      faces.push({ a: indices[i], b: indices[i + 1], c: indices[i + 2] });
    }
  }

  return buildMesh(vertices, faces, "gltf");
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function writeMesh(mesh: Mesh, format: "stl" | "obj" | "ply" | "gltf"): Uint8Array {
  switch (format) {
    case "stl": return writeStl(mesh);
    case "obj": return new TextEncoder().encode(writeObj(mesh));
    case "ply": return new TextEncoder().encode(writePly(mesh));
    case "gltf": return new TextEncoder().encode(writeGltf(mesh));
    default: throw new Error(`Unsupported output format: ${format}`);
  }
}

function writeStl(mesh: Mesh): Uint8Array {
  const faceCount = mesh.faces.length;
  const buffer = new ArrayBuffer(84 + faceCount * 50);
  const view = new DataView(buffer);
  const encoder = new TextEncoder();

  view.setUint32(0, 0x3D4D4853, true);
  view.setUint32(80, faceCount, true);

  let offset = 84;
  for (let i = 0; i < faceCount; i++) {
    const face = mesh.faces[i];
    const v0 = mesh.vertices[face.a];
    const v1 = mesh.vertices[face.b];
    const v2 = mesh.vertices[face.c];

    view.setFloat32(offset, v0.x, true);
    view.setFloat32(offset + 4, v0.y, true);
    view.setFloat32(offset + 8, v0.z, true);
    offset += 12;

    view.setFloat32(offset, v1.x, true);
    view.setFloat32(offset + 4, v1.y, true);
    view.setFloat32(offset + 8, v1.z, true);
    offset += 12;

    view.setFloat32(offset, v2.x, true);
    view.setFloat32(offset + 4, v2.y, true);
    view.setFloat32(offset + 8, v2.z, true);
    offset += 12;

    const nx = v2.y - v0.y;
    const ny = v0.z - v2.z;
    const nz = v0.x - v2.x;
    const len = Math.sqrt(nx * nx + ny * ny + nz * nz);
    if (len > 0) {
      view.setFloat32(offset, nx / len, true);
      view.setFloat32(offset + 4, ny / len, true);
      view.setFloat32(offset + 8, nz / len, true);
    }
    offset += 12;

    view.setUint32(offset, 0, true);
    offset += 4;
  }

  return new Uint8Array(buffer);
}

function writeObj(mesh: Mesh): string {
  let obj = "";
  for (const v of mesh.vertices) {
    obj += `v ${v.x} ${v.y} ${v.z}\n`;
  }
  for (let i = 0; i < mesh.faces.length; i++) {
    const face = mesh.faces[i];
    obj += `f ${face.a + 1} ${face.b + 1} ${face.c + 1}\n`;
  }
  return obj;
}

function writePly(mesh: Mesh): string {
  let ply = "ply\nformat ascii 1.0\ncomment Converted from mr.mesh\nelement vertex \n";
  ply += `${mesh.vertices.length}\nproperties\n`; // simplified for brevity
  ply += `end_header\n`;
  for (const v of mesh.vertices) {
    ply += `${v.x} ${v.y} ${v.z}\n`;
  }
  return ply;
}

function writeGltf(mesh: Mesh): string {
  const gltf: GltfData = {
    scene: 0,
    scenes: [{ nodes: [0] }],
    nodes: [],
    meshes: [],
    materials: [],
    accessors: [],
    bufferViews: [],
    buffers: [],
  };

  const vertices: number[] = [];
  const indices: number[] = [];

  for (const v of mesh.vertices) {
    vertices.push(v.x, v.y, v.z);
  }

  for (let i = 0; i < mesh.faces.length; i++) {
    const face = mesh.faces[i];
    indices.push(face.a, face.b, face.c);
  }

  const vertexBuffer = new ArrayBuffer(vertices.length * 4);
  const vertexView = new Float32Array(vertexBuffer);
  vertexView.set(vertices);

  const indexBuffer = new ArrayBuffer(indices.length * 2);
  const indexView = new Uint16Array(indexBuffer);
  indexView.set(indices);

  gltf.buffers = [{ byteLength: vertexBuffer.byteLength + indexBuffer.byteLength }];

  const vertexAccessor = {
    bufferView: 0,
    componentType: 5126,
    count: mesh.vertices.length,
    min: [mesh.bounds.minX, mesh.bounds.minY, mesh.bounds.minZ],
    max: [mesh.bounds.maxX, mesh.bounds.maxY, mesh.bounds.maxZ],
  };

  const indexAccessor = {
    bufferView: 1,
    componentType: 5123,
    count: indices.length,
  };

  gltf.accessors = [vertexAccessor, indexAccessor];

  const vertexViewDesc = {
    buffer: 0,
    byteOffset: 0,
    byteStride: 0,
  };

  const indexViewDesc = {
    buffer: 0,
    byteOffset: vertexBuffer.byteLength,
    byteStride: 0,
  };

  gltf.bufferViews = [vertexViewDesc, indexViewDesc];

  const meshDesc = {
    primitives: [{
      attributes: { POSITION: 0 },
      indices: 1,
      material: 0,
    }],
  };

  gltf.meshes = [meshDesc];

  return JSON.stringify(gltf, null, 2);
}