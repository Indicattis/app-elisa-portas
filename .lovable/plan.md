# Corrigir Acentos das Cidades em /logistica/frete/internos

## Diagnóstico

Investiguei a tabela `frete_cidades` no banco e confirmei o problema:

- **466 cidades** com caracteres corrompidos (`�` = caractere de substituição Unicode):
  - PR: 181 cidades quebradas (de 394)
  - RS: 178 quebradas (de 486)
  - SC: 107 quebradas (de 292)
- Exemplos: `Adrian�polis`, `Almirante Tamandar�`, `Foz do Igua�u`, `Gua�ra`, `S�o Paulo`...

**Causa raiz:** o CSV original foi importado com encoding errado (Latin-1/Windows-1252 lido como UTF-8). Os bytes originais foram perdidos e substituídos por `�`, então não dá para "decodificar de volta". A solução correta é **fazer match contra a lista oficial de municípios do IBGE** filtrada por estado.

A `BulkUploadFretesCidades.tsx` lê arquivos com `file.text()` (sempre UTF-8). Para evitar que o problema se repita, a função de import também precisa detectar/converter encoding do arquivo recebido.

## O que será feito

### 1. Correção em massa dos dados existentes (one-shot)

Criar uma migração SQL com uma função PL/pgSQL temporária + script auxiliar que:

1. Busca a lista oficial de municípios via API do IBGE
   (`https://servicodados.ibge.gov.br/api/v1/localidades/estados/{UF}/municipios`)
   para PR, RS e SC.
2. Para cada linha de `frete_cidades` cujo `cidade` contém `�`:
   - Monta um regex onde `�` vira `.` (qualquer 1 caractere)
   - Procura match único contra a lista IBGE daquele estado
   - Atualiza `cidade` para o nome canônico acentuado
3. Loga (em console) qualquer cidade sem match único para revisão manual.

Como o trigger via PL/pgSQL não pode fazer HTTP confiável neste contexto, vou usar a abordagem **edge function de uso único** que:
- Lê todas as cidades quebradas do banco
- Busca o IBGE
- Resolve cada nome
- Faz `UPDATE` em lote
- Retorna um relatório (corrigidas / não resolvidas / duplicatas)

A função fica disponível em `/admin` para re-execução se precisar, mas o uso é uma vez só.

### 2. Botão "Corrigir Acentos" na tela

Em `src/pages/logistica/FreteMinimalista.tsx`, adicionar um botão discreto no header (visível apenas se houver cidades com `�` no resultado atual) que chama a edge function e mostra um toast com o resumo do resultado.

### 3. Prevenir o problema no futuro

Em `src/components/frete/BulkUploadFretesCidades.tsx`:
- Detectar BOM e tentar decodificar como UTF-8 primeiro; se aparecer `�` no resultado, re-decodificar como `windows-1252` usando `TextDecoder('windows-1252')`.
- Mostrar aviso visual no log se o arquivo parecer estar em encoding errado.

## Detalhes técnicos

**Edge function:** `supabase/functions/corrigir-cidades-frete/index.ts`
- Usa `service_role` (bypassa RLS)
- Para cada UF com cidades quebradas: `fetch` no IBGE, monta `Map<normalizado, nome_correto>`
- Match: substitui `�` por `.` no nome corrompido, tenta regex contra cada nome IBGE; se exatamente 1 match, atualiza
- Trata colisões: se o nome corrigido já existir em outra linha do mesmo estado (constraint unique `estado+cidade`), faz `DELETE` da linha quebrada (mantém a já existente correta) e loga

**Botão na UI:**
```tsx
<Button onClick={handleCorrigirAcentos}>
  <Wand2 className="h-4 w-4" /> Corrigir Acentos
</Button>
```

**Detector de encoding no upload (BulkUploadFretesCidades):**
```ts
const buffer = await file.arrayBuffer();
let text = new TextDecoder('utf-8', { fatal: false }).decode(buffer);
if (text.includes('\uFFFD')) {
  text = new TextDecoder('windows-1252').decode(buffer);
}
```

## Arquivos afetados

- **Criado:** `supabase/functions/corrigir-cidades-frete/index.ts`
- **Editado:** `src/pages/logistica/FreteMinimalista.tsx` (botão + handler)
- **Editado:** `src/components/frete/BulkUploadFretesCidades.tsx` (detecção de encoding)

Após aprovar, executo a correção e mostro o relatório (quantas cidades foram resolvidas e se sobrou alguma para revisão manual).
