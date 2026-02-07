#!/usr/bin/env node

/**
 * FactoryOS Feature Generator
 *
 * Scaffolds a complete feature with the standard 3-package structure:
 *   features/<name>/<name>-service/service-interface   — types & API contract
 *   features/<name>/<name>-service/service-runtime     — Express router + DB ops
 *   features/<name>/<name>-frontend                    — React Native / NativeWind page + api client
 *
 * Usage:
 *   pnpm generate-feature                      # interactive mode
 *   pnpm generate-feature -- --name inventory   # non-interactive
 */

import { existsSync, mkdirSync, writeFileSync } from 'fs';
import { createInterface } from 'readline';
import { join } from 'path';

// ─── Constants ───────────────────────────────

const MONOREPO_ROOT = join(import.meta.dirname, '..', '..', '..', '..');
const FEATURES_DIR = join(MONOREPO_ROOT, 'features');

// ─── Helpers ─────────────────────────────────

function toPascalCase(str) {
  return str
    .split('-')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join('');
}

function toTitleCase(str) {
  return str
    .split('-')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

function toCamelCase(str) {
  const pascal = toPascalCase(str);
  return pascal.charAt(0).toLowerCase() + pascal.slice(1);
}

function ask(rl, query) {
  return new Promise((resolve) => rl.question(query, resolve));
}

function writeJson(filePath, obj) {
  writeFileSync(filePath, JSON.stringify(obj, null, 2) + '\n');
}

function writeText(filePath, content) {
  writeFileSync(filePath, content);
}

// ─── Template: service-interface ─────────────

function generateServiceInterface(dir, name) {
  const pascal = toPascalCase(name);
  const camel = toCamelCase(name);
  const pkgName = `@zipybills/factory-${name}-service-interface`;

  mkdirSync(join(dir, 'src'), { recursive: true });

  writeJson(join(dir, 'package.json'), {
    name: pkgName,
    version: '0.1.0',
    description: `FactoryOS ${toTitleCase(name)} Service Interface – types and API contract`,
    type: 'module',
    main: './src/index.ts',
    exports: { '.': './src/index.ts' },
    dependencies: { '@zipybills/ts-config': 'workspace:*' },
    devDependencies: { typescript: 'catalog:' },
    private: true,
  });

  writeJson(join(dir, 'tsconfig.json'), {
    extends: '@zipybills/ts-config/node',
    compilerOptions: { outDir: './dist', rootDir: './src', moduleResolution: 'Bundler', module: 'ESNext', noEmit: true, skipLibCheck: true },
    include: ['src/**/*.ts'],
    exclude: ['node_modules', 'dist'],
  });

  const idCol = name.replace(/-/g, '_') + '_id';
  writeText(
    join(dir, 'src', 'index.ts'),
    `/**\n * ${toTitleCase(name)} Service Interface\n *\n * Shared types and API contract for the ${name} feature.\n * Consumed by both service-runtime (backend) and frontend packages.\n */\n\nexport interface ${pascal} {\n  ${idCol}: number;\n  name: string;\n  is_active: boolean;\n  created_at: string;\n  updated_at: string;\n}\n\nexport interface Create${pascal}Request {\n  name: string;\n}\n\nexport interface Update${pascal}Request {\n  name?: string;\n  is_active?: boolean;\n}\n`,
  );
}

// ─── Template: service-runtime ───────────────

function generateServiceRuntime(dir, name) {
  const pascal = toPascalCase(name);
  const camel = toCamelCase(name);
  const interfacePkg = `@zipybills/factory-${name}-service-interface`;

  mkdirSync(join(dir, 'src'), { recursive: true });

  writeJson(join(dir, 'package.json'), {
    name: `@zipybills/factory-${name}-service-runtime`,
    version: '0.1.0',
    description: `FactoryOS ${toTitleCase(name)} Service Runtime – ${name} management routes`,
    type: 'module',
    main: './src/index.ts',
    exports: { '.': './src/index.ts' },
    dependencies: {
      [interfacePkg]: 'workspace:*',
      '@zipybills/factory-auth-middleware': 'workspace:*',
      '@zipybills/factory-database-config': 'workspace:*',
      '@zipybills/factory-activity-log': 'workspace:*',
      '@zipybills/ts-config': 'workspace:*',
      express: 'catalog:',
    },
    devDependencies: { '@types/express': 'catalog:', '@types/node': 'catalog:', typescript: 'catalog:' },
    private: true,
  });

  writeJson(join(dir, 'tsconfig.json'), {
    extends: '@zipybills/ts-config/node',
    compilerOptions: { outDir: './dist', rootDir: './src', moduleResolution: 'Bundler', module: 'ESNext', noEmit: true, skipLibCheck: true },
    include: ['src/**/*.ts'],
    exclude: ['node_modules', 'dist'],
  });

  const table = name.replace(/-/g, '_') + 's';
  const idCol = name.replace(/-/g, '_') + '_id';
  const upperAction = name.toUpperCase().replace(/-/g, '_');

  // database.ts
  writeText(
    join(dir, 'src', 'database.ts'),
    `/**\n * ${toTitleCase(name)} Service – Database Operations\n */\n\nimport { query } from '@zipybills/factory-database-config';\nimport type { ${pascal} } from '${interfacePkg}';\n\nexport async function getAll${pascal}s(): Promise<${pascal}[]> {\n  const result = await query<${pascal}>('SELECT * FROM ${table} ORDER BY created_at DESC');\n  return result.rows;\n}\n\nexport async function get${pascal}ById(id: number): Promise<${pascal} | null> {\n  const result = await query<${pascal}>('SELECT * FROM ${table} WHERE ${idCol} = $1', [id]);\n  return result.rows[0] || null;\n}\n\nexport async function create${pascal}(data: { name: string }): Promise<${pascal}> {\n  const result = await query<${pascal}>(\n    \`INSERT INTO ${table} (name) VALUES ($1) RETURNING *\`,\n    [data.name],\n  );\n  return result.rows[0]!;\n}\n\nexport async function update${pascal}(\n  id: number,\n  data: { name?: string; is_active?: boolean },\n): Promise<${pascal} | null> {\n  const sets: string[] = [];\n  const params: any[] = [];\n  let idx = 1;\n\n  if (data.name !== undefined) { sets.push(\`name = $\${idx++}\`); params.push(data.name); }\n  if (data.is_active !== undefined) { sets.push(\`is_active = $\${idx++}\`); params.push(data.is_active); }\n  sets.push(\`updated_at = NOW()\`);\n\n  params.push(id);\n  const result = await query<${pascal}>(\n    \`UPDATE ${table} SET \${sets.join(', ')} WHERE ${idCol} = $\${idx} RETURNING *\`,\n    params,\n  );\n  return result.rows[0] || null;\n}\n\nexport async function delete${pascal}(id: number): Promise<boolean> {\n  const result = await query('DELETE FROM ${table} WHERE ${idCol} = $1', [id]);\n  return (result.rowCount ?? 0) > 0;\n}\n`,
  );

  // index.ts — Express router
  writeText(
    join(dir, 'src', 'index.ts'),
    `/**\n * FactoryOS ${toTitleCase(name)} Service Runtime\n *\n * Express router for ${name} management.\n * Routes: /api/${name}s\n */\n\nimport { Router } from 'express';\nimport { requireAuth } from '@zipybills/factory-auth-middleware';\nimport { logActivity } from '@zipybills/factory-activity-log';\nimport * as db from './database.js';\n\nexport const ${camel}Router = Router();\n\n// GET /api/${name}s — list all\n${camel}Router.get('/${name}s', requireAuth, async (_req, res) => {\n  try {\n    const items = await db.getAll${pascal}s();\n    res.json({ success: true, ${camel}s: items });\n  } catch (err) {\n    console.error('[${pascal}] List error:', err);\n    res.status(500).json({ success: false, error: 'Failed to fetch ${name}s' });\n  }\n});\n\n// GET /api/${name}s/:id — get by id\n${camel}Router.get('/${name}s/:id', requireAuth, async (req, res) => {\n  try {\n    const item = await db.get${pascal}ById(Number(req.params.id));\n    if (!item) return res.status(404).json({ success: false, error: '${pascal} not found' });\n    res.json({ success: true, ${camel}: item });\n  } catch (err) {\n    console.error('[${pascal}] Get error:', err);\n    res.status(500).json({ success: false, error: 'Failed to fetch ${name}' });\n  }\n});\n\n// POST /api/${name}s — create\n${camel}Router.post('/${name}s', requireAuth, async (req: any, res) => {\n  try {\n    const { name } = req.body;\n    if (!name) return res.status(400).json({ success: false, error: 'name is required' });\n\n    const item = await db.create${pascal}({ name });\n    await logActivity(req.user?.user_id, 'CREATE_${upperAction}', \`Created ${name}: \${item.name}\`);\n    res.status(201).json({ success: true, ${camel}: item });\n  } catch (err) {\n    console.error('[${pascal}] Create error:', err);\n    res.status(500).json({ success: false, error: 'Failed to create ${name}' });\n  }\n});\n\n// PUT /api/${name}s/:id — update\n${camel}Router.put('/${name}s/:id', requireAuth, async (req: any, res) => {\n  try {\n    const item = await db.update${pascal}(Number(req.params.id), req.body);\n    if (!item) return res.status(404).json({ success: false, error: '${pascal} not found' });\n    await logActivity(req.user?.user_id, 'UPDATE_${upperAction}', \`Updated ${name}: \${item.name}\`);\n    res.json({ success: true, ${camel}: item });\n  } catch (err) {\n    console.error('[${pascal}] Update error:', err);\n    res.status(500).json({ success: false, error: 'Failed to update ${name}' });\n  }\n});\n\n// DELETE /api/${name}s/:id — delete\n${camel}Router.delete('/${name}s/:id', requireAuth, async (req: any, res) => {\n  try {\n    const deleted = await db.delete${pascal}(Number(req.params.id));\n    if (!deleted) return res.status(404).json({ success: false, error: '${pascal} not found' });\n    await logActivity(req.user?.user_id, 'DELETE_${upperAction}', \`Deleted ${name} id=\${req.params.id}\`);\n    res.json({ success: true });\n  } catch (err) {\n    console.error('[${pascal}] Delete error:', err);\n    res.status(500).json({ success: false, error: 'Failed to delete ${name}' });\n  }\n});\n`,
  );
}

// ─── Template: frontend ──────────────────────

function generateFrontend(dir, name) {
  const pascal = toPascalCase(name);
  const camel = toCamelCase(name);
  const idCol = name.replace(/-/g, '_') + '_id';

  mkdirSync(join(dir, 'src', 'components'), { recursive: true });
  mkdirSync(join(dir, 'src', 'services'), { recursive: true });

  writeJson(join(dir, 'package.json'), {
    name: `@zipybills/factory-${name}-frontend`,
    version: '0.1.0',
    description: `FactoryOS ${toTitleCase(name)} Frontend – ${name} management UI`,
    type: 'module',
    main: './src/index.ts',
    exports: { '.': './src/index.ts' },
    peerDependencies: { nativewind: 'catalog:', react: 'catalog:', 'react-native': 'catalog:' },
    dependencies: { '@zipybills/factory-api-client': 'workspace:*', '@zipybills/ts-config': 'workspace:*' },
    devDependencies: { '@types/react': 'catalog:', typescript: 'catalog:' },
    private: true,
  });

  writeJson(join(dir, 'tsconfig.json'), {
    extends: '@zipybills/ts-config/react-native',
    compilerOptions: { outDir: './dist', rootDir: './src', noEmit: true, skipLibCheck: true },
    include: ['src/**/*.ts', 'src/**/*.tsx'],
    exclude: ['node_modules', 'dist'],
  });

  writeText(join(dir, 'src', 'nativewind-env.d.ts'), '/// <reference types="nativewind/types" />\n');

  // services/api.ts
  writeText(
    join(dir, 'src', 'services', 'api.ts'),
    `import { apiFetch } from '@zipybills/factory-api-client';\n\nexport interface ${pascal} {\n  ${idCol}: number;\n  name: string;\n  is_active: boolean;\n  created_at: string;\n  updated_at: string;\n}\n\nexport async function fetch${pascal}s(): Promise<${pascal}[]> {\n  const data = await apiFetch<{ success: boolean; ${camel}s: ${pascal}[] }>('/api/${name}s');\n  return data.${camel}s;\n}\n\nexport async function create${pascal}(body: { name: string }): Promise<${pascal}> {\n  const data = await apiFetch<{ success: boolean; ${camel}: ${pascal} }>('/api/${name}s', {\n    method: 'POST',\n    body: JSON.stringify(body),\n  });\n  return data.${camel};\n}\n\nexport async function update${pascal}(id: number, body: Partial<${pascal}>): Promise<${pascal}> {\n  const data = await apiFetch<{ success: boolean; ${camel}: ${pascal} }>(\`/api/${name}s/\${id}\`, {\n    method: 'PUT',\n    body: JSON.stringify(body),\n  });\n  return data.${camel};\n}\n\nexport async function delete${pascal}(id: number): Promise<void> {\n  await apiFetch(\`/api/${name}s/\${id}\`, { method: 'DELETE' });\n}\n`,
  );

  // components/Page
  writeText(
    join(dir, 'src', 'components', `${pascal}Page.tsx`),
    `import React, { useCallback, useEffect, useState } from 'react';\nimport { View, Text, TextInput, Pressable, ScrollView, Alert } from 'react-native';\nimport { fetch${pascal}s, create${pascal}, update${pascal}, delete${pascal}, type ${pascal} } from '../services/api';\n\nexport function ${pascal}Page() {\n  const [items, setItems] = useState<${pascal}[]>([]);\n  const [loading, setLoading] = useState(true);\n  const [name, setName] = useState('');\n  const [editingId, setEditingId] = useState<number | null>(null);\n\n  const load = useCallback(async () => {\n    try {\n      setLoading(true);\n      setItems(await fetch${pascal}s());\n    } catch (err) {\n      console.error('Failed to load ${name}s:', err);\n    } finally {\n      setLoading(false);\n    }\n  }, []);\n\n  useEffect(() => { load(); }, [load]);\n\n  const handleSave = async () => {\n    if (!name.trim()) return Alert.alert('Validation', 'Name is required');\n    try {\n      if (editingId) {\n        await update${pascal}(editingId, { name: name.trim() });\n      } else {\n        await create${pascal}({ name: name.trim() });\n      }\n      setName('');\n      setEditingId(null);\n      await load();\n    } catch (err) {\n      Alert.alert('Error', 'Operation failed');\n    }\n  };\n\n  const handleDelete = async (id: number) => {\n    try {\n      await delete${pascal}(id);\n      await load();\n    } catch (err) {\n      Alert.alert('Error', 'Delete failed');\n    }\n  };\n\n  const startEdit = (item: ${pascal}) => {\n    setEditingId(item.${idCol});\n    setName(item.name);\n  };\n\n  return (\n    <ScrollView className="flex-1 bg-gray-50 p-4">\n      <Text className="text-2xl font-bold text-gray-900 mb-4">${toTitleCase(name)} Management</Text>\n\n      {/* Form */}\n      <View className="bg-white rounded-xl p-4 mb-4 border border-gray-200">\n        <Text className="text-lg font-semibold mb-3">{editingId ? 'Edit' : 'New'} ${toTitleCase(name)}</Text>\n        <TextInput\n          className="border border-gray-300 rounded-lg px-3 py-2.5 text-sm mb-3"\n          value={name}\n          onChangeText={setName}\n          placeholder="Enter name"\n        />\n        <View className="flex-row gap-2">\n          <Pressable onPress={handleSave} className="bg-emerald-500 px-6 py-2.5 rounded-lg flex-1 items-center">\n            <Text className="text-white font-medium">{editingId ? 'Update' : 'Create'}</Text>\n          </Pressable>\n          {editingId && (\n            <Pressable onPress={() => { setEditingId(null); setName(''); }} className="bg-gray-200 px-6 py-2.5 rounded-lg">\n              <Text className="text-gray-700 font-medium">Cancel</Text>\n            </Pressable>\n          )}\n        </View>\n      </View>\n\n      {/* List */}\n      {loading ? (\n        <Text className="text-center text-gray-400 py-8">Loading...</Text>\n      ) : items.length === 0 ? (\n        <View className="items-center py-12">\n          <Text className="text-4xl mb-3">📋</Text>\n          <Text className="text-lg text-gray-500">No ${name}s yet</Text>\n        </View>\n      ) : (\n        items.map((item) => (\n          <View key={item.${idCol}} className="bg-white rounded-xl border border-gray-100 p-4 mb-2">\n            <View className="flex-row items-center justify-between">\n              <View className="flex-row items-center">\n                <View className={\`w-3 h-3 rounded-full mr-2 \${item.is_active ? 'bg-green-400' : 'bg-gray-300'}\`} />\n                <Text className="text-base font-semibold text-gray-900">{item.name}</Text>\n              </View>\n              <View className="flex-row gap-2">\n                <Pressable onPress={() => startEdit(item)} className="bg-gray-100 px-3 py-1.5 rounded-lg">\n                  <Text className="text-xs text-gray-600">Edit</Text>\n                </Pressable>\n                <Pressable onPress={() => handleDelete(item.${idCol})} className="bg-red-50 px-3 py-1.5 rounded-lg">\n                  <Text className="text-xs text-red-600">Delete</Text>\n                </Pressable>\n              </View>\n            </View>\n          </View>\n        ))\n      )}\n      <View className="h-8" />\n    </ScrollView>\n  );\n}\n`,
  );

  // index.ts
  writeText(
    join(dir, 'src', 'index.ts'),
    `export { ${pascal}Page } from './components/${pascal}Page';\nexport { fetch${pascal}s, create${pascal}, update${pascal}, delete${pascal} } from './services/api';\nexport type { ${pascal} } from './services/api';\n`,
  );
}

// ─── SQL snippet ─────────────────────────────

function generateTableSQL(name) {
  const table = name.replace(/-/g, '_') + 's';
  const idCol = name.replace(/-/g, '_') + '_id';

  return `\n-- Add this to features/shared/api-gateway/src/schema.ts inside initializeDatabase():\nCREATE TABLE IF NOT EXISTS ${table} (\n  ${idCol} SERIAL PRIMARY KEY,\n  name VARCHAR(255) NOT NULL,\n  is_active BOOLEAN DEFAULT true,\n  created_at TIMESTAMP DEFAULT NOW(),\n  updated_at TIMESTAMP DEFAULT NOW()\n);\nCREATE INDEX IF NOT EXISTS idx_${table}_active ON ${table}(is_active);\n`;
}

// ─── Main ────────────────────────────────────

async function main() {
  console.log('\n🏭 FactoryOS Feature Generator\n');
  console.log('This will create a complete feature with:\n');
  console.log('  📦 service-interface  (types & API contract)');
  console.log('  ⚙️  service-runtime    (Express router + DB operations)');
  console.log('  🎨 frontend           (React Native page + API client)\n');

  // Parse CLI args for non-interactive mode
  const args = process.argv.slice(2);
  const nameArgIdx = args.indexOf('--name');
  let featureName;

  if (nameArgIdx !== -1 && args[nameArgIdx + 1]) {
    featureName = args[nameArgIdx + 1];
  } else {
    const rl = createInterface({ input: process.stdin, output: process.stdout });
    featureName = await ask(rl, 'Feature name (lowercase-hyphenated, e.g., inventory): ');
    rl.close();
  }

  // Validate
  featureName = featureName.trim().toLowerCase();
  if (!featureName || !/^[a-z][a-z0-9-]*$/.test(featureName)) {
    console.error('❌ Invalid feature name. Use lowercase letters, numbers, and hyphens. Must start with a letter.');
    process.exit(1);
  }

  const featureDir = join(FEATURES_DIR, featureName);
  if (existsSync(featureDir)) {
    console.error(`❌ Feature directory already exists: features/${featureName}/`);
    process.exit(1);
  }

  const pascal = toPascalCase(featureName);
  const camel = toCamelCase(featureName);

  console.log(`\n📦 Creating feature: ${featureName}\n`);

  // ── Create the three packages ──

  const interfaceDir = join(featureDir, `${featureName}-service`, 'service-interface');
  const runtimeDir = join(featureDir, `${featureName}-service`, 'service-runtime');
  const frontendDir = join(featureDir, `${featureName}-frontend`);

  console.log('  ├── service-interface/');
  generateServiceInterface(interfaceDir, featureName);

  console.log('  ├── service-runtime/');
  generateServiceRuntime(runtimeDir, featureName);

  console.log('  └── frontend/');
  generateFrontend(frontendDir, featureName);

  // ── Summary ──

  console.log('\n✅ Feature scaffolded successfully!\n');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`  features/${featureName}/`);
  console.log(`  ├── ${featureName}-service/`);
  console.log(`  │   ├── service-interface/   @zipybills/factory-${featureName}-service-interface`);
  console.log(`  │   └── service-runtime/     @zipybills/factory-${featureName}-service-runtime`);
  console.log(`  └── ${featureName}-frontend/      @zipybills/factory-${featureName}-frontend`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  console.log('📋 Next steps:\n');
  console.log('  1. Add the DB table to the schema:');
  console.log(generateTableSQL(featureName));

  console.log('  2. Wire the router into the API gateway:');
  console.log(`     // features/shared/api-gateway/src/index.ts`);
  console.log(`     import { ${camel}Router } from '@zipybills/factory-${featureName}-service-runtime';`);
  console.log(`     app.use('/api', ${camel}Router);  // /api/${featureName}s/*\n`);

  console.log('  3. Add the runtime dep to the gateway:');
  console.log(`     // features/shared/api-gateway/package.json → dependencies`);
  console.log(`     "@zipybills/factory-${featureName}-service-runtime": "workspace:*"\n`);

  console.log('  4. (Optional) Add the page to home-frontend:');
  console.log(`     import { ${pascal}Page } from '@zipybills/factory-${featureName}-frontend';\n`);

  console.log('  5. Install & run:');
  console.log('     pnpm install && pnpm dev:factory\n');
}

main().catch((error) => {
  console.error('❌ Error:', error.message);
  process.exit(1);
});
