export interface JsonSchema {
  type?: string;
  properties?: Record<string, JsonSchema>;
  items?: JsonSchema;
  required?: string[];
  enum?: unknown[];
  const?: unknown;
  description?: string;
  default?: unknown;
  examples?: unknown[];
  minimum?: number;
  maximum?: number;
  minLength?: number;
  maxLength?: number;
  pattern?: string;
  format?: string;
  additionalProperties?: boolean | JsonSchema;
  [key: string]: unknown;
}

export interface SchemaResult {
  schema: JsonSchema;
  valid: boolean;
  errors?: ValidationError[];
}

export interface ValidationError {
  path: string;
  message: string;
  keyword: string;
}

export function inferSchema(samples: unknown[]): JsonSchema {
  if (samples.length === 0) return { type: "object" };

  const schemas = samples.map(inferSingleSchema);
  return mergeSchemas(schemas);
}

export function inferSingleSchema(value: unknown): JsonSchema {
  if (value === null) return { type: "null" };
  if (Array.isArray(value)) {
    if (value.length === 0) return { type: "array", items: {} };
    const itemSchemas = value.map(inferSingleSchema);
    return { type: "array", items: mergeSchemas(itemSchemas) };
  }
  if (typeof value === "object") {
    const properties: Record<string, JsonSchema> = {};
    const required: string[] = [];
    for (const [key, val] of Object.entries(value as Record<string, unknown>)) {
      properties[key] = inferSingleSchema(val);
      required.push(key);
    }
    return { type: "object", properties, required: required.length ? required : undefined };
  }
  const type = typeof value;
  const schema: JsonSchema = { type };
  if (type === "string") {
    if (isEmail(value)) schema.format = "email";
    else if (isUuid(value)) schema.format = "uuid";
    else if (isDateTime(value)) schema.format = "date-time";
    else if (isUri(value)) schema.format = "uri";
  }
  if (type === "number" && Number.isInteger(value as number)) {
    schema.type = "integer";
  }
  return schema;
}

export function mergeSchemas(schemas: JsonSchema[]): JsonSchema {
  if (schemas.length === 1) return schemas[0];

  const types = new Set(schemas.map((s) => s.type).filter(Boolean));
  if (types.size > 1) {
    return { anyOf: schemas };
  }

  const type = types.values().next().value;

  if (type === "object") {
    const allKeys = new Set<string>();
    for (const s of schemas) {
      if (s.properties) Object.keys(s.properties).forEach((k) => allKeys.add(k));
    }
    const properties: Record<string, JsonSchema> = {};
    const required: string[] = [];
    for (const key of allKeys) {
      const keySchemas = schemas
        .filter((s) => s.properties && key in s.properties)
        .map((s) => s.properties![key]);
      if (keySchemas.length === schemas.length) required.push(key);
      properties[key] = mergeSchemas(keySchemas);
    }
    return { type: "object", properties, required: required.length ? required : undefined };
  }

  if (type === "array") {
    const items = schemas.map((s) => s.items).filter(Boolean) as JsonSchema[];
    return { type: "array", items: items.length ? mergeSchemas(items) : {} };
  }

  // For primitive types, merge formats and other properties
  const formats = new Set(schemas.map((s) => s.format).filter(Boolean));
  const enums = new Set<unknown>();
  for (const s of schemas) {
    if (s.const !== undefined) enums.add(s.const);
    else if (s.enum) s.enum.forEach((e) => enums.add(e));
  }
  if (enums.size > 0 && enums.size <= 20) {
    return { type: type as string, enum: Array.from(enums) };
  }

  const result: JsonSchema = { type: type as string };
  if (formats.size === 1) result.format = formats.values().next().value;
  else if (formats.size > 1) result.anyOf = schemas.map(s => ({ type: type as string, format: s.format })).filter(s => s.format);
  return result;
}

export function isEmail(str: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(str);
}
export function isUuid(str: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);
}
export function isDateTime(str: string): boolean {
  return /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(str);
}
export function isUri(str: string): boolean {
  try {
    new URL(str);
    return true;
  } catch {
    return false;
  }
}

