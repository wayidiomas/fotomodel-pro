#!/usr/bin/env node

/**
 * Insere poses no Supabase em lotes usando SQL
 */

const fs = require('fs');

const BATCH_SIZE = 50;

async function main() {
  console.log('🚀 Preparando inserção de poses no Supabase em lotes...\n');

  try {
    // Lê o arquivo JSON gerado
    const posesData = JSON.parse(fs.readFileSync('./poses-migrated.json', 'utf8'));
    console.log(`📊 Total de ${posesData.length} poses para inserir`);
    console.log(`📦 Dividindo em lotes de ${BATCH_SIZE} registros\n`);

    // Divide em lotes
    const batches = [];
    for (let i = 0; i < posesData.length; i += BATCH_SIZE) {
      batches.push(posesData.slice(i, i + BATCH_SIZE));
    }

    console.log(`✅ ${batches.length} lotes criados\n`);

    // Para cada lote, gera um arquivo SQL
    for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
      const batch = batches[batchIndex];
      const valuesParts = [];

      // Escapa strings para SQL
      const escapeSql = (str) => {
        if (str === null || str === undefined) return 'NULL';
        return `'${str.replace(/'/g, "''")}'`;
      };

      for (const pose of batch) {
        // Converte arrays e objetos para formato PostgreSQL
        const garmentCategoriesArray = pose.garment_categories.length > 0
          ? `ARRAY[${pose.garment_categories.map(c => escapeSql(c)).join(', ')}]::text[]`
          : 'ARRAY[]::text[]';

        const tagsArray = 'ARRAY[]::text[]';
        const metadataJson = `'${JSON.stringify(pose.metadata).replace(/'/g, "''")}'::jsonb`;

        // Monta a linha de INSERT
        valuesParts.push(`(
        ${escapeSql(pose.image_url)},
        NULL,
        '${pose.gender}'::model_gender,
        ${pose.age_min},
        ${pose.age_max},
        '${pose.age_range}'::age_range,
        '${pose.ethnicity}'::model_ethnicity,
        '${pose.pose_category}'::pose_category,
        ${garmentCategoriesArray},
        ${escapeSql(pose.name)},
        ${pose.description === null ? 'NULL' : escapeSql(pose.description)},
        ${tagsArray},
        ${metadataJson},
        ${pose.is_active},
        ${pose.is_featured}
      )`);
      }

      // Monta o SQL para este lote
      const sql = `
INSERT INTO model_poses (
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
${valuesParts.join(',\n')}
ON CONFLICT (id) DO NOTHING;
      `.trim();

      // Salva o SQL em arquivo
      const filename = `./insert-poses-batch-${batchIndex + 1}.sql`;
      fs.writeFileSync(filename, sql);
      console.log(`   ✓ Lote ${batchIndex + 1}/${batches.length}: ${batch.length} poses → ${filename}`);
    }

    console.log(`\n✅ Todos os lotes gerados!`);
    console.log(`\n📋 Próximo passo: Execute cada arquivo SQL no Supabase`);

  } catch (error) {
    console.error('❌ Erro:', error);
    process.exit(1);
  }
}

main();
