
# Corrigir senha resetada a cada login via CPF

## Problema
A edge function `manage-producao-auth` reseta a senha de todo usuario para `Producao@2024` em cada login. Isso sobrescreve senhas personalizadas. O reset e necessario na arquitetura atual (o cliente precisa saber a senha para autenticar), mas pode usar um padrao previsivel baseado no nome.

## Solucao
Gerar a senha automaticamente com o padrao **primeira letra do primeiro nome + sobrenome** (tudo em minusculo, sem acentos). Exemplo: "Joao Silva" gera senha `jsilva`. A edge function retorna a senha gerada para o cliente usar.

## Alteracoes

### 1. Edge Function: `supabase/functions/manage-producao-auth/index.ts`
- Adicionar funcao auxiliar para gerar senha a partir do nome (remover acentos, pegar primeira letra + ultimo sobrenome, tudo minusculo)
- Substituir a constante `'Producao@2024'` (linha 164) pela senha gerada
- Incluir o campo `password` na resposta JSON (linha 236-247) para o cliente usar

Funcao de geracao:
```text
"Joao Pedro Silva" -> "jsilva"
"Maria Aparecida Santos" -> "msantos"
```

### 2. Frontend: `src/pages/Auth.tsx`
- Linha 80: Substituir `password: 'Producao@2024'` por `password: data.password`

### 3. Frontend: `src/pages/producao/ProducaoLogin.tsx`
- Linha 72: Substituir `password: 'Producao@2024'` por `password: setupData.password`
