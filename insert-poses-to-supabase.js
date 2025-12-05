#!/usr/bin/env node

/**
 * Insere as poses migradas do Bubble no Supabase
 */

const fs = require('fs');

async function main() {
  console.log('🚀 Inserindo poses no Supabase...\n');

  try {
    // Lê o arquivo JSON gerado
    const posesData = JSON.parse(fs.readFileSync('./poses-migrated.json', 'utf8'));
    console.log(`📊 Total de ${posesData.length} poses para inserir\n`);

    // Prepara os valores para INSERT
    const valuesParts = [];

    for (const pose of posesData) {
      // Escapa strings para SQL
      const escapeSql = (str) => {
        if (str === null || str === undefined) return 'NULL';
        return `'${str.replace(/'/g, "''")}'`;
      };

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

    // Monta o SQL completo
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
    fs.writeFileSync('./insert-poses.sql', sql);
    console.log('✅ SQL gerado: insert-poses.sql');
    console.log(`📝 Total de ${valuesParts.length} registros no INSERT\n`);
    console.log('Use o MCP do Supabase para executar este SQL!\n');

  } catch (error) {
    console.error('❌ Erro:', error);
    process.exit(1);
  }
}

main();
