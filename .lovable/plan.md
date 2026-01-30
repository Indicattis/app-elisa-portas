

# Plano: Fluxo Completo de Conferencia de Estoque da Fabrica

## Resumo do Fluxo Solicitado

```text
1. Botao em secao separada no EstoqueHub → /estoque/conferencia
2. Pagina inicial: Iniciar nova conferencia OU Retomar conferencia em andamento
3. Conferencia em andamento: cronometro, salva progresso, pode pausar/continuar
4. So pode finalizar quando TODOS os itens tiverem quantidade informada
5. Mostra quantidade atual do sistema ao usuario
6. Ao concluir: salva responsavel, duracao, data/hora
7. Historico de conferencias em /estoque/auditoria
```

---

## 1. Alteracoes no Banco de Dados

### Atualizar tabela `estoque_conferencias`

Adicionar novos campos para suportar o fluxo de pausar/retomar:

```sql
ALTER TABLE estoque_conferencias ADD COLUMN IF NOT EXISTS status text DEFAULT 'em_andamento';
ALTER TABLE estoque_conferencias ADD COLUMN IF NOT EXISTS iniciada_em timestamptz DEFAULT now();
ALTER TABLE estoque_conferencias ADD COLUMN IF NOT EXISTS concluida_em timestamptz;
ALTER TABLE estoque_conferencias ADD COLUMN IF NOT EXISTS tempo_total_segundos integer DEFAULT 0;
ALTER TABLE estoque_conferencias ADD COLUMN IF NOT EXISTS pausada boolean DEFAULT false;
ALTER TABLE estoque_conferencias ADD COLUMN IF NOT EXISTS tempo_acumulado_segundos integer DEFAULT 0;
ALTER TABLE estoque_conferencias ADD COLUMN IF NOT EXISTS pausada_em timestamptz;
ALTER TABLE estoque_conferencias ADD COLUMN IF NOT EXISTS total_itens integer DEFAULT 0;
ALTER TABLE estoque_conferencias ADD COLUMN IF NOT EXISTS itens_conferidos integer DEFAULT 0;
```

### Permitir UPDATE na tabela (nova policy)

```sql
CREATE POLICY "Usuarios autenticados podem atualizar conferencias" 
ON estoque_conferencias FOR UPDATE TO authenticated 
USING (conferido_por = auth.uid());

CREATE POLICY "Usuarios autenticados podem atualizar itens" 
ON estoque_conferencia_itens FOR UPDATE TO authenticated 
USING (true);
```

---

## 2. Estrutura de Paginas

### 2.1 Pagina Hub: `/estoque/conferencia`

Lista conferencias em andamento e botao para iniciar nova.

**Componentes:**
- Botao "Iniciar Nova Conferencia"
- Cards de conferencias em andamento (se existirem) com:
  - Data de inicio
  - Tempo decorrido
  - Progresso (X de Y itens)
  - Botao "Retomar"

### 2.2 Pagina de Execucao: `/estoque/conferencia/:id`

Onde o usuario preenche as quantidades.

**Componentes:**
- Cronometro visivel (usa `useCronometro`)
- Tabela com todos os itens:
  - SKU, Nome, Categoria
  - Quantidade Sistema (readonly)
  - Quantidade Conferida (input)
  - Diferenca (calculado)
- Barra de progresso (X de Y itens conferidos)
- Botao "Pausar" (salva progresso e volta ao hub)
- Botao "Concluir" (habilitado apenas quando 100% conferido)

### 2.3 Pagina de Auditoria: `/estoque/auditoria`

Historico completo de conferencias.

**Componentes:**
- Tabela com conferencias concluidas:
  - Data/hora
  - Responsavel
  - Duracao
  - Total de itens
  - Itens com diferenca
- Clique para ver detalhes de cada conferencia

---

## 3. Alteracoes no EstoqueHub

Adicionar nova secao abaixo dos botoes atuais:

```tsx
{/* Secao Conferencia */}
<div className="mt-8">
  <h3>Conferencia de Estoque</h3>
  <button onClick={() => navigate('/estoque/conferencia')}>
    Conferencia de Estoque
  </button>
</div>
```

---

## 4. Hook Atualizado: `useEstoqueConferencia`

