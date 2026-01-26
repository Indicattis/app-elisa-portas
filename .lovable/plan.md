
## Plano: Unificar Etapas Expedicao Instalacoes e Instalacoes

### Visao Geral do Problema Atual

O sistema possui **duas etapas separadas** para pedidos com tipo_entrega = instalacao:
1. **aguardando_instalacao** (label: "Expedicao Instalacao") - Onde o carregamento e enviado
2. **instalacoes** (label: "Instalacoes") - Onde a instalacao e executada

E **duas tabelas** gerenciando dados similares:
- **ordens_carregamento**: Armazena informacoes de carregamento (data_carregamento, responsavel, etc)
- **instalacoes**: Armazena informacoes de instalacao (data_instalacao, equipe, etc)

### Objetivo da Unificacao

Consolidar em **uma unica etapa "Instalacoes"** onde:
1. Ordens de carregamento com `tipo_entrega = 'instalacao'` sao tratadas como **ordens de instalacao**
2. Continuam aparecendo em `/producao/carregamento` para coleta
3. So podem ser capturadas/concluidas se tiverem `data_carregamento` marcada em `/logistica/expedicao`
4. Ao concluir o carregamento, o pedido vai direto para `finalizado`

---

### Parte 1: Alteracoes no Banco de Dados

#### 1.1 Remover Etapa aguardando_instalacao

Criar migracao para atualizar pedidos existentes:

```sql
-- Migrar pedidos em aguardando_instalacao para instalacoes (etapa unificada)
-- Nota: Estes pedidos continuarao usando ordens_carregamento para o fluxo de carregamento

-- Atualizar pedidos que estao em aguardando_instalacao para usar a etapa 'instalacoes'
-- mas manter o fluxo de carregamento atraves de ordens_carregamento
-- (Esta migracao pode ser opcional se decidirmos manter compatibilidade retroativa)
```

#### 1.2 Atualizar Funcao RPC concluir_carregamento_e_avancar_pedido

A funcao ja aceita `aguardando_instalacao`, precisamos:
- Manter suporte para `instalacoes` como etapa valida
- Garantir que avance para `finalizado`

---

### Parte 2: Alteracoes nos Tipos TypeScript

#### 2.1 Modificar src/types/pedidoEtapa.ts

**Remover** `aguardando_instalacao` do tipo `EtapaPedido`:

```typescript
export type EtapaPedido = 
  | 'aberto'
  | 'em_producao'
  | 'inspecao_qualidade'
  | 'aguardando_pintura'
  | 'aguardando_coleta'
  // | 'aguardando_instalacao' -- REMOVIDO
  | 'instalacoes'  // Agora e a etapa unica para instalacoes
  | 'correcoes'
  | 'finalizado';
```

**Atualizar** ETAPAS_CONFIG - mesclar configuracoes:

```typescript
instalacoes: {
  label: 'Instalacoes',  // Nome unificado
  color: 'bg-teal-500',
  icon: 'HardHat',
  checkboxes: [
    // Checkboxes do antigo aguardando_instalacao
    { id: 'equipe_escalada', label: 'Equipe escalada', required: false },
    { id: 'cliente_contatado', label: 'Cliente contatado', required: false }
  ]
},
```

**Atualizar** ORDEM_ETAPAS removendo `aguardando_instalacao`

---

### Parte 3: Alteracoes no Fluxograma

#### 3.1 Modificar src/utils/pedidoFluxograma.ts

**Remover** entrada aguardando_instalacao do FLUXOGRAMA_ETAPAS

**Atualizar** funcao determinarFluxograma:

```typescript
// Antes:
if (tipoEntrega === 'instalacao') {
  baseFlow.push(FLUXOGRAMA_ETAPAS.aguardando_instalacao);
  baseFlow.push(FLUXOGRAMA_ETAPAS.instalacoes);
}

// Depois:
if (tipoEntrega === 'instalacao') {
  baseFlow.push(FLUXOGRAMA_ETAPAS.instalacoes); // Apenas uma etapa
}
```

---

### Parte 4: Alteracoes no Hook usePedidosEtapas.ts

#### 4.1 Atualizar Contador de Etapas (usePedidosContadores)

Remover contagem de `aguardando_instalacao` do objeto counts

#### 4.2 Atualizar Logica de Avanco de Etapa

Quando pedido chega em `instalacoes`:
- Criar ordem de carregamento (como ja faz para aguardando_coleta)
- Atualizar status da instalacao existente para 'pronta_fabrica'

