const fs = require('fs');
const path = require('path');

const LOCALES_DIR = path.join(__dirname, '..', 'client', 'src', 'locales');
const LANGUAGES = ['en', 'fr', 'de', 'es', 'nl', 'az', 'tr', 'ru', 'fa', 'ar'];

function getLeafKeys(obj, prefix = '') {
  let keys = [];
  for (const key in obj) {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    if (typeof obj[key] === 'object' && obj[key] !== null) {
      keys = keys.concat(getLeafKeys(obj[key], fullKey));
    } else {
      keys.push(fullKey);
    }
  }
  return keys;
}

function main() {
  const enPath = path.join(LOCALES_DIR, 'en.json');
  const en = JSON.parse(fs.readFileSync(enPath, 'utf8'));
  const enKeys = new Set(getLeafKeys(en));

  console.log(`\nReference: en.json has ${enKeys.size} keys\n`);

  let hasErrors = false;

  for (const lang of LANGUAGES) {
    if (lang === 'en') continue;
    const filePath = path.join(LOCALES_DIR, `${lang}.json`);
    if (!fs.existsSync(filePath)) {
      console.log(`  ${lang}.json: FILE MISSING`);
      hasErrors = true;
      continue;
    }

    const data = JSON.parse(fs.readFileSync(filePath, 'utf8'));
    const langKeys = new Set(getLeafKeys(data));

    const missing = [...enKeys].filter(k => !langKeys.has(k));
    const extra = [...langKeys].filter(k => !enKeys.has(k));

    if (missing.length === 0 && extra.length === 0) {
      console.log(`  ${lang}.json: ${langKeys.size} keys - OK`);
    } else {
      hasErrors = true;
      console.log(`  ${lang}.json: ${langKeys.size} keys`);
      if (missing.length > 0) {
        console.log(`    Missing ${missing.length} keys:`);
        missing.slice(0, 10).forEach(k => console.log(`      - ${k}`));
        if (missing.length > 10) console.log(`      ... and ${missing.length - 10} more`);
      }
      if (extra.length > 0) {
        console.log(`    Extra ${extra.length} keys:`);
        extra.slice(0, 10).forEach(k => console.log(`      - ${k}`));
        if (extra.length > 10) console.log(`      ... and ${extra.length - 10} more`);
      }
    }
  }

  console.log('');
  if (hasErrors) {
    console.log('Some translations are out of sync.');
    process.exit(1);
  } else {
    console.log('All translations are in sync!');
  }
}

main();