Funcionalidades:
- `iniciarConferencia()`: Cria nova conferencia com status "em_andamento"
- `buscarConferenciasEmAndamento()`: Lista conferencias do usuario nao concluidas
- `salvarProgresso(id, itens)`: Atualiza itens e tempo acumulado
- `pausarConferencia(id)`: Marca como pausada, salva tempo
- `retomarConferencia(id)`: Remove pausa, retorna dados
- `concluirConferencia(id)`: Valida 100%, atualiza estoque, finaliza

---

## 5. Arquivos a Criar

| Arquivo | Descricao |
|---------|-----------|
| `src/pages/estoque/ConferenciaHub.tsx` | Pagina inicial da conferencia |
| `src/pages/estoque/ConferenciaExecucao.tsx` | Pagina de execucao (preencher quantidades) |
| `src/pages/estoque/AuditoriaEstoque.tsx` | Historico de conferencias |
| `src/hooks/useConferenciaEstoque.ts` | Hook refatorado com novo fluxo |
| `src/components/conferencia/ConferenciaCard.tsx` | Card para conferencia em andamento |
| `src/components/conferencia/ConferenciaProgress.tsx` | Barra de progresso |

## 6. Arquivos a Modificar

| Arquivo | Alteracao |
|---------|-----------|
| `src/pages/estoque/EstoqueHub.tsx` | Adicionar secao com botao de conferencia |
| `src/App.tsx` | Adicionar rotas `/estoque/conferencia`, `/estoque/conferencia/:id`, `/estoque/auditoria` |
| `src/pages/ProducaoHome.tsx` | Remover botao de conferencia (mover para EstoqueHub) |

---

## 7. Fluxo Detalhado

```text
[EstoqueHub]
     │
     ▼
[Clica "Conferencia de Estoque"]
     │
     ▼
[ConferenciaHub] ─────────────────────────────┐
     │                                        │
     ├─► "Iniciar Nova"                       │
     │        │                               │
     │        ▼                               │
     │   Cria registro no BD                  │
     │   status = 'em_andamento'              │
     │   iniciada_em = now()                  │
     │   Carrega todos itens do estoque       │
     │        │                               │
     ▼        ▼                               │
[ConferenciaExecucao/:id]                     │
     │                                        │
     ├─► Cronometro rodando                   │
     ├─► Usuario preenche quantidades         │
     ├─► Cada alteracao salva no BD           │
     │   (estoque_conferencia_itens)          │
     │                                        │
     ├─► [Pausar]                             │
     │        │                               │
     │        ▼                               │
     │   Salva tempo_acumulado                │
     │   pausada = true                       │
     │   Volta ao ConferenciaHub ─────────────┤
     │                                        │
     └─► [Concluir] (so se 100%)              │
              │                               │
              ▼                               │
         Atualiza estoque                     │
         status = 'concluida'                 │
         concluida_em = now()                 │
         tempo_total_segundos = X             │
              │                               │
              ▼                               │
         [AuditoriaEstoque] ◄─────────────────┘
              │
              ▼
         Lista todas conferencias
         concluidas com detalhes
```

---

## 8. Detalhes Tecnicos

### Cronometro

Usar o hook `useCronometro` existente, mas sincronizar com o BD:
- Ao pausar: `tempo_acumulado += segundos_da_sessao`
- Ao retomar: Carregar `tempo_acumulado` e continuar de onde parou
- Ao concluir: `tempo_total = tempo_acumulado + segundos_da_sessao`

### Salvamento Automatico

Cada vez que o usuario altera uma quantidade:
1. Atualiza ou insere em `estoque_conferencia_itens`
2. Atualiza `itens_conferidos` em `estoque_conferencias`
3. Nao atualiza `estoque` ainda (so na conclusao)

### Validacao de Conclusao

O botao "Concluir" so fica habilitado quando:
```typescript
itensConferidos === totalItens
```

### Atualizacao do Estoque

Apenas ao concluir:
1. Para cada item com diferenca, atualizar `estoque.quantidade`
2. Registrar em `estoque_movimentacoes`

---

## Resultado Esperado

- Conferencias podem ser pausadas e retomadas
- Tempo cronometrado com precisao
- Historico completo em `/estoque/auditoria`
- So conclui se todos os itens forem conferidos
- Botao separado no EstoqueHub (abaixo dos atuais)

