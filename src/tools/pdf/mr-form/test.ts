import { strictEqual } from "node:assert";
import { PDFDocument } from "pdf-lib";
import { getFormFields, fillForm, checkboxValueToBoolean } from "./tool.ts";

export async function runTest() {
  const doc = await PDFDocument.create();
  const page = doc.addPage([300, 300]);
  const form = doc.getForm();
  const name = form.createTextField("name");
  name.setText("Alice");
  const agree = form.createCheckBox("agree");
  agree.addToPage(page);
  agree.check();
  const color = form.createDropdown("color");
  color.addToPage(page);
  color.setOptions(["red", "blue"]);
  color.select("red");
  const plan = form.createRadioGroup("plan");
  plan.addOptionToPage("basic", page);
  plan.addOptionToPage("pro", page);
  plan.select("basic");
  const bytes = await doc.save();

  const fields = await getFormFields(bytes);
  const byName = new Map(fields.map((f) => [f.name, f]));
  strictEqual(byName.get("name")?.type, "text");
  strictEqual(byName.get("name")?.value, "Alice");
  strictEqual(byName.get("agree")?.type, "checkbox");
  strictEqual(byName.get("agree")?.value, "checked");
  strictEqual(byName.get("color")?.type, "dropdown");
  strictEqual(byName.get("color")?.options.join(","), "red,blue");
  strictEqual(byName.get("color")?.value, "red");
  strictEqual(byName.get("plan")?.type, "radio");
  strictEqual(byName.get("plan")?.options.join(","), "basic,pro");
  strictEqual(byName.get("plan")?.value, "basic");

  const result = await fillForm(bytes, {
    name: "Bob",
    agree: "",
    color: "blue",
    plan: "pro",
    nope: "x",
  });
  const reloaded = await PDFDocument.load(result.data);
  const f = reloaded.getForm();
  strictEqual(f.getTextField("name").getText(), "Bob", "text filled");
  strictEqual(f.getCheckBox("agree").isChecked(), false, "checkbox unchecked");
  strictEqual(f.getDropdown("color").getSelected().join(","), "blue", "dropdown selected");
  strictEqual(f.getRadioGroup("plan").getSelected(), "pro", "radio selected");
  strictEqual(result.filled.join(","), "name,agree,color,plan", "filled names reported");
  strictEqual(result.unsupported.join(","), "nope", "missing field reported unsupported");

  strictEqual(checkboxValueToBoolean("on"), true);
  strictEqual(checkboxValueToBoolean("Checked"), true);
  strictEqual(checkboxValueToBoolean(""), false);
  strictEqual(checkboxValueToBoolean("no"), false);
}
