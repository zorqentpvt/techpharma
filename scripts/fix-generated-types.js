#!/usr/bin/env node

const fs = require("fs");
const path = require("path");

const GENERATED_TYPES_DIR = path.join(
  __dirname,
  "..",
  "client",
  "src",
  "types",
  "generated"
);

// Replacements to improve generated types
const replacements = [
  // Replace 'any' with 'unknown' for better type safety
  { from: /: any;/g, to: ": unknown;" },
  { from: /: any\[\]/g, to: ": unknown[]" },
  { from: /Record<string, any>/g, to: "Record<string, unknown>" },
  { from: /Array<any>/g, to: "Array<unknown>" },

  // Fix interface{} to unknown
  { from: /interface\{\}/g, to: "unknown" },

  // Fix common GORM model issues
  {
    from: /gorm\.Model/g,
    to: "{ ID: number; CreatedAt: string; UpdatedAt: string; DeletedAt: string | null }",
  },

  // Fix pointer types that might not be handled correctly
  { from: /\*string/g, to: "string | null" },
  { from: /\*bool/g, to: "boolean | null" },
  { from: /\*int/g, to: "number | null" },
  { from: /\*uint/g, to: "number | null" },

  // Clean up extra whitespace
  { from: /\n\n\n+/g, to: "\n\n" },

  // Fix export formatting
  { from: /export\s+type\s+(\w+)\s*=\s*{/g, to: "export interface $1 {" },
];

// Import fixes for circular dependencies
const importFixes = [
  // Remove duplicate imports
  {
    from: /^import\s+.*;\s*\n(?=import\s+.*from\s+['"]\.\/.*['"];?\s*\n)/gm,
    to: "",
  },

  // Sort imports
  {
    from: /^(import\s+.*;\s*\n)+/gm,
    to: (match) => {
      return (
        match
          .split("\n")
          .filter((line) => line.trim())
          .sort()
          .join("\n") + "\n"
      );
    },
  },
];

function processFile(filePath) {
  if (!fs.existsSync(filePath)) {
    console.log(`⚠️  File not found: ${filePath}`);
    return;
  }

  let content = fs.readFileSync(filePath, "utf8");
  let modified = false;

  // Apply replacements
  replacements.forEach(({ from, to }) => {
    const newContent = content.replace(from, to);
    if (newContent !== content) {
      modified = true;
      content = newContent;
    }
  });

  // Apply import fixes
  importFixes.forEach(({ from, to }) => {
    const newContent = content.replace(from, to);
    if (newContent !== content) {
      modified = true;
      content = newContent;
    }
  });

  if (modified) {
    fs.writeFileSync(filePath, content, "utf8");
    console.log(`✅ Fixed: ${path.relative(process.cwd(), filePath)}`);
  } else {
    console.log(`✨ Clean: ${path.relative(process.cwd(), filePath)}`);
  }
}

function processDirectory(dirPath) {
  if (!fs.existsSync(dirPath)) {
    console.log(`⚠️  Directory not found: ${dirPath}`);
    return;
  }

  const files = fs.readdirSync(dirPath);

  files.forEach((file) => {
    const filePath = path.join(dirPath, file);
    const stat = fs.statSync(filePath);

    if (stat.isFile() && file.endsWith(".ts")) {
      processFile(filePath);
    }
  });
}

function createIndexFile() {
  const indexPath = path.join(GENERATED_TYPES_DIR, "index.ts");

  if (!fs.existsSync(GENERATED_TYPES_DIR)) {
    console.log(
      `⚠️  Generated types directory not found: ${GENERATED_TYPES_DIR}`
    );
    return;
  }

  const files = fs
    .readdirSync(GENERATED_TYPES_DIR)
    .filter((file) => file.endsWith(".ts") && file !== "index.ts")
    .map((file) => file.replace(".ts", ""));

  if (files.length === 0) {
    console.log("⚠️  No generated type files found");
    return;
  }

  const exports = files.map((file) => `export * from './${file}';`).join("\n");

  const indexContent = `/* eslint-disable */
// This file is auto-generated. Do not edit manually.
// Re-exports all generated types for convenient importing

${exports}
`;

  fs.writeFileSync(indexPath, indexContent, "utf8");
  console.log(
    `✅ Created index file: ${path.relative(process.cwd(), indexPath)}`
  );
}

function validateGeneratedTypes() {
  console.log("\n🔍 Validating generated types...");

  const requiredTypes = [
    "User",
    "Role",
    "Permission",
    "BaseModel",
    "Response",
    "ErrorInfo",
    "MetaInfo",
    "LoginRequest",
    "LoginResponse",
    "RegisterRequest",
  ];

  const allContent = fs
    .readdirSync(GENERATED_TYPES_DIR)
    .filter((file) => file.endsWith(".ts"))
    .map((file) =>
      fs.readFileSync(path.join(GENERATED_TYPES_DIR, file), "utf8")
    )
    .join("\n");

  const missingTypes = requiredTypes.filter(
    (type) =>
      !allContent.includes(`export interface ${type}`) &&
      !allContent.includes(`export type ${type}`)
  );

  if (missingTypes.length > 0) {
    console.log(`❌ Missing types: ${missingTypes.join(", ")}`);
    process.exit(1);
  } else {
    console.log("✅ All required types found");
  }
}

// Main execution
console.log("🔧 Post-processing generated TypeScript types...\n");

processDirectory(GENERATED_TYPES_DIR);
createIndexFile();
validateGeneratedTypes();

console.log("\n✨ Type post-processing completed!");
