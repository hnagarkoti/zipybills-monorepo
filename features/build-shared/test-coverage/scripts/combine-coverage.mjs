#!/usr/bin/env node

import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

const MONOREPO_ROOT = join(import.meta.dirname, '../../..');
const COVERAGE_DIR = join(MONOREPO_ROOT, 'coverage');

/**
 * Combines coverage reports from all packages
 */
function combineCoverage() {
  console.log('📊 Combining coverage reports...\n');

  if (!existsSync(COVERAGE_DIR)) {
    mkdirSync(COVERAGE_DIR, { recursive: true });
  }

  const packages = findPackagesWithCoverage(MONOREPO_ROOT);

  if (packages.length === 0) {
    console.log('⚠️  No coverage reports found');
    return;
  }

  console.log(`Found coverage in ${packages.length} package(s):`);
  packages.forEach((pkg) => console.log(`  - ${pkg}`));

  const combinedCoverage = {
    total: {
      lines: { total: 0, covered: 0, skipped: 0, pct: 0 },
      statements: { total: 0, covered: 0, skipped: 0, pct: 0 },
      functions: { total: 0, covered: 0, skipped: 0, pct: 0 },
      branches: { total: 0, covered: 0, skipped: 0, pct: 0 },
    },
  };

  packages.forEach((pkg) => {
    const coveragePath = join(MONOREPO_ROOT, pkg, 'coverage', 'coverage-summary.json');
    if (existsSync(coveragePath)) {
      const coverage = JSON.parse(readFileSync(coveragePath, 'utf8'));
      const total = coverage.total;

      combinedCoverage.total.lines.total += total.lines.total;
      combinedCoverage.total.lines.covered += total.lines.covered;
      combinedCoverage.total.statements.total += total.statements.total;
      combinedCoverage.total.statements.covered += total.statements.covered;
      combinedCoverage.total.functions.total += total.functions.total;
      combinedCoverage.total.functions.covered += total.functions.covered;
      combinedCoverage.total.branches.total += total.branches.total;
      combinedCoverage.total.branches.covered += total.branches.covered;
    }
  });

  // Calculate percentages
  combinedCoverage.total.lines.pct = calculatePercentage(
    combinedCoverage.total.lines.covered,
    combinedCoverage.total.lines.total
  );
  combinedCoverage.total.statements.pct = calculatePercentage(
    combinedCoverage.total.statements.covered,
    combinedCoverage.total.statements.total
  );
  combinedCoverage.total.functions.pct = calculatePercentage(
    combinedCoverage.total.functions.covered,
    combinedCoverage.total.functions.total
  );
  combinedCoverage.total.branches.pct = calculatePercentage(
    combinedCoverage.total.branches.covered,
    combinedCoverage.total.branches.total
  );

  writeFileSync(
    join(COVERAGE_DIR, 'coverage-summary.json'),
    JSON.stringify(combinedCoverage, null, 2)
  );

  console.log('\n✅ Combined coverage report created\n');
  console.log('Coverage Summary:');
  console.log(`  Lines:      ${combinedCoverage.total.lines.pct.toFixed(2)}%`);
  console.log(`  Statements: ${combinedCoverage.total.statements.pct.toFixed(2)}%`);
  console.log(`  Functions:  ${combinedCoverage.total.functions.pct.toFixed(2)}%`);
  console.log(`  Branches:   ${combinedCoverage.total.branches.pct.toFixed(2)}%`);
}

function findPackagesWithCoverage(root) {
  const packages = [];
  const dirs = ['apps', 'features'];

  dirs.forEach((dir) => {
    const dirPath = join(root, dir);
    if (existsSync(dirPath)) {
      const subdirs = readdirSync(dirPath, { withFileTypes: true });
      subdirs.forEach((subdir) => {
        if (subdir.isDirectory()) {
          const coveragePath = join(dir, subdir.name, 'coverage');
          if (existsSync(join(root, coveragePath))) {
            packages.push(join(dir, subdir.name));
          }
        }
      });
    }
  });

  return packages;
}

function calculatePercentage(covered, total) {
  return total === 0 ? 0 : (covered / total) * 100;
}

combineCoverage();
