
# Plano: Ajustes no Hub de Conferência

## Alterações Solicitadas

1. **Remover botão "Ver Histórico de Conferências"** (linhas 86-94)
2. **Aumentar altura do botão "Iniciar Nova Conferência" no mobile**
3. **Bloquear nova conferência se já existir uma em andamento**

## Implementação

### Arquivo: `src/pages/estoque/ConferenciaHub.tsx`

**1. Remover o botão de histórico:**
```tsx
// Remover completamente as linhas 86-94
<Button
  variant="outline"
  size="lg"
  onClick={() => navigate("/estoque/auditoria")}
  className="flex-1 sm:flex-none"
>
  <CheckCircle2 className="h-5 w-5 mr-2" />
  Ver Histórico de Conferências
</Button>
```

**2. Ajustar botão de iniciar com altura maior no mobile e bloquear se houver conferência:**
```tsx
const temConferenciaEmAndamento = conferenciasEmAndamento.length > 0;

<Button
  size="lg"
  onClick={handleIniciarNova}
  disabled={iniciando || temConferenciaEmAndamento}
  className="w-full sm:w-auto h-14 sm:h-10"
>
  <Plus className="h-5 w-5 mr-2" />
  {iniciando 
    ? "Iniciando..." 
    : temConferenciaEmAndamento 
      ? "Conferência em andamento" 
      : "Iniciar Nova Conferência"
  }
</Button>
```

## Resultado

| Alteração | Detalhe |
|-----------|---------|
| Botão de histórico | Removido |
| Altura do botão (mobile) | `h-14` (56px) |
| Altura do botão (desktop) | `h-10` (40px) |
| Novo bloqueio | Desabilitado quando `conferenciasEmAndamento.length > 0` |
| Texto quando bloqueado | "Conferência em andamento" |

Também será possível remover o import do ícone `CheckCircle2` que não será mais usado.
