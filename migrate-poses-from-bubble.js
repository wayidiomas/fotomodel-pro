#!/usr/bin/env node

/**
 * Migração de Poses do Bubble.io para Supabase
 *
 * Busca todas as poses do Bubble e migra para a tabela model_poses do Supabase
 */

const BUBBLE_API_URL = 'https://elias-57540.bubbleapps.io/version-live/api/1.1';
const BUBBLE_API_TOKEN = 'a7ba4699d25b72985084c92773db7048';

// Mapeamento de idade do Bubble para age_range do Supabase
function parseIdade(idadeStr) {
  // Exemplos: "Adulto 21 a 40 anos", "Adolescente 13 a 20", "Maduro 41 a 60"
  const match = idadeStr?.match(/(\d+)\s*a\s*(\d+)/);

  if (!match) {
    console.warn(`⚠️  Idade não reconhecida: ${idadeStr}, usando padrão 21-40`);
    return { age_min: 21, age_max: 40, age_range: 'TWENTIES' };
  }

  const age_min = parseInt(match[1]);
  const age_max = parseInt(match[2]);

  // Determina age_range baseado na média
  const avgAge = (age_min + age_max) / 2;
  let age_range;

  if (avgAge < 20) age_range = 'TEENS';
  else if (avgAge < 30) age_range = 'TWENTIES';
  else if (avgAge < 40) age_range = 'THIRTIES';
  else if (avgAge < 50) age_range = 'FORTIES';
  else if (avgAge < 60) age_range = 'FIFTIES';
  else age_range = 'SIXTIES_PLUS';

  return { age_min, age_max, age_range };
}

// Mapeamento de gênero do Bubble para gender enum do Supabase
function mapGender(genero) {
  const genderMap = {
    'Masculino': 'MALE',
    'Feminino': 'FEMALE',
  };

  return genderMap[genero] || 'NON_BINARY';
}

// Normaliza array de roupas para garment_categories
function mapGarmentCategories(roupas) {
  if (!Array.isArray(roupas)) return [];

  return roupas.map(roupa => {
    // Normaliza para lowercase e remove acentos
    return roupa
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '');
  });
}

// Corrige URL da imagem do Bubble
function fixImageUrl(bubbleUrl) {
  if (!bubbleUrl) return null;

  // Remove "//" do início e adiciona https:
  if (bubbleUrl.startsWith('//')) {
    return 'https:' + bubbleUrl;
  }

  return bubbleUrl;
}

// Busca todas as poses do Bubble (com paginação)
async function fetchAllPosesFromBubble() {
  const allPoses = [];
  let cursor = 0;
  const limit = 100; // Máximo por página
  let hasMore = true;

  console.log('📥 Buscando poses do Bubble...');

  while (hasMore) {
    const url = `${BUBBLE_API_URL}/obj/pose?limit=${limit}&cursor=${cursor}`;

    const response = await fetch(url, {
      headers: {
        'api_key_fotomodel': `Bearer ${BUBBLE_API_TOKEN}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`Erro ao buscar poses: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    const poses = data.response.results;

    allPoses.push(...poses);
    console.log(`   ✓ Baixados ${allPoses.length} poses...`);

    // Verifica se há mais resultados
    if (data.response.remaining === 0 || poses.length === 0) {
      hasMore = false;
    } else {
      cursor += poses.length;
    }
  }

  console.log(`✅ Total de ${allPoses.length} poses baixadas do Bubble\n`);
  return allPoses;
}

// Transforma pose do Bubble para formato do Supabase
function transformPose(bubblePose) {
  const ageData = parseIdade(bubblePose.Idade);

  return {
    image_url: fixImageUrl(bubblePose.Imagem),
    gender: mapGender(bubblePose.Gênero),
    age_min: ageData.age_min,
    age_max: ageData.age_max,
    age_range: ageData.age_range,
    pose_category: 'STANDING_CASUAL', // Default, pode ser ajustado depois
    ethnicity: 'OTHER', // Bubble não tem esse campo
    garment_categories: mapGarmentCategories(bubblePose.Roupas),
    name: `Pose ${bubblePose['API id']}`,
    description: null,
    tags: [],
    metadata: {
      bubble_id: bubblePose._id,
      api_id: bubblePose['API id'],
      api_id_number: bubblePose['API ID number'],
      created_by: bubblePose['Created By'],
      bubble_created_at: bubblePose['Created Date'],
      bubble_modified_at: bubblePose['Modified Date'],
    },
    is_active: true,
    is_featured: false,
  };
}

// Função principal
async function main() {
  console.log('🚀 Iniciando migração de poses do Bubble para Supabase\n');

  try {
    // 1. Busca todas as poses do Bubble
    const bubblePoses = await fetchAllPosesFromBubble();

    // 2. Transforma os dados
    console.log('🔄 Transformando dados...');
    const supabasePoses = bubblePoses.map(transformPose);
    console.log(`✅ ${supabasePoses.length} poses transformadas\n`);

    // 3. Exibe amostra dos dados transformados
    console.log('📋 Amostra dos primeiros 3 registros:\n');
    console.log(JSON.stringify(supabasePoses.slice(0, 3), null, 2));

    // 4. Salva em arquivo JSON para inspeção
    const fs = require('fs');
    const outputPath = './poses-migrated.json';
    fs.writeFileSync(outputPath, JSON.stringify(supabasePoses, null, 2));
    console.log(`\n💾 Dados salvos em: ${outputPath}`);

    console.log(`\n✅ Migração concluída! Total: ${supabasePoses.length} poses prontas`);
    console.log('\n📌 Próximos passos:');
    console.log('   1. Revisar o arquivo poses-migrated.json');
    console.log('   2. Usar o MCP do Supabase para inserir os dados na tabela model_poses');

  } catch (error) {
    console.error('\n❌ Erro na migração:', error);
    process.exit(1);
  }
}

// Executa
main();