export function validateSchema(data: unknown, schema: JsonSchema): SchemaResult {
  const errors: ValidationError[] = [];
  validateValue(data, schema, "", errors);
  return { schema, valid: errors.length === 0, errors: errors.length ? errors : undefined };
}

export function validateValue(
  value: unknown,
  schema: JsonSchema,
  path: string,
  errors: ValidationError[],
): void {
  const type = schema.type;
  if (type && !checkType(value, type)) {
    errors.push({ path: path || "root", message: `Expected type ${type}`, keyword: "type" });
    return;
  }

  if (schema.const !== undefined && value !== schema.const) {
    errors.push({ path: path || "root", message: `Must equal const value`, keyword: "const" });
  }

  if (schema.enum && !schema.enum.includes(value)) {
    errors.push({ path: path || "root", message: `Value not in enum`, keyword: "enum" });
  }

  if (type === "number" || type === "integer") {
    if (typeof value === "number") {
      if (schema.minimum !== undefined && value < schema.minimum) {
        errors.push({ path, message: `Must be >= ${schema.minimum}`, keyword: "minimum" });
      }
      if (schema.maximum !== undefined && value > schema.maximum) {
        errors.push({ path, message: `Must be <= ${schema.maximum}`, keyword: "maximum" });
      }
    }
  }

  if (type === "string") {
    if (typeof value === "string") {
      if (schema.minLength !== undefined && value.length < schema.minLength) {
        errors.push({ path, message: `Must be at least ${schema.minLength} characters`, keyword: "minLength" });
      }
      if (schema.maxLength !== undefined && value.length > schema.maxLength) {
        errors.push({ path, message: `Must be at most ${schema.maxLength} characters`, keyword: "maxLength" });
      }
      if (schema.pattern && !new RegExp(schema.pattern).test(value)) {
        errors.push({ path, message: `Must match pattern ${schema.pattern}`, keyword: "pattern" });
      }
      if (schema.format && !checkFormat(value, schema.format)) {
        errors.push({ path, message: `Must be valid ${schema.format}`, keyword: "format" });
      }
    }
  }

  if (type === "array") {
    if (Array.isArray(value)) {
      if (schema.items) {
        value.forEach((item, i) => validateValue(item, schema.items!, `${path}[${i}]`, errors));
      }
    }
  }

  if (type === "object") {
    if (value && typeof value === "object" && !Array.isArray(value)) {
      const obj = value as Record<string, unknown>;
      if (schema.required) {
        for (const req of schema.required) {
          if (!(req in obj)) {
            errors.push({ path: `${path}.${req}`, message: `Required property missing`, keyword: "required" });
          }
        }
      }
      if (schema.properties) {
        for (const [key, propSchema] of Object.entries(schema.properties)) {
          if (key in obj) {
            validateValue(obj[key], propSchema, path ? `${path}.${key}` : key, errors);
          }
        }
      }
      if (schema.additionalProperties === false) {
        const allowed = new Set(Object.keys(schema.properties || {}));
        for (const key of Object.keys(obj)) {
          if (!allowed.has(key)) {
            errors.push({ path: `${path}.${key}`, message: `Additional property not allowed`, keyword: "additionalProperties" });
          }
        }
      } else if (schema.additionalProperties && typeof schema.additionalProperties === "object") {
        for (const [key, val] of Object.entries(obj)) {
          if (!schema.properties || !(key in schema.properties)) {
            validateValue(val, schema.additionalProperties as JsonSchema, `${path}.${key}`, errors);
          }
        }
      }
    }
  }
}

export function checkType(value: unknown, type: string): boolean {
  if (type === "null") return value === null;
  if (type === "array") return Array.isArray(value);
  if (type === "integer") return typeof value === "number" && Number.isInteger(value);
  return typeof value === type;
}

function checkFormat(value: string, format: string): boolean {
  switch (format) {
    case "email":
      return isEmail(value);
    case "uuid":
      return isUuid(value);
    case "date-time":
      return isDateTime(value);
    case "uri":
      return isUri(value);
    default:
      return true;
  }
}

export function formatSchema(schema: JsonSchema, indent = 2): string {
  return JSON.stringify(schema, null, indent);
}