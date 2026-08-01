import {
  PDFDocument,
  PDFTextField,
  PDFCheckBox,
  PDFRadioGroup,
  PDFDropdown,
  PDFOptionList,
  PDFSignature,
  type PDFField,
} from "pdf-lib";

export interface FieldInfo {
  name: string;
  type: string;
  value: string | null;
  options: string[];
  supported: boolean;
}

export function describeField(field: PDFField): FieldInfo {
  const name = field.getName();
  const base = { name, options: [] as string[], supported: false, value: null as string | null };
  if (field instanceof PDFTextField) {
    return { ...base, type: "text", value: field.getText() ?? "", supported: true };
  }
  if (field instanceof PDFCheckBox) {
    return { ...base, type: "checkbox", value: field.isChecked() ? "checked" : "unchecked", supported: true };
  }
  if (field instanceof PDFRadioGroup) {
    return { ...base, type: "radio", value: field.getSelected() ?? null, options: field.getOptions(), supported: true };
  }
  if (field instanceof PDFDropdown) {
    const selected = field.getSelected();
    return { ...base, type: "dropdown", value: selected.length ? selected.join(", ") : null, options: field.getOptions(), supported: true };
  }
  if (field instanceof PDFOptionList) {
    const selected = field.getSelected();
    return { ...base, type: "list", value: selected.length ? selected.join(", ") : null, options: field.getOptions(), supported: true };
  }
  if (field instanceof PDFSignature) {
    return { ...base, type: "signature" };
  }
  return { ...base, type: "unknown" };
}

export async function getFormFields(bytes: ArrayBuffer | Uint8Array): Promise<FieldInfo[]> {
  const pdf = await PDFDocument.load(bytes, { ignoreEncryption: true });
  return pdf.getForm().getFields().map(describeField);
}

export interface FillResult {
  data: Uint8Array;
  filled: string[];
  unsupported: string[];
}

export function checkboxValueToBoolean(value: string): boolean {
  return /^(on|true|yes|1|x|checked)$/i.test(value.trim());
}

export async function fillForm(
  bytes: ArrayBuffer | Uint8Array,
  values: Record<string, string>,
): Promise<FillResult> {
  const pdf = await PDFDocument.load(bytes, { ignoreEncryption: true });
  const form = pdf.getForm();
  const byName = new Map(form.getFields().map((f) => [f.getName(), f]));
  const filled: string[] = [];
  const unsupported: string[] = [];
  for (const [name, raw] of Object.entries(values)) {
    const value = String(raw ?? "");
    const field = byName.get(name);
    if (!field) {
      unsupported.push(name);
      continue;
    }
    if (field instanceof PDFTextField) {
      field.setText(value);
      filled.push(name);
    } else if (field instanceof PDFCheckBox) {
      if (checkboxValueToBoolean(value)) field.check();
      else field.uncheck();
      filled.push(name);
    } else if (field instanceof PDFRadioGroup) {
      if (value && field.getOptions().includes(value)) {
        field.select(value);
        filled.push(name);
      } else {
        unsupported.push(name);
      }
    } else if (field instanceof PDFDropdown) {
      if (value && field.getOptions().includes(value)) {
        field.select(value);
        filled.push(name);
      } else {
        unsupported.push(name);
      }
    } else if (field instanceof PDFOptionList) {
      field.select(
        value
          .split(",")
          .map((s) => s.trim())
          .filter((s) => field.getOptions().includes(s)),
      );
      filled.push(name);
    } else {
      unsupported.push(name);
    }
  }
  const data = await pdf.save();
  return { data, filled, unsupported };
}
