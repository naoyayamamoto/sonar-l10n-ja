#!/usr/bin/env -S node_modules/.bin/tsx
import 'zx/globals';
import {fromUntraslatedProperties} from './utils.mts';

if (!argv.debug) {
  $.verbose = false;
}

echo(chalk.yellow('Filter untranslated lines from core_ja.properties...'));

// import untranslated properties from current file
const untranslated = await fromUntraslatedProperties();

// Create build directory
await fs.mkdir('build', {recursive: true});
// Write untranslated properties to untranslated.properties
await fs.writeFile(
  'build/untranslated.properties',
  untranslated.map(([key, value]) => `${key}=${value}`).join('\n')
);
