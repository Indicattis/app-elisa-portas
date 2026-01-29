

# Plano: Seletor Dinâmico de Estado/Cidade nos Modais Neo

## Problema Identificado

Nos modais de criação/edição de **Neo Instalação** e **Neo Correção** em `/logistica/expedicao`:

- O campo **Cidade** é um Input de texto livre
- O campo **Estado** vem depois da cidade no layout
- Não há integração com a lista de cidades por estado já existente no sistema

```text
ATUAL (incorreto):
┌─────────────────────────┬─────────────────────┐
│ Cidade *                │ Estado *            │
│ [ Digite a cidade ]     │ [ UF ▼ ]            │
└─────────────────────────┴─────────────────────┘
```

## Solução

Inverter a ordem dos campos e usar o utilitário `estadosCidades.ts` para popular dinamicamente as cidades com base no estado selecionado:

```text
PROPOSTA (correto):
┌─────────────────────────┬─────────────────────┐
│ Estado *                │ Cidade *            │
│ [ PR - Paraná ▼ ]       │ [ Curitiba ▼ ]      │
└─────────────────────────┴─────────────────────┘
```

---

## Alterações Técnicas

### 1. Arquivo: `src/components/expedicao/NeoInstalacaoModal.tsx`

#### Importar utilitário de cidades
```tsx
import { ESTADOS_BRASIL, getCidadesPorEstado } from "@/utils/estadosCidades";
```

#### Remover constante local ESTADOS_BRASIL
As linhas 47-51 devem ser removidas (lista duplicada).

#### Atualizar handler de mudança de estado
Quando o estado muda, limpar a cidade selecionada:
```tsx
const handleEstadoChange = (novoEstado: string) => {
  setEstado(novoEstado);
  setCidade(""); // Limpar cidade ao mudar estado
};
```

#### Alterar layout e campos (linhas 206-231)
```tsx
<div className="grid grid-cols-2 gap-4">
  <div className="space-y-2">
    <Label htmlFor="estado">Estado *</Label>
    <Select value={estado} onValueChange={handleEstadoChange}>
      <SelectTrigger>
        <SelectValue placeholder="Selecione o estado" />
      </SelectTrigger>
      <SelectContent modal={false}>
        {ESTADOS_BRASIL.map((e) => (
          <SelectItem key={e.sigla} value={e.sigla}>
            {e.sigla} - {e.nome}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  </div>
  <div className="space-y-2">
    <Label htmlFor="cidade">Cidade *</Label>
    <Select 
      value={cidade} 
      onValueChange={setCidade}
      disabled={!estado}
    >
      <SelectTrigger>
        <SelectValue placeholder={estado ? "Selecione a cidade" : "Selecione o estado primeiro"} />
      </SelectTrigger>
      <SelectContent modal={false}>
        {getCidadesPorEstado(estado).map((c) => (
          <SelectItem key={c} value={c}>
            {c}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  </div>
</div>
```

---

### 2. Arquivo: `src/components/expedicao/NeoCorrecaoModal.tsx`

Aplicar as **mesmas alterações**:

#### Importar utilitário
```tsx
import { ESTADOS_BRASIL, getCidadesPorEstado } from "@/utils/estadosCidades";
```

#### Remover constante local ESTADOS_BRASIL (linhas 47-51)

#### Adicionar handler de mudança de estado
```tsx
const handleEstadoChange = (novoEstado: string) => {
  setEstado(novoEstado);
  setCidade("");
};
```

#### Alterar layout (linhas 209-234)
Mesmo padrão do NeoInstalacaoModal:
- Estado primeiro (Select com nome completo)
- Cidade segundo (Select dinâmico, desabilitado sem estado)

---

## Comportamento

| Ação | Resultado |
|------|-----------|
| Usuário abre o modal | Campos Estado e Cidade vazios, Cidade desabilitado |
| Seleciona Estado = "PR" | Campo Cidade habilita, mostra 399 cidades do PR |
| Muda para Estado = "SC" | Cidade é limpa e recarrega com cidades de SC |
| Seleciona Cidade = "Curitiba" | Valor selecionado normalmente |
| Ao editar um Neo existente | Estado e Cidade são preenchidos corretamente |

---

## Resumo das Alterações

| Arquivo | Alteração |
|---------|-----------|
| `src/components/expedicao/NeoInstalacaoModal.tsx` | Importar utilitário, inverter ordem Estado/Cidade, substituir Input por Select dinâmico |
| `src/components/expedicao/NeoCorrecaoModal.tsx` | Mesmas alterações do NeoInstalacaoModal |

---

## Impacto

- **UX**: Consistência com outros formulários do sistema (FreteDialog, VendaNovaMinimalista)
- **Dados**: Padronização dos nomes de cidades (sem erros de digitação)
- **Manutenção**: Reutiliza o mesmo utilitário já existente
- **Compatibilidade**: Edição de Neos existentes continua funcionando

