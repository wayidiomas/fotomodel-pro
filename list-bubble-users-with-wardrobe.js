/**
 * Lista usuários do Bubble que têm peças de vestuário
 */

const BUBBLE_API_URL = 'https://elias-57540.bubbleapps.io/version-live/api/1.1';
const BUBBLE_API_TOKEN = 'a7ba4699d25b72985084c92773db7048';

async function bubbleRequest(endpoint) {
  const url = `${BUBBLE_API_URL}${endpoint}`;
  const response = await fetch(url, {
    headers: {
      'api_key_fotomodel': `Bearer ${BUBBLE_API_TOKEN}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Bubble API Error: ${response.status}`);
  }

  return response.json();
}

async function main() {
  console.log('📦 Buscando todas as peças de vestuário no Bubble...\n');

  const endpoint = `/obj/${encodeURIComponent('vestuário')}?limit=1000`;
  const data = await bubbleRequest(endpoint);

  const vestuario = data.response.results;
  console.log(`✅ Total de peças encontradas: ${vestuario.length}\n`);

  // Agrupa por dono
  const byUser = {};
  vestuario.forEach(item => {
    const userId = item.Dono;
    if (!userId) return;

    if (!byUser[userId]) {
      byUser[userId] = {
        userId,
        items: [],
      };
    }
    byUser[userId].items.push(item);
  });

  console.log(`👤 Usuários com peças de vestuário: ${Object.keys(byUser).length}\n`);

  // Busca dados dos usuários
  console.log('📋 Listando usuários:\n');

  for (const userId of Object.keys(byUser)) {
    try {
      const userEndpoint = `/obj/user/${userId}`;
      const userData = await bubbleRequest(userEndpoint);
      const user = userData.response;

      byUser[userId].user = user;

      console.log(`━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`);
      console.log(`👤 Nome: ${user.Nome || 'Sem nome'}`);
      console.log(`📧 Email: ${user['Email txt'] || 'N/A'}`);
      console.log(`🆔 Bubble ID: ${userId}`);
      console.log(`👗 Peças de vestuário: ${byUser[userId].items.length}`);

      // Lista categorias
      const categories = {};
      byUser[userId].items.forEach(item => {
        const cat = item.Categoria || 'Sem categoria';
        categories[cat] = (categories[cat] || 0) + 1;
      });

      console.log(`📦 Categorias:`);
      Object.entries(categories).forEach(([cat, count]) => {
        console.log(`   • ${cat}: ${count}`);
      });
      console.log('');
    } catch (error) {
      console.error(`   ❌ Erro ao buscar usuário ${userId}: ${error.message}\n`);
    }
  }

  console.log('\n✅ Para migrar um usuário específico, use:');
  console.log('   node migrate-wardrobe-by-bubble-id.js <bubble_user_id>');
}

main().catch(console.error);
