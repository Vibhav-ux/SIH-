require('dotenv').config({ path: '.env.local' });
const { Pool } = require('pg');
const fs = require('fs');
const csv = require('csv-parser');
const path = require('path');

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

const LOK_ID_COL = '\uFEFF"Sr. No."';
const RAJYA_ID_COL = '\uFEFF"Sr. No."';
const AMOUNT_COL = 'Allocated AMOUNT ( \u20B9 )';

async function parseCsv(filePath) {
  return new Promise((resolve, reject) => {
    const rows = [];
    fs.createReadStream(filePath)
      .pipe(csv())
      .on('data', (row) => rows.push(row))
      .on('end', () => resolve(rows))
      .on('error', reject);
  });
}

async function bulkInsert(client, records) {
  if (records.length === 0) return;
  const cols = ['id','name','constituency','state','party','total_funds','used_funds','email','phone','type'];
  const numCols = cols.length;
  const placeholders = records.map((_, i) =>
    '(' + cols.map((_, j) => '$' + (i * numCols + j + 1)).join(',') + ')'
  ).join(',');
  const values = records.flatMap(r => [r.id, r.name, r.constituency, r.state, r.party, r.totalFunds, r.usedFunds, r.email, r.phone, r.type]);
  await client.query(
    `INSERT INTO mps (${cols.join(',')}) VALUES ${placeholders} ON CONFLICT (id) DO NOTHING`,
    values
  );
}

async function init() {
  const client = await pool.connect();
  console.log('Connected to Neon DB');

  await client.query(`
    CREATE TABLE IF NOT EXISTS mps (
      id VARCHAR(255) PRIMARY KEY,
      name VARCHAR(255),
      constituency VARCHAR(255),
      state VARCHAR(255),
      party VARCHAR(100),
      total_funds BIGINT,
      used_funds BIGINT,
      email VARCHAR(255),
      phone VARCHAR(100),
      type VARCHAR(50)
    );
  `);
  await client.query('DELETE FROM mps');
  console.log('Table ready, cleared existing data');

  const lokRows = await parseCsv(path.join(__dirname, 'lok_sabha_mps.csv'));
  const lokRecords = lokRows.map(row => {
    const srNo = row[LOK_ID_COL] || row['Sr. No.'] || row[Object.keys(row)[0]];
    const amount = parseInt((row[AMOUNT_COL] || '0').replace(/,/g, ''), 10) || 0;
    return {
      id: 'LS-' + srNo,
      name: row["Hon'ble Members of Parliaments"] || 'Unknown',
      constituency: row['Constituency'] || '',
      state: row['State'] || '',
      party: 'Unknown',
      totalFunds: amount,
      usedFunds: Math.floor(amount * 0.5),
      email: 'contact@sansad.nic.in',
      phone: '',
      type: 'Lok Sabha'
    };
  });
  await bulkInsert(client, lokRecords);
  console.log('Lok Sabha MPs inserted: ' + lokRecords.length);

  const rajyaRows = await parseCsv(path.join(__dirname, 'rajya_sabha_mps.csv'));
  const rajyaRecords = rajyaRows.map(row => {
    const srNo = row[RAJYA_ID_COL] || row['Sr. No.'] || row[Object.keys(row)[0]];
    const amount = parseInt((row[AMOUNT_COL] || '0').replace(/,/g, ''), 10) || 0;
    return {
      id: 'RS-' + srNo,
      name: row["Hon'ble Members of Parliament"] || 'Unknown',
      constituency: row['Elected/Nominated'] || '',
      state: row['State'] || '',
      party: 'Unknown',
      totalFunds: amount,
      usedFunds: Math.floor(amount * 0.5),
      email: 'contact@sansad.nic.in',
      phone: '',
      type: 'Rajya Sabha'
    };
  });
  await bulkInsert(client, rajyaRecords);
  console.log('Rajya Sabha MPs inserted: ' + rajyaRecords.length);

  const result = await client.query('SELECT type, COUNT(*) as count FROM mps GROUP BY type');
  console.log('\nFinal counts in Neon DB:');
  result.rows.forEach(r => console.log('  ' + r.type + ': ' + r.count + ' MPs'));

  client.release();
  await pool.end();
  console.log('\nAll done!');
}

init().catch(console.error);
