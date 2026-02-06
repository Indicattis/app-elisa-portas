
# Plano: Redesign da Downbar de Carregamento + Conclusao por Foto

## Resumo

Duas mudancas principais:
1. **Redesign visual**: A downbar de carregamento (`CarregamentoDownbar`) sera reestilizada para seguir o mesmo design dark glassmorphism das demais downbars (PedidoDetalhesSheet), com fundo `bg-zinc-900`, header gradiente, e cards com `bg-white/5`.
2. **Novo metodo de conclusao**: Em vez de marcar checkboxes nas linhas, o operador tira uma **foto do carregamento**. As linhas aparecem de forma minimalista (somente leitura, sem checkbox), e o botao "Concluir" so e habilitado apos tirar a foto.

---

## Detalhes Tecnicos

### 1. Criar bucket de storage `fotos-carregamento`

Criar um bucket publico no Supabase para armazenar as fotos de carregamento. Sera feito via SQL.

```sql
INSERT INTO storage.buckets (id, name, public) VALUES ('fotos-carregamento', 'fotos-carregamento', true);
CREATE POLICY "Acesso publico leitura fotos-carregamento" ON storage.objects FOR SELECT USING (bucket_id = 'fotos-carregamento');
CREATE POLICY "Upload autenticado fotos-carregamento" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'fotos-carregamento');
```

### 2. Adicionar coluna `foto_carregamento_url` nas tabelas

Adicionar a coluna nas duas tabelas que recebem conclusao de carregamento:

```sql
ALTER TABLE ordens_carregamento ADD COLUMN IF NOT EXISTS foto_carregamento_url TEXT;
ALTER TABLE instalacoes ADD COLUMN IF NOT EXISTS foto_carregamento_url TEXT;
```

### 3. Redesign do `CarregamentoDownbar.tsx`

Reescrever o componente para seguir o padrao visual do `PedidoDetalhesSheet`:

**Estrutura visual:**
```text
+------------------------------------------+
| [Icone] Carregamento - Tipo         [X]  |  <- Header gradiente (bg-gradient-to-r from-blue-600/20 to-purple-600/20)
+------------------------------------------+
| bg-zinc-900                              |
|                                          |
| [Hero: Cliente + Pedido + Cores]         |  <- Card bg-gradient-to-br from-blue-500/10
|                                          |
| [Observacoes do Pedido] (se houver)      |  <- Card amber
|                                          |
| Itens do Carregamento (somente leitura)  |  <- Lista minimalista, sem checkboxes
| - Item 1: Porta de Enrolar 3x3 (2x)     |
| - Item 2: Motor (1x)                     |
|                                          |
| [Foto do Carregamento]                   |  <- Area de captura de foto
| [Camera icon / Preview da foto]          |
|                                          |
| [Cancelar]  [Concluir Carregamento]      |  <- Botao habilitado se foto tirada
+------------------------------------------+
```

**Mudancas principais no componente:**
- Fundo: `bg-zinc-900 border-t border-white/10` (igual PedidoDetalhesSheet)
- Header: gradiente com backdrop-blur
- Remover toda logica de checkboxes (`check_coleta`, `todasMarcadas`, `handleCheckboxChange`, `useEffect` de desmarcar)
- Linhas exibidas em modo somente leitura, estilo minimalista (`bg-white/5 rounded-lg border border-white/5`)
- Adicionar area de captura de foto usando `<input type="file" accept="image/*" capture="environment">`
- Preview da foto capturada com opcao de remover e tirar outra
- Botao "Concluir" habilitado apenas quando existe foto capturada
- Manter botao de imprimir etiquetas

### 4. Atualizar hook `useOrdensCarregamentoUnificadas`

Alterar `concluirCarregamentoMutation` para:
- Receber um parametro `fotoFile: File` junto com `observacoes`
- Fazer upload da foto para o bucket `fotos-carregamento` antes de concluir
- Salvar a URL da foto na coluna `foto_carregamento_url` da tabela correspondente (ordens_carregamento ou instalacoes)
- Manter a chamada RPC existente para concluir

### 5. Atualizar `CarregamentoDownbar` props

A prop `onConcluir` passara a receber `{ observacoes?: string; fotoUrl: string }` em vez de apenas `{ observacoes?: string }`.

### 6. Atualizar paginas que usam o downbar

- `src/pages/ProducaoCarregamento.tsx`: Atualizar `handleConcluirCarregamento` para passar a foto
- `src/pages/fabrica/producao/CarregamentoMinimalista.tsx`: Mesma atualizacao

### Arquivos criados/modificados

1. **SQL**: Bucket + colunas (via Supabase migration)
2. **Modificar**: `src/components/carregamento/CarregamentoDownbar.tsx` - Redesign completo
3. **Modificar**: `src/hooks/useOrdensCarregamentoUnificadas.ts` - Upload de foto na conclusao
4. **Modificar**: `src/pages/ProducaoCarregamento.tsx` - Adaptar handler
5. **Modificar**: `src/pages/fabrica/producao/CarregamentoMinimalista.tsx` - Adaptar handler
