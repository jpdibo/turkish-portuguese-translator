import fs from 'fs';
import pkg from 'pg';
const { Pool } = pkg;

const pool = new Pool({
  user: 'turkish_user',
  host: 'localhost',
  database: 'turkish_portuguese_db',
  password: 'password123', // Use your password
  port: 5432,
});

// Load words from a JSON file (see instructions above)
const data = JSON.parse(fs.readFileSync('./words_to_import.json', 'utf8'));

// Map language codes to IDs
const langCodes = { tr: null, en: null, pt: null };

async function getLanguageIds() {
  const res = await pool.query('SELECT code, id FROM languages WHERE code IN ($1, $2, $3)', ['tr', 'en', 'pt']);
  for (const row of res.rows) {
    langCodes[row.code] = row.id;
  }
}

async function getOrCreateWord(word, lang, difficulty = 1) {
  // Check if word exists
  const res = await pool.query(
    'SELECT id FROM words WHERE language_id = $1 AND (turkish_word = $2 OR english_word = $2 OR portuguese_word = $2)',
    [langCodes[lang], word]
  );
  if (res.rows.length > 0) return res.rows[0].id;
  // Insert new word
  let col = 'turkish_word';
  if (lang === 'en') col = 'english_word';
  if (lang === 'pt') col = 'portuguese_word';
  const insert = await pool.query(
    `INSERT INTO words (${col}, language_id, difficulty_level) VALUES ($1, $2, $3) RETURNING id`,
    [word, langCodes[lang], difficulty]
  );
  return insert.rows[0].id;
}

async function addExample(wordId, lang, example) {
  // Only add if example is provided
  if (!example) return;
  let col = 'turkish_example';
  if (lang === 'en') col = 'english_example';
  if (lang === 'pt') col = 'portuguese_example';
  await pool.query(
    `INSERT INTO word_examples (word_id, ${col}) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
    [wordId, example]
  );
}

async function addTranslation(sourceId, targetId) {
  await pool.query(
    'INSERT INTO translations (source_word_id, target_word_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
    [sourceId, targetId]
  );
}

async function importWords() {
  await getLanguageIds();
  let count = 0;
  for (const entry of data) {
    // Add words for each language
    const trId = await getOrCreateWord(entry.tr.word, 'tr', entry.difficulty || 1);
    const enId = await getOrCreateWord(entry.en.word, 'en', entry.difficulty || 1);
    const ptId = await getOrCreateWord(entry.pt.word, 'pt', entry.difficulty || 1);
    // Add examples
    await addExample(trId, 'tr', entry.tr.example);
    await addExample(enId, 'en', entry.en.example);
    await addExample(ptId, 'pt', entry.pt.example);
    // Add translations for all pairs
    await addTranslation(trId, enId);
    await addTranslation(enId, trId);
    await addTranslation(trId, ptId);
    await addTranslation(ptId, trId);
    await addTranslation(enId, ptId);
    await addTranslation(ptId, enId);
    count++;
  }
  console.log(`Imported ${count} word sets.`);
  await pool.end();
}

importWords(); 