#!/usr/bin/env node

/**
 * Gera queries SQL para inserir todas as poses do JSON
 * Divide em lotes de 100 para facilitar a execução
 */

const fs = require('fs');

const BATCH_SIZE = 100;

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

  return `(
  ${escapeString(pose.image_url)},
  NULL,
  '${pose.gender}',
  ${pose.age_min},
  ${pose.age_max},
  '${pose.age_range}',
  '${pose.ethnicity}',
  '${pose.pose_category}',
  ${garmentCategoriesArray},
  ${escapeString(pose.name)},
  ${pose.description === null ? 'NULL' : escapeString(pose.description)},
  ${tagsArray},
  ${metadataJson},
  ${pose.is_active},
  ${pose.is_featured}
)`;
}

async function main() {
  console.log('🚀 Gerando SQLs para inserção de poses...\n');

  try {
    // Lê o arquivo JSON gerado
    const allPoses = JSON.parse(fs.readFileSync('./poses-migrated.json', 'utf8'));

    // Pula as 2 primeiras que já foram inseridas no teste
    const posesData = allPoses.slice(2);

    console.log(`📊 Total de ${posesData.length} poses para inserir (pulando 2 já inseridas)`);
    console.log(`📦 Dividindo em lotes de ${BATCH_SIZE}\n`);

    // Divide em lotes
    const batches = [];
    for (let i = 0; i < posesData.length; i += BATCH_SIZE) {
      batches.push(posesData.slice(i, i + BATCH_SIZE));
    }

    console.log(`✅ ${batches.length} lotes criados\n`);

    // Para cada lote, gera o SQL
    for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
      const batch = batches[batchIndex];
      const valueRows = batch.map(pose => generateValueRow(pose));

      const sql = `INSERT INTO model_poses (
  image_url,
  storage_path,
  gender,
  age_min,
  age_max,
  age_range,
  ethnicity,
  pose_category,
  garment_categories,
  name,
  description,
  tags,
  metadata,
  is_active,
  is_featured
) VALUES
${valueRows.join(',\n')};`;

      const filename = `./batch-${String(batchIndex + 1).padStart(2, '0')}.sql`;
      fs.writeFileSync(filename, sql);
      console.log(`   ✓ Lote ${batchIndex + 1}/${batches.length}: ${batch.length} poses → ${filename}`);
    }

    console.log(`\n✅ Todos os arquivos SQL gerados!`);
    console.log(`\n📋 Execute cada arquivo SQL usando o MCP do Supabase`);
    console.log(`   Comando: mcp__supabase__execute_sql com o conteúdo de cada arquivo\n`);

  } catch (error) {
    console.error('❌ Erro:', error);
    process.exit(1);
  }
}

main();
