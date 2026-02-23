
# Downbar mobile para detalhes da venda no Faturamento

## Objetivo

Quando em modo mobile (tela < 1024px), ao clicar numa venda na tabela, abrir automaticamente uma downbar (Sheet side="bottom") no estilo minimalista com todas as informacoes da venda selecionada -- os mesmos dados que aparecem na sidebar direita no desktop.

## Mudancas no arquivo `src/pages/direcao/FaturamentoDirecao.tsx`

### 1. Importar useIsMobile e Drawer

Adicionar imports do hook `useIsMobile` e dos componentes do Drawer (vaul):

```typescript
import { useIsMobile } from "@/hooks/use-mobile";
import { Drawer, DrawerContent } from "@/components/ui/drawer";
```

### 2. Usar o hook no componente

```typescript
const isMobile = useIsMobile();
```

### 3. Estado para controlar a downbar mobile

Adicionar estado `mobileDownbarOpen`:

```typescript
const [mobileDownbarOpen, setMobileDownbarOpen] = useState(false);
```

### 4. Alterar o onClick da TableRow

Quando em mobile, ao selecionar uma venda, abrir automaticamente a downbar:

```typescript
onClick={() => {
  setSelectedVenda(venda);
  if (isMobile) {
    setMobileDownbarOpen(true);
  }
}}
```

### 5. Adicionar a Downbar (Drawer bottom) no JSX

Apos o fechamento do layout de 3 paineis, adicionar um `Drawer` que usa `DrawerContent` com o conteudo da venda selecionada (`selectedVendaContent`). A downbar tera:

- Altura de ~80vh com scroll
- Header gradiente com nome do cliente e botao fechar
- Grid 2 colunas com valores (Portas, Pintura, Instalacao, Frete, Acessorios, Adicionais)
- Secao de datas (Previsao, Pgto 1, Pgto 2)
- Card de Valor a Receber (condicional)
- Botao "Abrir Faturamento"
- Estilo minimalista dark consistente com as outras downbars do sistema

```typescript
{isMobile && (
  <Drawer open={mobileDownbarOpen} onOpenChange={(open) => {
    setMobileDownbarOpen(open);
    if (!open) setSelectedVenda(null);
  }}>
    <DrawerContent className="max-h-[85vh] bg-zinc-900 border-t border-white/10">
      <ScrollArea className="h-[75vh] px-4 py-4">
        {selectedVenda && selectedVendaContent}
      </ScrollArea>
    </DrawerContent>
  </Drawer>
)}
```

### 6. Ao fechar a downbar, limpar selecao

Quando `onOpenChange` recebe `false`, setar `selectedVenda` para `null` e `mobileDownbarOpen` para `false`.

## Resultado

- **Desktop (>= 1024px)**: Comportamento inalterado -- sidebar direita mostra os detalhes
- **Mobile (< 1024px)**: Ao tocar numa venda, abre a downbar de baixo com todos os detalhes e o botao de acesso ao faturamento individual, no estilo minimalista escuro consistente com o resto do sistema
