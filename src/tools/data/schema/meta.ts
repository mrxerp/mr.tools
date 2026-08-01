import type { ToolMeta } from "../../../types/tool";

export const meta: ToolMeta = {
  slug: "schema",
  name: "mr.schema",
  tagline: "Generate JSON Schema from sample instances and validate data against schemas.",
  description: "Generate JSON Schema from sample JSON instances (inference) and validate data against a schema you write.",
  tags: ["json", "schema", "generate", "infer", "validate", "jsonschema"],
  icon: "data",
  difficulty: "Medium",
  offline: true,
  related: ["beautify", "compare", "lint"],
};