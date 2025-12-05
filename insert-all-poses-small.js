#!/usr/bin/env node

const fs = require('fs');
const BATCH_SIZE = 20;

function escapeString(str) {
  if (str === null || str === undefined) return 'NULL';
  return `'${str.replace(/'/g, "''").replace(/\\/g, '\\\\')}'`;
}

function generateValueRow(pose) {
  const garmentCategoriesArray = pose.garment_categories.length > 0
    ? `ARRAY[${pose.garment_categories.map(c => escapeString(c)).join(', ')}]::text[]`
    : 'ARRAY[]::text[]';

  const tagsArray = 'ARRAY[]::text[]';
  const metadataJson = escapeString(JSON.stringify(pose.metadata)) + '::jsonb';

  return `(${escapeString(pose.image_url)},NULL,'${pose.gender}',${pose.age_min},${pose.age_max},'${pose.age_range}','${pose.ethnicity}','${pose.pose_category}',${garmentCategoriesArray},${escapeString(pose.name)},${pose.description === null ? 'NULL' : escapeString(pose.description)},${tagsArray},${metadataJson},${pose.is_active},${pose.is_featured})`;
}

const allPoses = JSON.parse(fs.readFileSync('./poses-migrated.json', 'utf8'));
const posesData = allPoses.slice(2);

console.log(`📊 ${posesData.length} poses para inserir em lotes de ${BATCH_SIZE}\n`);

for (let i = 0; i < posesData.length; i += BATCH_SIZE) {
  const batch = posesData.slice(i, i + BATCH_SIZE);
  const valueRows = batch.map(pose => generateValueRow(pose));

  const sql = `INSERT INTO model_poses (image_url,storage_path,gender,age_min,age_max,age_range,ethnicity,pose_category,garment_categories,name,description,tags,metadata,is_active,is_featured) VALUES ${valueRows.join(',\n')};`;

  const batchNum = Math.floor(i / BATCH_SIZE) + 1;
  const filename = `./batch-${String(batchNum).padStart(3, '0')}.sql`;
  fs.writeFileSync(filename, sql);
  console.log(`   ✓ Lote ${batchNum}: ${batch.length} poses → ${filename}`);
}

console.log(`\n✅ Concluído!`);
