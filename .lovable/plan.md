
# Plano: Exibir Todas as Conferencias em Formato de Lista

## Resumo

Alterar as paginas de auditoria (Fabrica e Almoxarifado) para exibir todas as conferencias (concluidas, em andamento e pausadas) em formato de tabela com as colunas: Data, Responsavel (com foto), Status, Tempo de Conferencia e Acoes.

## Alteracoes

### 1. AuditoriaFabrica.tsx

**Mudancas na query:**
```typescript
// Antes: apenas concluidas
.eq("status", "concluida")

// Depois: todas as conferencias
// Remover filtro de status
.order("iniciada_em", { ascending: false })
```

**Buscar foto do responsavel:**
```typescript
.from("admin_users")
.select("nome, email, foto_perfil_url")
```

**Nova estrutura de tabela:**

| Data | Responsavel | Status | Tempo | Acoes |
|------|-------------|--------|-------|-------|
| 31/01/2026 14:30 | [Foto] Joao | Concluida | 2h 15m | [Ver detalhes] |
| 30/01/2026 10:00 | [Foto] Maria | Em andamento | 45m | [Ver detalhes] |
| 29/01/2026 09:15 | [Foto] Pedro | Pausada | 1h 30m | [Ver detalhes] |

**Badges de status:**
- `concluida` -> Verde (Concluida)
- `em_andamento` -> Azul (Em andamento)
- `pausada` -> Amarelo (Pausada)

### 2. AuditoriaAlmoxarifado.tsx

Mesmas alteracoes do AuditoriaFabrica.tsx, mantendo o filtro de setor = 'almoxarifado'.

### 3. Estrutura da Tabela

```typescript
<Table>
  <TableHeader>
    <TableRow>
      <TableHead>Data</TableHead>
      <TableHead>Responsavel</TableHead>
      <TableHead>Status</TableHead>
      <TableHead>Tempo</TableHead>
      <TableHead>Acoes</TableHead>
    </TableRow>
  </TableHeader>
  <TableBody>
    {conferencias.map((conf) => (
      <TableRow key={conf.id}>
        <TableCell>
          {format(new Date(conf.iniciada_em), "dd/MM/yyyy HH:mm")}
        </TableCell>
        <TableCell>
          <div className="flex items-center gap-2">
            <Avatar className="h-8 w-8">
              <AvatarImage src={usuario.foto_perfil_url} />
              <AvatarFallback>{iniciais}</AvatarFallback>
            </Avatar>
            <span>{usuario.nome}</span>
          </div>
        </TableCell>
        <TableCell>
          <Badge variant={...}>{statusLabel}</Badge>
        </TableCell>
        <TableCell>{formatTempo(conf.tempo_total_segundos)}</TableCell>
        <TableCell>
          <Button variant="ghost" onClick={toggleDetalhes}>
            {isOpen ? <ChevronUp /> : <ChevronDown />}
          </Button>
        </TableCell>
      </TableRow>
    ))}
  </TableBody>
</Table>
```

### 4. Mapeamento de Status

```typescript
const statusConfig = {
  concluida: { label: "Concluida", className: "bg-emerald-500/20 text-emerald-400" },
  em_andamento: { label: "Em andamento", className: "bg-blue-500/20 text-blue-400" },
  pausada: { label: "Pausada", className: "bg-amber-500/20 text-amber-400" }
};
```

### 5. Busca de Usuarios em Lote

Para evitar N+1 queries, buscar todos os usuarios de uma vez:

```typescript
// Buscar conferencias
const { data: conferencias } = await supabase
  .from("estoque_conferencias")
  .select("*")
  .or("setor.eq.fabrica,setor.is.null")
  .order("iniciada_em", { ascending: false });

// Extrair IDs unicos de responsaveis
const userIds = [...new Set(conferencias.map(c => c.conferido_por))];

// Buscar todos os usuarios de uma vez
const { data: usuarios } = await supabase
  .from("admin_users")
  .select("user_id, nome, email, foto_perfil_url")
  .in("user_id", userIds);

// Criar mapa para lookup rapido
const usuariosMap = Object.fromEntries(
  usuarios.map(u => [u.user_id, u])
);
```

## Arquivos a Modificar

| Arquivo | Alteracao |
|---------|-----------|
| `src/pages/direcao/estoque/AuditoriaFabrica.tsx` | Reescrever para formato de tabela com todas conferencias |
| `src/pages/direcao/estoque/AuditoriaAlmoxarifado.tsx` | Mesma alteracao para almoxarifado |

## Componentes Necessarios

- Avatar e AvatarImage de `@/components/ui/avatar`
- Table components ja importados
- Badge ja importado

## Resultado Esperado

1. Tabela listando todas as conferencias (nao apenas concluidas)
2. Coluna de data mostra quando foi iniciada
3. Coluna de responsavel mostra foto de perfil + nome
4. Coluna de status com badge colorido indicando estado atual
5. Coluna de tempo mostra duracao total
6. Coluna de acoes permite expandir para ver detalhes (itens com diferenca)
7. Ao expandir uma linha, mostra os detalhes da conferencia abaixo
