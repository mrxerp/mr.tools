export interface XmlResult {
  valid: boolean;
  formatted?: string;
  error?: {
    message: string;
    line?: number;
    column?: number;
  };
  tree?: XmlNode;
}

export interface XmlNode {
  name: string;
  attributes: Record<string, string>;
  children: XmlNode[];
  text?: string;
}

export interface XsdResult {
  valid: boolean;
  errors: string[];
}

export interface XsltResult {
  output: string;
  error?: string;
}

let DOMParserImpl: any;
let XMLSerializerImpl: any;
let XSLTProcessorImpl: any;
let initialized = false;

async function initDOM() {
  if (initialized) return;
  initialized = true;

  if (typeof DOMParser !== "undefined" && typeof XMLSerializer !== "undefined" && typeof XSLTProcessor !== "undefined") {
    DOMParserImpl = DOMParser;
    XMLSerializerImpl = XMLSerializer;
    XSLTProcessorImpl = XSLTProcessor;
    return;
  }

  try {
    const { createRequire } = await import("module");
    const require = createRequire(import.meta.url);
    const xmldom = require("xmldom");
    console.log('[xml] xmldom loaded:', Object.keys(xmldom));
    DOMParserImpl = xmldom.DOMParser;
    XMLSerializerImpl = xmldom.XMLSerializer;
    XSLTProcessorImpl = xmldom.XSLTProcessor;
    console.log('[xml] DOMParserImpl:', typeof DOMParserImpl);
  } catch (e) {
    console.error('[xml] xmldom load failed:', e instanceof Error ? e.message : e);
  }
}

async function getParser() {
  await initDOM();
  if (!DOMParserImpl) throw new Error("No XML parser available");
  return DOMParserImpl;
}

async function getSerializer() {
  await initDOM();
  if (!XMLSerializerImpl) throw new Error("No XML serializer available");
  return XMLSerializerImpl;
}

async function getXSLTProcessor() {
  await initDOM();
  if (!XSLTProcessorImpl) throw new Error("No XSLT processor available");
  return XSLTProcessorImpl;
}

export async function parseXml(input: string): Promise<XmlResult> {
  if (!input.trim()) {
    return { valid: true, formatted: "", tree: { name: "", attributes: {}, children: [] } };
  }

  try {
    const parser = new (await getParser())();
    const doc = parser.parseFromString(input, "application/xml");
    const parseErrors = doc.getElementsByTagName("parsererror");
    if (parseErrors.length > 0) {
      throw new Error(parseErrors[0].textContent || "XML parse error");
    }
    const formatted = await formatXml(doc);
    const tree = xmlToTree(doc.documentElement);
    return { valid: true, formatted, tree };
  } catch (e) {
    const error = e as Error;
    return { valid: false, error: { message: error.message } };
  }
}

async function formatXml(doc: any): Promise<string> {
  const serializer = new (await getSerializer())();
  let xml = serializer.serializeToString(doc);
  return prettyPrintXml(xml);
}

function prettyPrintXml(xml: string): string {
  let result = "";
  let indent = 0;
  const lines = xml.split(/>(?=<)/g);

  for (let line of lines) {
    if (line.startsWith("</")) {
      indent--;
    }
    result += "  ".repeat(Math.max(0, indent)) + line + ">\n";
    if (line.startsWith("<") && !line.startsWith("</") && !line.endsWith("/>")) {
      indent++;
    }
  }
  return result.trim();
}

function xmlToTree(element: any): XmlNode {
  const node: XmlNode = {
    name: element.tagName,
    attributes: {},
    children: [],
  };

  for (let i = 0; i < element.attributes.length; i++) {
    const attr = element.attributes[i];
    node.attributes[attr.name] = attr.value;
  }

  for (let i = 0; i < element.childNodes.length; i++) {
    const child = element.childNodes[i];
    if (child.nodeType === 1) { // Element node
      node.children.push(xmlToTree(child));
    } else if (child.nodeType === 3) { // Text node
      if (child.textContent && child.textContent.trim()) {
        node.text = child.textContent.trim();
      }
    }
  }

  return node;
}

export async function validateXsd(xmlInput: string, xsdInput: string): Promise<XsdResult> {
  try {
    const parser = new (await getParser())();
    const xmlDoc = parser.parseFromString(xmlInput, "application/xml");
    const xsdDoc = parser.parseFromString(xsdInput, "application/xml");

    const xsdError = xsdDoc.getElementsByTagName("parsererror");
    if (xsdError.length > 0) {
      return { valid: false, errors: ["Invalid XSD: " + xsdError[0].textContent] };
    }

    return { valid: true, errors: [] };
  } catch (e) {
    return { valid: false, errors: [(e as Error).message] };
  }
}

export async function transformXslt(xmlInput: string, xsltInput: string): Promise<XsltResult> {
  try {
    const parser = new (await getParser())();
    const xmlDoc = parser.parseFromString(xmlInput, "application/xml");
    const xsltDoc = parser.parseFromString(xsltInput, "application/xml");

    const xmlError = xmlDoc.getElementsByTagName("parsererror");
    if (xmlError.length > 0) throw new Error("Invalid XML: " + xmlError[0].textContent);

    const xsltError = xsltDoc.getElementsByTagName("parsererror");
    if (xsltError.length > 0) throw new Error("Invalid XSLT: " + xsltError[0].textContent);

    const processor = new (await getXSLTProcessor())();
    processor.importStylesheet(xsltDoc);

    const resultDoc = processor.transformToDocument(xmlDoc);
    if (!resultDoc) {
      const resultFragment = processor.transformToFragment(xmlDoc, document);
      const serializer = new (await getSerializer())();
      return { output: serializer.serializeToString(resultFragment) };
    }

    const serializer = new (await getSerializer())();
    return { output: serializer.serializeToString(resultDoc) };
  } catch (e) {
    return { output: "", error: (e as Error).message };
  }
}

export async function formatXmlString(input: string): Promise<XmlResult> {
  return parseXml(input);
}