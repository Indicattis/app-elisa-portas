
# Plano: Corrigir Estilos e Navegacao

## Resumo das Alteracoes

| Local | O que mudar |
|-------|-------------|
| /estoque | Auditoria vira item do hub (igual Fabrica), remover botoes especiais |
| /estoque/auditoria | Usar MinimalistLayout (tema escuro minimalista) |
| /producao/home | Card de conferencia em secao separada, navegacao contextual |

---

## 1. EstoqueHub.tsx - Auditoria como Item do Hub

Adicionar "Auditoria" no array `menuItems` com estilo identico aos demais:

```typescript
const menuItems = [
  { label: "Fabrica", icon: Factory, path: "/estoque/fabrica", ativo: true },
  { label: "Almoxarifado", icon: Package, path: "/estoque/almoxarifado", ativo: true },
  { label: "Fornecedores", icon: Truck, path: "/estoque/fornecedores", ativo: true },
  { label: "Auditoria", icon: FileSearch, path: "/estoque/auditoria", ativo: true },
];
```

Remover completamente:
- Botao verde de "Conferencia de Estoque" (mobile e desktop)
- Botao amber de "Auditoria de Estoque" (mobile e desktop)

---

## 2. AuditoriaEstoque.tsx - Estilo Minimalista

Refatorar para usar `MinimalistLayout` igual a EstoqueFabrica.tsx:

```typescript
import { MinimalistLayout } from "@/components/MinimalistLayout";

export default function AuditoriaEstoque() {
  const breadcrumbItems = [
    { label: 'Home', path: '/home' },
    { label: 'Estoque', path: '/estoque' },
    { label: 'Auditoria' }
  ];

  return (
    <MinimalistLayout
      title="Auditoria de Estoque"
      subtitle="Historico completo de conferencias realizadas"
      backPath="/estoque"
      breadcrumbItems={breadcrumbItems}
    >
      {/* Conteudo existente adaptado para tema escuro */}
    </MinimalistLayout>
  );
}
```

Adaptar cards e tabelas para tema escuro (bg-white/5, text-white, border-white/10).

---

## 3. ProducaoHome.tsx - Card de Conferencia em Secao Separada

Remover o Button do header e criar secao dedicada abaixo dos paineis:

```tsx
{/* Secao Conferencia de Estoque */}
<div className="space-y-3">
  <h2 className="text-xl font-semibold">Conferencia</h2>
  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
    <Card 
      className="cursor-pointer hover:shadow-md transition-shadow hover:border-primary/50 group" 
      onClick={() => navigate('/producao/conferencia-estoque')}
    >
      <div className="flex items-center justify-between p-4">
        <div className="flex items-center gap-3 flex-1">
          <div className="p-2 rounded-md bg-primary/10 group-hover:bg-primary/20 transition-colors">
            <ClipboardCheck className="h-5 w-5 text-primary" />
          </div>
          <span className="font-medium text-sm">Conferencia de Estoque</span>
        </div>
      </div>
    </Card>
  </div>
</div>
```

---

## 4. Nova Rota: /producao/conferencia-estoque

Criar wrapper que usa o mesmo componente de conferencia mas com navegacao para /producao/home:

**Arquivo:** `src/pages/producao/ConferenciaEstoqueProducao.tsx`

```tsx
import ConferenciaEstoque from "@/pages/estoque/ConferenciaEstoque";

export default function ConferenciaEstoqueProducao() {
  // Renderiza o componente existente mas passa props de navegacao
  return <ConferenciaEstoque returnPath="/producao/home" />;
}
```

Ou, se o componente original nao aceitar props, criar versao que sobrescreve o backPath.

**Adicionar rota em App.tsx:**
```tsx
<Route path="/producao/conferencia-estoque" element={<ConferenciaEstoqueProducao />} />
```

---

## Arquivos a Modificar/Criar

| Arquivo | Acao |
|---------|------|
| src/pages/estoque/EstoqueHub.tsx | Modificar - adicionar Auditoria no menu, remover botoes especiais |
| src/pages/estoque/AuditoriaEstoque.tsx | Modificar - usar MinimalistLayout |
| src/pages/ProducaoHome.tsx | Modificar - card em secao separada |
| src/pages/estoque/ConferenciaEstoque.tsx | Modificar - aceitar prop returnPath |
| src/pages/producao/ConferenciaEstoqueProducao.tsx | Criar - wrapper com returnPath |
| src/App.tsx | Modificar - adicionar rota /producao/conferencia-estoque |

---

## Resultado Final

- **/estoque**: 4 botoes iguais (Fabrica, Almoxarifado, Fornecedores, Auditoria) - sem botoes especiais
- **/estoque/auditoria**: Tema escuro minimalista igual /estoque/fabrica
- **/producao/home**: Card de "Conferencia de Estoque" em secao propria, estilo igual aos paineis
- **/producao/conferencia-estoque**: Mesma funcionalidade, mas voltar retorna para /producao/home
