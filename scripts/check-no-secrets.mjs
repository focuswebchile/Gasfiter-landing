#!/usr/bin/env node
import { execSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const repoRoot = process.cwd();
const files = execSync("git ls-files", { cwd: repoRoot, encoding: "utf8" })
  .split(/\r?\n/)
  .map((value) => value.trim())
  .filter(Boolean);

const patterns = [
  { id: "supabase_service_role", regex: /sb_secret_[A-Za-z0-9_-]+/g },
  { id: "aws_access_key", regex: /AKIA[0-9A-Z]{16}/g },
  { id: "private_key", regex: /-----BEGIN (RSA |EC |OPENSSH )?PRIVATE KEY-----/g },
];

const findings = [];

for (const relFile of files) {
  const absFile = path.join(repoRoot, relFile);
  let text = "";
  try {
    text = fs.readFileSync(absFile, "utf8");
  } catch {
    continue;
  }

  for (const pattern of patterns) {
    const matches = text.match(pattern.regex);
    if (!matches || matches.length === 0) continue;
    findings.push({
      file: relFile,
      type: pattern.id,
      count: matches.length,
    });
  }
}

if (findings.length > 0) {
  console.error("[secrets] Potential secrets found in tracked files:");
  findings.forEach((item) => {
    console.error(`- ${item.type}: ${item.file} (${item.count})`);
  });
  process.exit(1);
}

console.log("[secrets] OK: no obvious secrets found in tracked files.");
