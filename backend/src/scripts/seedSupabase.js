// script to fetch API, parse CSV, and push to Supabase
require('dotenv').config({ path: '.env.local' });
const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
const { createClient } = require('@supabase/supabase-js');
const fetch = require('node-fetch');

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error("Missing Supabase credentials in .env.local");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

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
  console.log("🚀 Starting Supabase Data Ingestion...");

  try {
    // 1. Fetch API Data
    console.log(`📡 Fetching live data from ${API_URL}...`);
    const response = await fetch(API_URL);
    const apiResult = await response.json();
    if (!apiResult.success || !apiResult.data) {
      throw new Error("Failed to fetch valid API data");
    }
    const apiMps = apiResult.data;
    console.log(`✅ Fetched ${apiMps.length} MPs from API`);

    // 2. Parse CSVs
    const lsPath = path.join(__dirname, '../data/lok_sabha_mps.csv');
    const rsPath = path.join(__dirname, '../data/rajya_sabha_mps.csv');
    
    console.log(`📂 Parsing CSV files...`);
    const lsData = fs.existsSync(lsPath) ? await parseCSV(lsPath) : [];
    const rsData = fs.existsSync(rsPath) ? await parseCSV(rsPath) : [];
    const allCsvData = [...lsData, ...rsData];
    console.log(`✅ Parsed ${allCsvData.length} records from CSVs`);

    // 3. Merging Data
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

      return {
        id: apiRow.id,
        mp_name: apiRow.mpName,
        house: apiRow.house,
        state: apiRow.state,
        constituency: apiRow.constituency,
        allocated_amount: baseAllocated,
        total_expenditure: Number(apiRow.totalExpenditure) || 0,
        utilization_percentage: Number(apiRow.utilizationPercentage) || 0,
        completed_works_count: Number(apiRow.completedWorksCount) || 0,
        recommended_works_count: Number(apiRow.recommendedWorksCount) || 0,
        completion_rate: Number(apiRow.completionRate) || 0,
        unspent_amount: Number(apiRow.unspentAmount) || 0,
        payment_gap_percentage: Number(apiRow.paymentGapPercentage) || 0,
        risk_score: 0 
      };
    });

    console.log(`✅ Ready to push ${mergedData.length} merged records to Supabase`);

    const BATCH_SIZE = 100;
    for (let i = 0; i < mergedData.length; i += BATCH_SIZE) {
      const batch = mergedData.slice(i, i + BATCH_SIZE);
      console.log(`📤 Upserting batch ${Math.floor(i/BATCH_SIZE) + 1} of ${Math.ceil(mergedData.length/BATCH_SIZE)}...`);
      
      const { error } = await supabase
        .from('mps')
        .upsert(batch, { onConflict: 'id' });

      if (error) {
        console.error("❌ Supabase Upsert Error:", error);
      }
    }

    console.log("🎉 Data Ingestion Complete!");
    
  } catch (error) {
    console.error("❌ Ingestion Failed:", error);
  }
}

runSeeder();
