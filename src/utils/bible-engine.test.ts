import test from 'node:test';
import assert from 'node:assert/strict';
import {
  ensureEngine,
  loadSavedState,
  validateAndMergeBackup,
  exportBackup,
  getBookSummary,
  DEFAULT_SAVED_STATE,
} from './bible-engine';

test('Bible engine loads 66 books and 31,103 verses', () => {
  const engine = ensureEngine();
  assert.ok(engine, 'Engine should initialize');
  assert.equal(engine.bible.books.length, 66);
  assert.equal(engine.bible.verses.length, 31103);
  assert.equal(engine.topics.length, 37);
  assert.equal(engine.curated.length, 124);
});

test('Direct scripture reference parsing', () => {
  const engine = ensureEngine();
  const res = engine.search('Giovanni 3:16', 'all');
  assert.equal(res.direct, true);
  assert.ok(res.items.length > 0);
  assert.equal(res.items[0].doc.ref, 'Giovanni 3:16');
  assert.equal(res.items[0].doc.b, 42); // Giovanni index
  assert.equal(res.items[0].doc.c, 3);
  assert.equal(res.items[0].doc.start, 16);
});

test('Thematic search retrieves pertinent passages', () => {
  const engine = ensureEngine();
  const res = engine.search('Come affrontare la paura del futuro?', 'all');
  assert.ok(res.items.length > 0, 'Should find results for fear');
  assert.ok(res.topics.some((t: any) => t.title.toLowerCase().includes('paura')));
});

test('Backup validation and merging preserves user data', () => {
  const engine = ensureEngine();
  const current = {
    ...DEFAULT_SAVED_STATE,
    favorites: ['p0'],
    notes: { p0: 'Mio appunto esistente' },
  };

  const backupData = {
    app: 'selah',
    version: 1,
    data: {
      favorites: ['p0', 'p1'],
      notes: { p0: 'Appunto aggiornato', p1: 'Altro appunto' },
      readingPosition: { b: 0, c: 1, v: 1 }
    }
  };

  const result = validateAndMergeBackup(current, JSON.stringify(backupData), engine);
  assert.equal(result.success, true);
  assert.ok(result.state);
  assert.deepEqual(result.state.favorites.sort(), ['p0', 'p1'].sort());
  assert.equal(result.state.notes['p0'], 'Appunto aggiornato');
  assert.equal(result.state.notes['p1'], 'Altro appunto');
  assert.deepEqual(result.state.readingPosition, { b: 0, c: 1, v: 1 });
});

test('Book summaries provide contextual insights', () => {
  const summaryGenesi = getBookSummary(0, 'Genesi');
  assert.ok(summaryGenesi.includes('Racconti delle origini'));
  const summaryMatteo = getBookSummary(39, 'Matteo');
  assert.ok(summaryMatteo.includes('Vangelo'));
});
