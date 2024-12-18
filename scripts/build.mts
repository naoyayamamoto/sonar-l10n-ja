#!/usr/bin/env -S node_modules/.bin/tsx
import 'zx/globals';
import {fromCustomProperties, fromJaProperties, getVersion} from './utils.mts';

if (!argv.debug) {
  $.verbose = false;
}

echo(chalk.yellow('Build core_ja.properties...'));

// Get core.properties from SonarQube repository
const version = await getVersion();
const url = `https://raw.githubusercontent.com/SonarSource/sonarqube/${version}/sonar-core/src/main/resources/org/sonar/l10n/core.properties`;
const res = await fetch(url);
const body = await res.text();
// Create build directory
await fs.mkdir('build', {recursive: true});
// Write core.properties to build directory
await fs.writeFile('build/core.properties', body);
// Write core_ja.properties to build directory
await fs.writeFile('build/core_ja.properties', body);

const regex = /^\S+=.+$/;

// Master keys
const masterKeys = body
  .split('\n')
  .filter(line => regex.test(line))
  .map(line => line.split('=')[0]);

// Translate
const translate: Record<string, string> = {
  ...(await fromJaProperties()),
  ...(await fromCustomProperties()),
};

// Rewrite core_ja.properties to build directory
const whichSed = await $({nothrow: true})`which gsed`;
const sed = whichSed.exitCode === 0 ? 'gsed' : 'sed';
for (const key of masterKeys) {
  if (translate[key]) {
    const command = [
      sed,
      '-i',
      `s/^${key}=.*$/${key}=${translate[key]}/g`,
      'build/core_ja.properties',
    ];
    try {
      await $`${command}`;
    } catch (error) {
      console.error(key, translate[key], error);
    }
  }
}

// Move core_ja.properties to src/main/resources/org/sonar/l10n/core_ja.properties
await fs.mkdir('src/main/resources/org/sonar/l10n', {recursive: true});
await fs.rename(
  'build/core_ja.properties',
  'src/main/resources/org/sonar/l10n/core_ja.properties',
);
