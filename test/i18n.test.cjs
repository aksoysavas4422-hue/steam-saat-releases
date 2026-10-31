'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { t, messages, languages } = require('../src/ui/i18n.js');
const { clean, defaults } = require('../src/preferences.cjs');
test('English is the default; only supported language codes survive preferences cleanup', () => {
  assert.equal(defaults().language, 'en');
  for (const language of languages) assert.equal(clean({ language }).language, language);
  assert.equal(clean({ language: '../../private' }).language, 'en');
});
test('every translation is complete and preserves interpolation parameters', () => {
  for (const [english, translations] of Object.entries(messages)) {
    const placeholders = (english.match(/\{\w+\}/g) || []).sort();
    for (const language of languages.filter(value => value !== 'en')) {
      assert.equal(typeof translations[language], 'string', english + ' / ' + language);
      assert.ok(translations[language].trim());
      assert.deepEqual((translations[language].match(/\{\w+\}/g) || []).sort(), placeholders, english + ' / ' + language);
    }
  }
  assert.equal(t('{count} games selected', 'zh', { count: 3 }), '已选择 3 款游戏');
  assert.equal(t('Password', 'ru'), 'Пароль');
});
test('all static UI labels and placeholders have four-language coverage', () => {
  const html = fs.readFileSync(path.join(__dirname, '../src/ui/index.html'), 'utf8');
  for (const match of html.matchAll(/data-i18n(?:-placeholder|-title)?="([^"]+)"/g)) assert.ok(messages[match[1]], match[1]);
  assert.equal((html.match(/data-language=/g) || []).length, 4);
  assert.ok(html.includes('class="bento-grid"'));
});
