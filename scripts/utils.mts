import 'zx/globals';
import escapeStringRegexp from 'escape-string-regexp';

/**
 * @fileoverview Import translations from SonarQube Community.
 */
export async function fromJaProperties(): Promise<Record<string, string>> {
  const translate: Record<string, string> = {};
  const urls = [
    'https://raw.githubusercontent.com/SonarQubeCommunity/sonar-l10n-ja/master/src/main/resources/org/sonar/l10n/core_ja.properties',
    'https://raw.githubusercontent.com/SonarQubeCommunity/sonar-l10n-ja/master/src/main/resources/org/sonar/l10n/findbugs_ja.properties',
    'https://raw.githubusercontent.com/SonarQubeCommunity/sonar-l10n-ja/master/src/main/resources/org/sonar/l10n/gwt_ja.properties',
    'https://raw.githubusercontent.com/SonarQubeCommunity/sonar-l10n-ja/master/src/main/resources/org/sonar/l10n/squidjava_ja.properties',
  ];

  for (const url of urls) {
    const res = await fetch(url);
    const body = await res.text();
    body
      .split('\n')
      .filter(line => /^\S+=.+$/.test(line))
      .forEach(line => {
        const [key, value] = line.split('=');
        // escalpe /
        translate[key] = value.replace(escapeStringRegexp('/'), '\\/');
      });
  }
  return translate;
}

/**
 * Import translations from custom file.
 */
export async function fromCustomProperties(): Promise<Record<string, string>> {
  const translate: Record<string, string> = {};
  const body = await fs.readFile('scripts/custom.properties', 'utf-8');

  body
    .split('\n')
    .filter(line => /^\S+=.+$/.test(line))
    .forEach(line => {
      const [key, value] = line.split('=');
      // escalpe /
      translate[key] = value.replace(
        new RegExp(escapeStringRegexp('/'), 'g'),
        '\\/',
      );
    });
  return translate;
}

/**
 * Import untranslated properties from current file.
 */
export async function fromUntraslatedProperties(): Promise<[string, string][]> {
  const properties = await fs.readFile(
    'src/main/resources/org/sonar/l10n/core_ja.properties',
    'utf-8',
  );
  // Get translated keys
  const translatedKeys = [
    ...Object.keys(await fromJaProperties()),
    ...Object.keys(await fromCustomProperties()),
  ];
  return properties
    .split('\n')
    .filter(
      line =>
        /^\S+=.+$/.test(line) &&
        !isJapaneseIncluded(line.split('=')[1]) &&
        !translatedKeys.includes(line.split('=')[0]),
    )
    .map(line => {
      const [key, ...value] = line.split('=');
      return [key + '='.repeat(value.length - 1), value[value.length - 1]];
    });
}

/**
 * Get sonarqube version from pom.xml
 */
export async function getVersion(): Promise<string> {
  const pom = await fs.readFile('pom.xml', 'utf-8');
  const match = pom.match(/<sonar\.version>(.+)<\/sonar\.version>/);
  if (!match) {
    throw new Error('Could not get version from pom.xml');
  }
  return match[1];
}

// 文字列をコードポイントの配列に変換
function toCodePoints(str: string) {
  const codePoints: number[] = [];
  for (let i = 0; i < str.length; i++) {
    codePoints.push(str.charCodeAt(i));
  }
  return codePoints;
}

// 文字列が日本語を含むかどうかを判定
function isJapaneseIncluded(str: string) {
  const codePoints = toCodePoints(str);
  const japaneseCodePointRange = [
    [0x3040, 0x309f],
    [0x30a0, 0x30ff],
    [0x3400, 0x4dbf],
    [0x4e00, 0x9fff],
    [0xf900, 0xfaff],
  ];
  return codePoints.some(codePoint =>
    japaneseCodePointRange.some(
      range => codePoint >= range[0] && codePoint <= range[1],
    ),
  );
}

/**
 * Generate translation keys from SonarQube repository.
 */

export async function generateTranslationKeys(): Promise<
  Record<string, string>
> {
  const url = `https://raw.githubusercontent.com/SonarSource/sonarqube-webapp/refs/heads/master/libs/cross-domain/sq-server-shared/src/l10n/default.ts`;
  const res = await fetch(url);
  const contents = await res.text();
  const a = contents.indexOf('export const defaultMessages = ');
  const b = contents.lastIndexOf(';');

  const mainPart = contents.slice(a + 31, b);

  return eval(`(${mainPart})`);
}
