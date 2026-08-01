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

function initDOM() {
  if (initialized) return;
  initialized = true;

  if (typeof DOMParser !== "undefined" && typeof XMLSerializer !== "undefined" && typeof XSLTProcessor !== "undefined") {
    DOMParserImpl = DOMParser;
    XMLSerializerImpl = XMLSerializer;
    XSLTProcessorImpl = XSLTProcessor;
    return;
  }

  try {
    const { createRequire } = require("module");
    const require = createRequire(import.meta.url);
    const xmldom = require("xmldom");
    DOMParserImpl = xmldom.DOMParser;
    XMLSerializerImpl = xmldom.XMLSerializer;
    XSLTProcessorImpl = xmldom.XSLTProcessor;
  } catch {
    // xmldom not available
  }
}

function getParser() {
  initDOM();
  if (!DOMParserImpl) throw new Error("No XML parser available");
  return DOMParserImpl;
}

function getSerializer() {
  initDOM();
  if (!XMLSerializerImpl) throw new Error("No XML serializer available");
  return XMLSerializerImpl;
}

function getXSLTProcessor() {
  initDOM();
  if (!XSLTProcessorImpl) throw new Error("No XSLT processor available");
  return XSLTProcessorImpl;
}

export function parseXml(input: string): XmlResult {
  if (!input.trim()) {
    return { valid: true, formatted: "", tree: { name: "", attributes: {}, children: [] } };
  }

  try {
    const parser = new (getParser())();
    const doc = parser.parseFromString(input, "application/xml");
    const parseError = doc.querySelector("parsererror");
    if (parseError) {
      throw new Error(parseError.textContent || "XML parse error");
    }
    const formatted = formatXml(doc);
    const tree = xmlToTree(doc.documentElement);
    return { valid: true, formatted, tree };
  } catch (e) {
    const error = e as Error;
    return { valid: false, error: { message: error.message } };
  }
}

function formatXml(doc: any): string {
  const serializer = new (getSerializer())();
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

  for (const attr of element.attributes) {
    node.attributes[attr.name] = attr.value;
  }

  for (const child of element.children) {
    node.children.push(xmlToTree(child));
  }

  if (element.textContent && element.textContent.trim() && element.children.length === 0) {
    node.text = element.textContent.trim();
  }

  return node;
}

export function validateXsd(xmlInput: string, xsdInput: string): XsdResult {
  try {
    const parser = new (getParser())();
    const xmlDoc = parser.parseFromString(xmlInput, "application/xml");
    const xsdDoc = parser.parseFromString(xsdInput, "application/xml");

    const xsdError = xsdDoc.querySelector("parsererror");
    if (xsdError) {
      return { valid: false, errors: ["Invalid XSD: " + xsdError.textContent] };
    }

    return { valid: true, errors: [] };
  } catch (e) {
    return { valid: false, errors: [(e as Error).message] };
  }
}

export function transformXslt(xmlInput: string, xsltInput: string): XsltResult {
  try {
    const parser = new (getParser())();
    const xmlDoc = parser.parseFromString(xmlInput, "application/xml");
    const xsltDoc = parser.parseFromString(xsltInput, "application/xml");

    const xmlError = xmlDoc.querySelector("parsererror");
    if (xmlError) throw new Error("Invalid XML: " + xmlError.textContent);

    const xsltError = xsltDoc.querySelector("parsererror");
    if (xsltError) throw new Error("Invalid XSLT: " + xsltError.textContent);

    const processor = new (getXSLTProcessor())();
    processor.importStylesheet(xsltDoc);

    const resultDoc = processor.transformToDocument(xmlDoc);
    if (!resultDoc) {
      const resultFragment = processor.transformToFragment(xmlDoc, document);
      const serializer = new (getSerializer())();
      return { output: serializer.serializeToString(resultFragment) };
    }

    const serializer = new (getSerializer())();
    return { output: serializer.serializeToString(resultDoc) };
  } catch (e) {
    return { output: "", error: (e as Error).message };
  }
}

export function formatXmlString(input: string): XmlResult {
  return parseXml(input);
}