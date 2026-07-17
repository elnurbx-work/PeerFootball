import fs from "node:fs";
import path from "node:path";
import ts from "typescript";

const root = process.cwd();
const locales = ["az", "en", "ru"].map((locale) => ({
  locale,
  dictionary: JSON.parse(fs.readFileSync(path.join(root, "src", "locales", `${locale}.json`), "utf8"))
}));

function flatten(value, prefix = "", output = new Map()) {
  for (const [key, child] of Object.entries(value)) {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    if (typeof child === "string") output.set(fullKey, child);
    else if (child && typeof child === "object" && !Array.isArray(child)) flatten(child, fullKey, output);
    else throw new Error(`Invalid locale value at ${fullKey}`);
  }
  return output;
}

const flattened = locales.map(({ locale, dictionary }) => ({ locale, messages: flatten(dictionary) }));
const referenceKeys = [...flattened[0].messages.keys()].sort();
const errors = [];

for (const { locale, messages } of flattened.slice(1)) {
  const keys = [...messages.keys()].sort();
  for (const key of referenceKeys.filter((item) => !messages.has(item))) errors.push(`${locale}: missing locale key ${key}`);
  for (const key of keys.filter((item) => !flattened[0].messages.has(item))) errors.push(`${locale}: extra locale key ${key}`);
}

const scanRoots = ["src/app", "src/components", "src/actions", "src/lib/validations", "src/lib/validations.ts"];
const attributeNames = new Set(["alt", "aria-label", "placeholder", "title"]);
const objectPropertyNames = new Set(["message", "label", "title", "description", "placeholder", "emptyText"]);
const callNames = new Set(["setError", "setMessage", "setStatusMessage", "alert"]);
const allowedText = new Set(["TD", "YTD", "Google Drive", "YouTube", "FanPitch", "FP"]);

function filesAt(target) {
  const absolute = path.join(root, target);
  if (!fs.existsSync(absolute)) return [];
  if (fs.statSync(absolute).isFile()) return [absolute];
  return fs.readdirSync(absolute, { withFileTypes: true }).flatMap((entry) =>
    entry.isDirectory() ? filesAt(path.join(target, entry.name)) : /\.(ts|tsx)$/.test(entry.name) ? [path.join(absolute, entry.name)] : []
  );
}

function isHumanText(value) {
  const text = value.replace(/\s+/g, " ").trim();
  if (!text || allowedText.has(text) || text.startsWith("validation.")) return false;
  if (/^(https?:\/\/|\/|@|#[0-9a-f]{3,8}$)/i.test(text)) return false;
  return /[A-Za-zƏÖÜĞÇŞİəöüğçşıА-Яа-я]/.test(text);
}

function report(file, node, value, kind) {
  const source = node.getSourceFile();
  const { line, character } = source.getLineAndCharacterOfPosition(node.getStart(source));
  errors.push(`${path.relative(root, file)}:${line + 1}:${character + 1} ${kind}: ${JSON.stringify(value.trim())}`);
}

for (const file of scanRoots.flatMap(filesAt)) {
  const sourceText = fs.readFileSync(file, "utf8");
  const source = ts.createSourceFile(file, sourceText, ts.ScriptTarget.Latest, true, file.endsWith("x") ? ts.ScriptKind.TSX : ts.ScriptKind.TS);
  const visit = (node) => {
    if (ts.isJsxText(node) && isHumanText(node.text)) report(file, node, node.text, "static JSX text");

    if (ts.isJsxAttribute(node) && attributeNames.has(node.name.text) && node.initializer && ts.isStringLiteral(node.initializer) && isHumanText(node.initializer.text)) {
      report(file, node, node.initializer.text, `static ${node.name.text}`);
    }

    if (ts.isPropertyAssignment(node)) {
      const name = ts.isIdentifier(node.name) || ts.isStringLiteral(node.name) ? node.name.text : "";
      if (objectPropertyNames.has(name) && ts.isStringLiteralLike(node.initializer) && isHumanText(node.initializer.text)) {
        report(file, node, node.initializer.text, `static ${name}`);
      }
    }

    if (ts.isCallExpression(node) && ts.isIdentifier(node.expression) && callNames.has(node.expression.text)) {
      const first = node.arguments[0];
      if (first && ts.isStringLiteralLike(first) && isHumanText(first.text)) report(file, node, first.text, `static ${node.expression.text} call`);
    }

    ts.forEachChild(node, visit);
  };
  visit(source);
}

if (errors.length) {
  console.error(`i18n check failed with ${errors.length} issue(s):\n${errors.join("\n")}`);
  process.exit(1);
}

console.log(`i18n check passed: ${referenceKeys.length} keys are in parity and no audited static UI/response text remains.`);
