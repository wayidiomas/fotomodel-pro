# Supabase Storage Buckets Setup

Este documento contém as instruções para criar e configurar os buckets de storage no Supabase.

## Buckets a Criar

### 1. user-uploads (Private)
**Propósito**: Imagens originais carregadas pelos usuários

**Configurações**:
- Nome: `user-uploads`
- Public: `false`
- File size limit: `10485760` (10MB)
- Allowed MIME types: `image/jpeg,image/png,image/webp`

**RLS Policy**:
```sql
-- Users can upload their own images
CREATE POLICY "Users can upload own images"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'user-uploads' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Users can read their own images
CREATE POLICY "Users can read own images"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'user-uploads' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Users can delete their own images
CREATE POLICY "Users can delete own images"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'user-uploads' AND
  auth.uid()::text = (storage.foldername(name))[1]
);
```

---

### 2. generated-images (Private)
**Propósito**: Imagens geradas pela IA (com watermark)

**Configurações**:
- Nome: `generated-images`
- Public: `false`
- File size limit: `20971520` (20MB)
- Allowed MIME types: `image/jpeg,image/png,image/webp`

**RLS Policy**:
```sql
-- Service role can insert generated images
CREATE POLICY "Service role can insert generated images"
ON storage.objects
FOR INSERT
TO service_role
WITH CHECK (bucket_id = 'generated-images');

-- Users can read their own generated images
CREATE POLICY "Users can read own generated images"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'generated-images' AND
  auth.uid()::text = (storage.foldername(name))[1]
);
```

---

### 3. purchased-images (Private)
**Propósito**: Imagens sem watermark após compra

**Configurações**:
- Nome: `purchased-images`
- Public: `false`
- File size limit: `20971520` (20MB)
- Allowed MIME types: `image/jpeg,image/png,image/webp`

**RLS Policy**:
```sql
-- Service role can insert purchased images
CREATE POLICY "Service role can insert purchased images"
ON storage.objects
FOR INSERT
TO service_role
WITH CHECK (bucket_id = 'purchased-images');

-- Users can read their own purchased images
CREATE POLICY "Users can read own purchased images"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'purchased-images' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Users can download their purchased images
CREATE POLICY "Users can download own purchased images"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'purchased-images' AND
  auth.uid()::text = (storage.foldername(name))[1]
);
```

---

### 4. thumbnails (Private)
**Propósito**: Thumbnails 300x400px para preview rápido

**Configurações**:
- Nome: `thumbnails`
- Public: `false`
- File size limit: `2097152` (2MB)
- Allowed MIME types: `image/jpeg,image/png,image/webp`

**RLS Policy**:
```sql
-- Service role can insert thumbnails
CREATE POLICY "Service role can insert thumbnails"
ON storage.objects
FOR INSERT
TO service_role
WITH CHECK (bucket_id = 'thumbnails');

-- Users can read their own thumbnails
CREATE POLICY "Users can read own thumbnails"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'thumbnails' AND
  auth.uid()::text = (storage.foldername(name))[1]
);
```

---

### 5. promotional-content (Public)
**Propósito**: Banners, exemplos, tutoriais

**Configurações**:
- Nome: `promotional-content`
- Public: `true`
- File size limit: `10485760` (10MB)
- Allowed MIME types: `image/jpeg,image/png,image/webp,image/svg+xml`

**RLS Policy**:
```sql
-- Anyone can read promotional content
CREATE POLICY "Anyone can read promotional content"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'promotional-content');

-- Only service role can insert/update/delete promotional content
CREATE POLICY "Service role can manage promotional content"
ON storage.objects
FOR ALL
TO service_role
USING (bucket_id = 'promotional-content');
```

---

## Como Criar os Buckets

### Via Supabase Dashboard (Recomendado)

1. Acesse: https://supabase.com/dashboard/project/vqatwepdltjdfyoaeodr/storage/buckets
2. Clique em "New bucket"
3. Preencha as configurações de cada bucket conforme especificado acima
4. Após criar cada bucket, vá em "Policies" e adicione as políticas RLS correspondentes

### Via SQL (Alternativa)

Execute no SQL Editor do Supabase:

```sql
-- Create user-uploads bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'user-uploads',
  'user-uploads',
  false,
  10485760,
  ARRAY['image/jpeg', 'image/png', 'image/webp']
);

-- Create generated-images bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'generated-images',
  'generated-images',
  false,
  20971520,
  ARRAY['image/jpeg', 'image/png', 'image/webp']
);

-- Create purchased-images bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'purchased-images',
  'purchased-images',
  false,
  20971520,
  ARRAY['image/jpeg', 'image/png', 'image/webp']
);

-- Create thumbnails bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'thumbnails',
  'thumbnails',
  false,
  2097152,
  ARRAY['image/jpeg', 'image/png', 'image/webp']
);

-- Create promotional-content bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'promotional-content',
  'promotional-content',
  true,
  10485760,
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml']
);
```

---

## Estrutura de Paths

### user-uploads
```
{user_id}/{timestamp}_{original_filename}
Exemplo: 550e8400-e29b-41d4-a716-446655440000/1736899200000_dress.jpg
```

### generated-images
```
{user_id}/generations/{generation_id}.png
Exemplo: 550e8400-e29b-41d4-a716-446655440000/generations/abc123-def456.png
```

### purchased-images
```
{user_id}/downloads/{download_id}.png
Exemplo: 550e8400-e29b-41d4-a716-446655440000/downloads/xyz789.png
```

### thumbnails
```
{user_id}/thumbnails/{original_id}_thumb.jpg
Exemplo: 550e8400-e29b-41d4-a716-446655440000/thumbnails/abc123_thumb.jpg
```

### promotional-content
```
banners/{id}.jpg
examples/{category}/{id}.jpg
tutorials/{id}.jpg
```

---

## Verificação

Após criar os buckets, verifique:

1. ✅ Todos os 5 buckets foram criados
2. ✅ Configurações de tamanho e MIME types estão corretas
3. ✅ RLS policies foram aplicadas
4. ✅ Testar upload em cada bucket (via dashboard ou API)

---

## Próximos Passos

Após configurar os buckets:
1. Criar helpers de upload em `/lib/storage/upload.ts`
2. Implementar geração de thumbnails
3. Criar API routes para upload e download
4. Integrar com sistema de gerações de IA
