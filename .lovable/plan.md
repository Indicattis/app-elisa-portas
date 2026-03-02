
# Corrigir erro 502 no upload em massa de midias

## Problema
Ao fazer upload em massa, arquivos grandes ou muitos arquivos em sequencia rapida causam erro 502 (Gateway Timeout) no Supabase Storage. A resposta retorna HTML em vez de JSON, gerando o erro "Unexpected token '<'".

## Solucao
Adicionar tratamento de erros robusto e um mecanismo de retry com delay entre uploads para evitar sobrecarregar a API.

## Alteracoes

### Arquivo: `src/pages/marketing/MidiasMinimalista.tsx`

1. **Adicionar funcao auxiliar de delay** entre uploads para evitar rate limiting:
   - `await new Promise(r => setTimeout(r, 500))` entre cada upload

2. **Adicionar retry com backoff** para cada arquivo:
   - Tentar ate 3 vezes com delay crescente (1s, 2s, 4s)
   - Capturar erros de rede/502 e tentar novamente

3. **Tratar respostas HTML (502/503)** no catch:
   - Envolver o upload em try/catch para capturar o erro de parse JSON
   - Exibir mensagem amigavel ao usuario quando ocorrer timeout

### Detalhes tecnicos

A funcao `handleUploadFiles` sera refatorada para:

```text
para cada arquivo:
  tentativas = 0
  enquanto tentativas < 3:
    try:
      upload do arquivo
      se sucesso: break
      se erro do supabase: registrar erro, break
    catch (erro de rede/parse):
      tentativas++
      aguardar (tentativas * 1500)ms
  aguardar 300ms antes do proximo arquivo
```

Isso resolve tanto o problema de rate limiting quanto o crash causado pela resposta HTML inesperada.