```typescript
// Ao avancar para 'instalacoes' (antes era aguardando_instalacao)
if (etapaDestino === 'instalacoes') {
  // Verificar/criar ordem de carregamento
  const { data: ordemExistente } = await supabase
    .from('ordens_carregamento')
    .select('id')
    .eq('pedido_id', pedidoId)
    .maybeSingle();

  if (!ordemExistente) {
    // Criar ordem de carregamento para instalacao
    await supabase.from('ordens_carregamento').insert({
      pedido_id: pedidoId,
      venda_id: pedidoData.venda_id,
      nome_cliente: venda.cliente_nome,
      hora: '08:00',
      status: 'pronta_fabrica',
      tipo_carregamento: 'elisa',
      created_by: user.id,
      data_carregamento: null // Sera agendada em /logistica/expedicao
    });
  }

  // Atualizar instalacao existente
  await supabase
    .from('instalacoes')
    .update({ status: 'pronta_fabrica' })
    .eq('pedido_id', pedidoId);
}
```

---

### Parte 5: Atualizar Funcao RPC do Banco

#### 5.1 Modificar concluir_carregamento_e_avancar_pedido

```sql
-- Aceitar 'instalacoes' como etapa valida (alem de aguardando_coleta)
IF v_etapa_atual NOT IN ('aguardando_coleta', 'instalacoes') THEN
  RAISE EXCEPTION 'Pedido deve estar em "Expedicao Coleta" ou "Instalacoes" para concluir carregamento. Etapa atual: %', v_etapa_atual;
END IF;
```

---

### Parte 6: Atualizar Componentes de UI

#### 6.1 CarregamentoKanban.tsx e CarregamentoMinimalista.tsx

**Nenhuma alteracao necessaria** - ja filtram por `venda.tipo_entrega` e exibem ambos tipos

#### 6.2 Atualizar Legenda do Calendario (CalendarioLegendas.tsx)

```typescript
// Atualizar texto
<span>Instalacao Elisa</span>  // antes era "Instalação Elisa"
// Ja esta correto, manter como esta
```

#### 6.3 Validacao em CarregamentoKanban

A funcao `podeIniciarColeta` ja valida:
- `data_carregamento` deve estar preenchida
- `responsavel_carregamento_nome` deve estar preenchido

Isso atende o requisito de que so pode ser coletada se tiver data marcada em `/logistica/expedicao`

---

### Parte 7: Migrar Dados Existentes

#### 7.1 Script de Migracao para Pedidos em aguardando_instalacao

```sql
-- Atualizar pedidos que estao na etapa antiga
UPDATE pedidos_producao 
SET etapa_atual = 'instalacoes'
WHERE etapa_atual = 'aguardando_instalacao';

-- Atualizar registros na tabela pedidos_etapas
UPDATE pedidos_etapas
SET etapa = 'instalacoes'
WHERE etapa = 'aguardando_instalacao';

-- Garantir que ordens de carregamento existentes para instalacoes tenham status correto
UPDATE ordens_carregamento oc
SET status = CASE 
  WHEN data_carregamento IS NOT NULL THEN 'agendada'
  ELSE 'pronta_fabrica'
END
FROM vendas v
WHERE oc.venda_id = v.id 
AND v.tipo_entrega = 'instalacao'
AND oc.carregamento_concluido = false;
```

---

### Resumo dos Arquivos a Modificar

| Arquivo | Tipo | Descricao |
|---------|------|-----------|
| `src/types/pedidoEtapa.ts` | Modificar | Remover aguardando_instalacao, mesclar checkboxes |
| `src/utils/pedidoFluxograma.ts` | Modificar | Remover aguardando_instalacao do fluxo |
| `src/hooks/usePedidosEtapas.ts` | Modificar | Atualizar logica de avanco para instalacoes |
| `src/hooks/usePedidosContadores.ts` | Modificar | Remover contador de aguardando_instalacao |
| Migracao SQL | Criar | Migrar dados e atualizar funcao RPC |

---

### Fluxo Unificado Resultante

```text
Pedido com tipo_entrega = 'instalacao':

[Aberto] -> [Em Producao] -> [Inspecao Qualidade] -> [Aguardando Pintura*] -> [Instalacoes] -> [Finalizado]

                                                                                    |
                                                                                    v
                                                                        Cria ordem_carregamento
                                                                                    |
                                                                                    v
                                                         Aparece em /logistica/expedicao (sem data)
                                                                                    |
                                                                                    v
                                                              Gestor agenda data_carregamento
                                                                                    |
                                                                                    v
                                                          Aparece em /producao/carregamento
                                                              (botao "Iniciar Coleta" habilitado)
                                                                                    |
                                                                                    v
                                                              Operador conclui carregamento
                                                                                    |
                                                                                    v
                                                                            [Finalizado]

* Aguardando Pintura so aparece se pedido tem pintura
```

---

### Resultado Esperado

1. Etapa `aguardando_instalacao` e removida do sistema
2. Pedidos de instalacao vao de `inspecao_qualidade` (ou `aguardando_pintura`) direto para `instalacoes`
3. Na etapa `instalacoes`, uma ordem de carregamento e criada automaticamente
4. A ordem aparece em `/logistica/expedicao` para agendamento de data
5. Apos agendar data, aparece em `/producao/carregamento` para coleta
6. Ao concluir carregamento, pedido avanca para `finalizado`
7. Dados existentes sao migrados sem perda
