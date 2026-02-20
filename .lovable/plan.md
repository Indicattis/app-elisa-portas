

# Modo de edicao nas Medidas das Portas

## Resumo

Adicionar um controle de edicao na secao "Medidas das Portas" para que os inputs fiquem bloqueados por padrao. O usuario clica em um botao para desbloquear, edita, salva, e os inputs voltam a ficar bloqueados.

## Comportamento

```text
ESTADO INICIAL (medidas preenchidas):
  - Inputs desabilitados (read-only)
  - Botao "Editar medidas" visivel

ESTADO INICIAL (medidas vazias):
  - Inputs desabilitados (read-only)
  - Botao "Informar medidas corretas" visivel

AO CLICAR NO BOTAO:
  - Inputs ficam habilitados para edicao
  - Botao muda para "Salvar Medidas" + "Cancelar"

AO SALVAR:
  - Salva no banco
  - Inputs voltam a ficar desabilitados
  - Botao volta para "Editar medidas"

AO CANCELAR:
  - Reverte valores para os originais
  - Inputs voltam a ficar desabilitados
```

## Alteracoes

### `src/components/pedidos/MedidasPortasSection.tsx`

1. **Adicionar state** `editandoPorta` (tipo `string | null`) para rastrear qual porta esta em modo de edicao (pela `_virtualKey`)
2. **Desabilitar inputs** quando `editandoPorta !== porta._virtualKey` -- adicionar `disabled` e estilo visual de read-only
3. **Substituir o botao "Salvar Medidas"** por logica condicional:
   - Se `editandoPorta !== virtualKey` e medidas preenchidas: mostrar botao "Editar medidas" (variante outline)
   - Se `editandoPorta !== virtualKey` e medidas vazias: mostrar botao "Informar medidas corretas" (variante default, destaque)
   - Se `editandoPorta === virtualKey`: mostrar botao "Salvar Medidas" + botao "Cancelar"
4. **Ao clicar "Editar medidas" / "Informar medidas corretas"**: setar `editandoPorta = virtualKey`
5. **Ao salvar com sucesso**: setar `editandoPorta = null`
6. **Ao cancelar**: reverter `medidas[virtualKey]` para os valores originais (largura/altura do produto) e setar `editandoPorta = null`
7. **Inputs desabilitados** recebem classes visuais distintas (opacity reduzida, cursor not-allowed)

