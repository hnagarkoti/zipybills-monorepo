#!/usr/bin/env node

import { execSync } from 'child_process';
import { cpSync, existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'fs';
import { createInterface } from 'readline';
import { join } from 'path';

const MONOREPO_ROOT = join(import.meta.dirname, '../../..');
const TEMPLATES_DIR = join(MONOREPO_ROOT, 'templates');
const FEATURES_DIR = join(MONOREPO_ROOT, 'features');

const rl = createInterface({
  input: process.stdin,
  output: process.stdout,
});

function question(query) {
  return new Promise((resolve) => rl.question(query, resolve));
}

async function main() {
  console.log('🚀 Zipybills Feature Generator\n');

  const featureName = await question('Feature name (e.g., my-feature): ');
  if (!featureName || !/^[a-z0-9-]+$/.test(featureName)) {
    console.error('❌ Invalid feature name. Use lowercase letters, numbers, and hyphens only.');
    rl.close();
    process.exit(1);
  }

  const category = await question(
    'Category (frontend-shared/backend-shared/core): '
  );
  if (!category) {
    console.error('❌ Category is required.');
    rl.close();
    process.exit(1);
  }

  const categoryPath = join(FEATURES_DIR, category);
  if (!existsSync(categoryPath)) {
    mkdirSync(categoryPath, { recursive: true });
  }

  const featurePath = join(categoryPath, featureName);
  if (existsSync(featurePath)) {
    console.error(`❌ Feature already exists: ${featurePath}`);
    rl.close();
    process.exit(1);
  }

  const templatePath = join(TEMPLATES_DIR, 'template-feature');
  if (!existsSync(templatePath)) {
    console.error('❌ Template not found');
    rl.close();
    process.exit(1);
  }

  console.log(`\n📦 Creating feature: ${category}/${featureName}\n`);

  // Copy template
  cpSync(templatePath, featurePath, { recursive: true });

  // Replace placeholders
  replacePlaceholders(featurePath, featureName, category);

  console.log('✅ Feature created successfully!\n');
  console.log('Next steps:');
  console.log(`  1. cd ${featurePath}`);
  console.log('  2. Update package.json with your feature details');
  console.log('  3. Start building! 🎉\n');

  rl.close();
}

function replacePlaceholders(dir, featureName, category) {
  const files = readdirSync(dir, { withFileTypes: true });

  files.forEach((file) => {
    const filePath = join(dir, file.name);

    if (file.isDirectory()) {
      replacePlaceholders(filePath, featureName, category);
    } else if (file.name.endsWith('.json') || file.name.endsWith('.md')) {
      let content = readFileSync(filePath, 'utf8');
      content = content.replace(/template-feature/g, featureName);
      content = content.replace(/@zipybills\/template-feature/g, `@zipybills/${featureName}`);
      content = content.replace(/Template Feature/g, toTitleCase(featureName));
      writeFileSync(filePath, content);
    }
  });
}

function toTitleCase(str) {
  return str
    .split('-')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

main().catch((error) => {
  console.error('❌ Error:', error);
  process.exit(1);
});
