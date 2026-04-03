import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, "..");
const certDir = path.join(root, "private", "certs");
const outDir = path.join(root, "src", "generated");
const outFile = path.join(outDir, "pem.ts");

const files = [
  ["PRIVATE_KEY", "private.key"],
  ["PUBLIC_KEY", "public.key"],
  ["CODE_CA_CRT", "code-ca.crt"],
  ["SERVER_CHILD_CA_CRT", "server-child-ca.crt"],
];

if (!fs.existsSync(certDir)) {
  if (!fs.existsSync(outFile)) {
    console.error("embed-pem: missing private/certs and src/generated/pem.ts");
    process.exit(1);
  }
  console.warn("embed-pem: skip (no private/certs), using existing pem.ts");
  process.exit(0);
}

const parts = [];
for (const [name, file] of files) {
  const p = path.join(certDir, file);
  if (!fs.existsSync(p)) {
    console.error("Missing", p);
    process.exit(1);
  }
  const txt = fs.readFileSync(p, "utf8");
  parts.push(`export const ${name} = ${JSON.stringify(txt)};`);
}

fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(outFile, parts.join("\n") + "\n");
console.log("Wrote", outFile);
