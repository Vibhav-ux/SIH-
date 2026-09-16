require('dotenv').config({ path: '.env.local' });
const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
const fetch = require('node-fetch');
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

const API_URL = 'https://api.empoweredindian.in/api/summary/mps?page=1&limit=800';

async function parseCSV(filePath) {
  return new Promise((resolve, reject) => {
    const results = [];
    fs.createReadStream(filePath)
      .pipe(csv())
      .on('data', (data) => results.push(data))
      .on('end', () => resolve(results))
      .on('error', (err) => reject(err));
  });
}

function cleanString(str) {
  if (!str) return '';
  return str.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
}

async function runSeeder() {
  console.log("🚀 Starting Postgres Data Ingestion...");
  try {
    console.log(`📡 Fetching live data from ${API_URL}...`);
    const response = await fetch(API_URL);
    const apiResult = await response.json();
    const apiMps = apiResult.data;
    console.log(`✅ Fetched ${apiMps.length} MPs from API`);

    const lsPath = path.join(__dirname, 'src/data/lok_sabha_mps.csv');
    const rsPath = path.join(__dirname, 'src/data/rajya_sabha_mps.csv');
    
    console.log(`📂 Parsing CSV files...`);
    const lsData = fs.existsSync(lsPath) ? await parseCSV(lsPath) : [];
    const rsData = fs.existsSync(rsPath) ? await parseCSV(rsPath) : [];
    const allCsvData = [...lsData, ...rsData];
    console.log(`✅ Parsed ${allCsvData.length} records from CSVs`);

    console.log(`🔄 Merging API and CSV data...`);
    const mergedData = apiMps.map(apiRow => {
      const match = allCsvData.find(csvRow => {
        const csvName = cleanString(csvRow["Hon'ble Members of Parliaments"] || csvRow["Hon'ble Members of Parliament"]);
        const apiName = cleanString(apiRow.mpName);
        return csvName.includes(apiName) || apiName.includes(csvName);
      });

      let baseAllocated = Number(apiRow.allocatedAmount) || 0;
      if (baseAllocated === 0 && match) {
        baseAllocated = Number(match["Allocated AMOUNT ( ₹ )"]) || 0;
      }

      return [
        apiRow.id,
        apiRow.mpName,
        apiRow.house,
        apiRow.state,
        apiRow.constituency,
        baseAllocated,
        Number(apiRow.totalExpenditure) || 0,
        Number(apiRow.utilizationPercentage) || 0,
        Number(apiRow.completedWorksCount) || 0,
        Number(apiRow.recommendedWorksCount) || 0,
        Number(apiRow.completionRate) || 0,
        Number(apiRow.unspentAmount) || 0,
        Number(apiRow.paymentGapPercentage) || 0,
        0
      ];
    });

    console.log(`📤 Upserting to Database...`);
    
    // Create query
    const client = await pool.connect();
    
    // Make sure we have permissions for Supabase
    await client.query("GRANT ALL ON TABLE public.mps TO anon;");
    await client.query("GRANT ALL ON TABLE public.mps TO authenticated;");
    await client.query("GRANT ALL ON TABLE public.mps TO service_role;");
    await client.query("NOTIFY pgrst, 'reload schema';");
    
    const query = `
      INSERT INTO mps (
        id, mp_name, house, state, constituency, allocated_amount, total_expenditure,
        utilization_percentage, completed_works_count, recommended_works_count,
        completion_rate, unspent_amount, payment_gap_percentage, risk_score
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
      ON CONFLICT (id) DO UPDATE SET
        mp_name = EXCLUDED.mp_name,
        house = EXCLUDED.house,
        state = EXCLUDED.state,
        constituency = EXCLUDED.constituency,
        allocated_amount = EXCLUDED.allocated_amount,
        total_expenditure = EXCLUDED.total_expenditure,
        utilization_percentage = EXCLUDED.utilization_percentage,
        completed_works_count = EXCLUDED.completed_works_count,
        recommended_works_count = EXCLUDED.recommended_works_count,
        completion_rate = EXCLUDED.completion_rate,
        unspent_amount = EXCLUDED.unspent_amount,
        payment_gap_percentage = EXCLUDED.payment_gap_percentage
    `;
    
    for(const row of mergedData) {
      await client.query(query, row);
    }
    
    client.release();
    console.log("🎉 Data Ingestion Complete!");
    
  } catch (error) {
    console.error("❌ Ingestion Failed:", error);
  } finally {
    pool.end();
  }
}
runSeeder();
