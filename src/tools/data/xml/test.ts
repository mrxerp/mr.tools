import { strictEqual } from "node:assert";
import { parseXml, formatXmlString, validateXsd, transformXslt } from "./tool.ts";

export async function runTest() {
  // parseXml valid
  const xml = `<root><child attr="value">text</child></root>`;
  const r1 = parseXml(xml);
  strictEqual(r1.valid, true);
  strictEqual(r1.formatted?.includes("root"), true);
  strictEqual(r1.tree?.name, "root");
  strictEqual(r1.tree?.children[0].name, "child");
  strictEqual(r1.tree?.children[0].attributes.attr, "value");
  strictEqual(r1.tree?.children[0].text, "text");

  // parseXml invalid
  const r2 = parseXml("<root><unclosed>");
  strictEqual(r2.valid, false);

  // formatXmlString
  const compact = "<root><a>1</a><b>2</b></root>";
  const r3 = formatXmlString(compact);
  strictEqual(r3.valid, true);
  strictEqual(r3.formatted?.includes("\n"), true);

  // validateXsd basic
  const xsd = `<?xml version="1.0"?>
<xs:schema xmlns:xs="http://www.w3.org/2001/XMLSchema">
  <xs:element name="root" type="xs:string"/>
</xs:schema>`;
  const v1 = validateXsd("<root>test</root>", xsd);
  strictEqual(v1.valid, true);

  // validateXsd invalid XSD
  const v2 = validateXsd("<root/>", "not valid xsd");
  strictEqual(v2.valid, false);

  // transformXslt basic
  const xslt = `<?xml version="1.0"?>
<xsl:stylesheet version="1.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform">
  <xsl:template match="/">
    <output><xsl:value-of select="name(/*/*)"/></output>
  </xsl:template>
</xsl:stylesheet>`;
  const t1 = transformXslt("<root><child/></root>", xslt);
  strictEqual(t1.error, undefined);
  strictEqual(t1.output.includes("child"), true);

  // transformXslt invalid XSLT
  const t2 = transformXslt("<root/>", "not valid xslt");
  strictEqual(typeof t2.error, "string");
}