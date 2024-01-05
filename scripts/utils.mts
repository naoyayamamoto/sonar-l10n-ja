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
    const regex = /^\S+=.+$/;
    body
      .split('\n')
      .filter(line => regex.test(line))
      .forEach(line => {
        const [key, value] = line.split('=');
        // escalpe /
        translate[key] = value.replace(escapeStringRegexp('/'), '\\/');
      });
  }
  return translate;
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
