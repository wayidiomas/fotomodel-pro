/**
 * Script para migrar peças de vestuário do Bubble para Supabase
 *
 * Busca todas as peças de vestuário de um usuário no Bubble e importa para:
 * - user_uploads (armazena a imagem)
 * - wardrobe_items (armazena os metadados da peça)
 *
 * Uso: node migrate-wardrobe-from-bubble.js <phone_number>
 * Exemplo: node migrate-wardrobe-from-bubble.js +5521980390959
 */

const fs = require('fs');

// ============= CONFIG =============
const BUBBLE_API_URL = process.env.BUBBLE_API_URL || 'https://elias-57540.bubbleapps.io/version-live/api/1.1';
const BUBBLE_API_TOKEN = process.env.BUBBLE_API_TOKEN || 'a7ba4699d25b72985084c92773db7048';

if (!BUBBLE_API_URL || !BUBBLE_API_TOKEN) {
  console.error('❌ BUBBLE_API_URL e BUBBLE_API_TOKEN são obrigatórios');
  process.exit(1);
}

// ============= BUBBLE API =============

async function bubbleRequest(endpoint) {
  const url = `${BUBBLE_API_URL}${endpoint}`;
  const response = await fetch(url, {
    headers: {
      'api_key_fotomodel': `Bearer ${BUBBLE_API_TOKEN}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Bubble API Error: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

async function getBubbleUserByPhone(phone) {
  // Remove '+' do telefone para buscar no Bubble
  const cleanPhone = phone.replace(/\+/g, '');

  // Tenta buscar com o campo Telefone (sem constraints para debug)
  const endpoint = `/obj/user?limit=100`;
  const data = await bubbleRequest(endpoint);

  // Busca manualmente no array de resultados
  const user = data.response.results.find(u =>
    u.Telefone === cleanPhone ||
    u.Telefone === phone ||
    u['Telefone']?.replace(/\+/g, '') === cleanPhone
  );

  if (!user) {
    console.log(`\n⚠️  Telefones encontrados no Bubble (primeiros 10):`);
    data.response.results.slice(0, 10).forEach(u => {
      console.log(`   - ${u.Telefone || u['Telefone'] || 'N/A'} (${u.Nome || 'Sem nome'})`);
    });
  }

  return user || null;
}

async function getVestuarioByBubbleUser(bubbleUserId) {
  const constraints = JSON.stringify([{
    key: 'Dono',
    constraint_type: 'equals',
    value: bubbleUserId,
  }]);

  const endpoint = `/obj/${encodeURIComponent('vestuário')}?constraints=${encodeURIComponent(constraints)}&limit=1000`;
  const data = await bubbleRequest(endpoint);

  return data.response.results;
}

// ============= MAPPING FUNCTIONS =============

function mapCategoria(categoria, subcategoria) {
  // Mapeia categorias do Bubble para slugs do Supabase
  const categoryMap = {
    'Vestido': 'vestido',
    'Calça': 'calca',
    'Camisa': 'camisa',
    'Blusa': 'blusa',
    'Saia': 'saia',
    'Shorts': 'short',
    'Jaqueta': 'jaqueta',
    'Casaco': 'casaco',
    'Blazer': 'blazer',
    'Top': 'top',
    'Regata': 'regata',
  };

  const slug = categoryMap[categoria] || 'outros';

  // Se tem subcategoria, adiciona ao slug
  if (subcategoria) {
    return `${slug}-${subcategoria.toLowerCase().replace(/\s+/g, '-')}`;
  }

  return slug;
}

function fixImageUrl(bubbleUrl) {
  if (!bubbleUrl) return null;
  if (bubbleUrl.startsWith('//')) {
    return 'https:' + bubbleUrl;
  }
  return bubbleUrl;
}

function generateFileName(categoria, index) {
  const timestamp = Date.now();
  const categorySlug = categoria?.toLowerCase().replace(/\s+/g, '-') || 'peca';
  return `${categorySlug}-${timestamp}-${index}.jpg`;
}

// ============= MAIN SCRIPT =============

async function migrateWardrobe(phone) {
  console.log(`\n🔍 Buscando usuário no Bubble: ${phone}`);

  // 1. Buscar usuário no Bubble
  const bubbleUser = await getBubbleUserByPhone(phone);

  if (!bubbleUser) {
    console.error(`❌ Usuário não encontrado no Bubble: ${phone}`);
    return;
  }

  console.log(`✅ Usuário encontrado: ${bubbleUser.Nome || 'Sem nome'} (ID: ${bubbleUser._id})`);

  // 2. Buscar peças de vestuário do usuário no Bubble
  console.log(`\n📦 Buscando peças de vestuário do usuário...`);
  const vestuario = await getVestuarioByBubbleUser(bubbleUser._id);

  if (vestuario.length === 0) {
    console.log(`ℹ️  Nenhuma peça de vestuário encontrada para este usuário`);
    return;
  }

  console.log(`✅ Encontradas ${vestuario.length} peças de vestuário`);

  // 3. Processar e transformar dados
  const wardrobe = vestuario.map((item, index) => {
    const imageUrl = fixImageUrl(item.Imagem);
    const categorySlug = mapCategoria(item.Categoria, item.Subcategoria);
    const fileName = generateFileName(item.Categoria, index);

    return {
      // Dados do Bubble
      bubble_id: item._id,
      bubble_user_id: bubbleUser._id,
      bubble_categoria: item.Categoria,
      bubble_subcategoria: item.Subcategoria,
      bubble_colecao: item['Coleção'],
      bubble_created_date: item['Created Date'],
      bubble_modified_date: item['Modified Date'],

      // Dados para Supabase
      image_url: imageUrl,
      file_name: fileName,
      category_slug: categorySlug,

      // Determinar garment_type e piece_type
      garment_type: 'single', // Assumindo peça única
      piece_type: categorySlug.includes('calca') || categorySlug.includes('short') || categorySlug.includes('saia')
        ? 'lower'
        : categorySlug.includes('vestido')
        ? 'full'
        : 'upper',
    };
  });

  // 4. Gerar dados para o SQL
  const result = {
    phone,
    bubble_user: {
      id: bubbleUser._id,
      name: bubbleUser.Nome,
      email: bubbleUser['Email txt'],
    },
    wardrobe,
    totalItems: wardrobe.length,
    timestamp: new Date().toISOString(),
  };

  // 5. Salvar JSON
  const jsonFileName = `wardrobe-migrated-${phone.replace(/\+/g, '')}.json`;
  fs.writeFileSync(jsonFileName, JSON.stringify(result, null, 2));
  console.log(`\n💾 Dados salvos em: ${jsonFileName}`);

  // 6. Gerar SQL
  console.log(`\n📝 Gerando SQL para importação...`);

  let sql = `-- Importação de vestuário do Bubble para Supabase\n`;
  sql += `-- Usuário: ${phone} (${bubbleUser.Nome || 'Sem nome'})\n`;
  sql += `-- Total de peças: ${wardrobe.length}\n`;
  sql += `-- Data: ${new Date().toISOString()}\n\n`;

  sql += `-- ATENÇÃO: Este script assume que o usuário já existe na tabela users\n`;
  sql += `-- Substitua 'USER_UUID_HERE' pelo UUID do usuário no Supabase\n\n`;

  wardrobe.forEach((item, index) => {
    sql += `-- Peça ${index + 1}: ${item.bubble_categoria || 'Sem categoria'}`;
    if (item.bubble_subcategoria) {
      sql += ` - ${item.bubble_subcategoria}`;
    }
    sql += `\n`;

    sql += `WITH new_upload AS (\n`;
    sql += `  INSERT INTO user_uploads (\n`;
    sql += `    user_id,\n`;
    sql += `    file_path,\n`;
    sql += `    file_name,\n`;
    sql += `    file_size,\n`;
    sql += `    mime_type,\n`;
    sql += `    thumbnail_path,\n`;
    sql += `    status,\n`;
    sql += `    metadata,\n`;
    sql += `    created_at,\n`;
    sql += `    updated_at\n`;
    sql += `  ) VALUES (\n`;
    sql += `    'USER_UUID_HERE'::uuid,\n`;
    sql += `    '${item.image_url}',\n`;
    sql += `    '${item.file_name}',\n`;
    sql += `    0,\n`;
    sql += `    'image/jpeg',\n`;
    sql += `    '${item.image_url}',\n`;
    sql += `    'ready',\n`;
    sql += `    '${JSON.stringify({
      garmentType: item.garment_type,
      pieceType: item.piece_type,
      bubbleMetadata: {
        bubble_id: item.bubble_id,
        categoria: item.bubble_categoria,
        subcategoria: item.bubble_subcategoria,
        colecao: item.bubble_colecao,
      }
    })}'::jsonb,\n`;
    sql += `    '${item.bubble_created_date || new Date().toISOString()}',\n`;
    sql += `    '${item.bubble_modified_date || new Date().toISOString()}'\n`;
    sql += `  )\n`;
    sql += `  RETURNING id\n`;
    sql += `)\n`;
    sql += `INSERT INTO wardrobe_items (\n`;
    sql += `  user_id,\n`;
    sql += `  upload_id,\n`;
    sql += `  category_slug,\n`;
    sql += `  garment_type,\n`;
    sql += `  piece_type,\n`;
    sql += `  metadata,\n`;
    sql += `  created_at,\n`;
    sql += `  updated_at\n`;
    sql += `) SELECT\n`;
    sql += `  'USER_UUID_HERE'::uuid,\n`;
    sql += `  id,\n`;
    sql += `  '${item.category_slug}',\n`;
    sql += `  '${item.garment_type}',\n`;
    sql += `  '${item.piece_type}',\n`;
    sql += `  '${JSON.stringify({
      bubbleMetadata: {
        bubble_id: item.bubble_id,
        bubble_user_id: item.bubble_user_id,
        categoria: item.bubble_categoria,
        subcategoria: item.bubble_subcategoria,
        colecao: item.bubble_colecao,
      }
    })}'::jsonb,\n`;
    sql += `  '${item.bubble_created_date || new Date().toISOString()}',\n`;
    sql += `  '${item.bubble_modified_date || new Date().toISOString()}'\n`;
    sql += `FROM new_upload;\n\n`;
  });

  const sqlFileName = `wardrobe-import-${phone.replace(/\+/g, '')}.sql`;
  fs.writeFileSync(sqlFileName, sql);
  console.log(`✅ SQL gerado: ${sqlFileName}`);

  console.log(`\n📊 Resumo da migração:`);
  console.log(`   • Usuário: ${bubbleUser.Nome || 'Sem nome'}`);
  console.log(`   • Telefone: ${phone}`);
  console.log(`   • Bubble ID: ${bubbleUser._id}`);
  console.log(`   • Total de peças: ${wardrobe.length}`);

  const categoryCount = {};
  wardrobe.forEach(item => {
    const cat = item.bubble_categoria || 'Sem categoria';
    categoryCount[cat] = (categoryCount[cat] || 0) + 1;
  });

  console.log(`\n📦 Distribuição por categoria:`);
  Object.entries(categoryCount).forEach(([cat, count]) => {
    console.log(`   • ${cat}: ${count} peça(s)`);
  });

  console.log(`\n⚠️  PRÓXIMOS PASSOS:`);
  console.log(`   1. Abra o arquivo: ${sqlFileName}`);
  console.log(`   2. Substitua 'USER_UUID_HERE' pelo UUID do usuário no Supabase`);
  console.log(`   3. Execute o SQL usando o MCP do Supabase`);
}

// ============= EXECUTE =============

const phone = process.argv[2];

if (!phone) {
  console.error('❌ Uso: node migrate-wardrobe-from-bubble.js <phone_number>');
  console.error('   Exemplo: node migrate-wardrobe-from-bubble.js +5521980390959');
  process.exit(1);
}

migrateWardrobe(phone)
  .then(() => {
    console.log('\n✅ Migração concluída com sucesso!\n');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Erro na migração:', error.message);
    console.error(error);
    process.exit(1);
  });
