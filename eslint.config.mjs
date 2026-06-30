import { defineConfig, globalIgnores } from 'eslint/config';
import nextVitals from 'eslint-config-next/core-web-vitals';
import nextTs from 'eslint-config-next/typescript';

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    '.next/**',
    'out/**',
    'build/**',
    'next-env.d.ts',
    // Repo-local
    'temp-table.tsx',
    'tsconfig.json',
    'tsconfig.tsbuildinfo',
    '*.tsbuildinfo',
    'all_page_diffs.txt',
    'page_tsx_dump.txt',
    '_*.py',
    '_seed.mjs',
  ]),
]);

export default eslintConfig;
