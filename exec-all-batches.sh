#!/bin/bash

# Script para consolidar todos os lotes em um único SQL
# para executar via MCP do Supabase

echo "📦 Consolidando lotes 002-027 em um único SQL..."

# Cria arquivo consolidado
> all-batches-consolidated.sql

# Concatena todos os lotes de 002 a 027
for i in {002..027}; do
  if [ -f "batch-$i.sql" ]; then
    cat "batch-$i.sql" >> all-batches-consolidated.sql
    echo "" >> all-batches-consolidated.sql
    echo "   ✓ Lote $i adicionado"
  fi
done

echo ""
echo "✅ Arquivo consolidado criado: all-batches-consolidated.sql"
echo "📊 Total de registros:"
grep -c "INSERT INTO" all-batches-consolidated.sql
