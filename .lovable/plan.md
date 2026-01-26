
## Plano: Melhorias Mobile na Página de Vendas da Direção

### Visão Geral

Implementar três melhorias na página `/direcao/vendas`:
1. **Slider de Faturamento Mensal** - Transformar o grid em carousel no mobile
2. **Filtro de Vendedores Destacado** - Seção dedicada com visual aprimorado, filtrando por role "atendente"
3. **Fonte Reduzida na Tabela** - Diminuir significativamente o tamanho da fonte para mobile

---

### 1. Slider de Faturamento Mensal (Mobile)

O componente `FaturamentoMensalGrid.tsx` será modificado para:
- **Desktop**: Manter o grid atual de 3 colunas
- **Mobile**: Usar o carousel Embla (já instalado) com slides por mês

**Componente a modificar:** `src/components/vendas/FaturamentoMensalGrid.tsx`

```tsx
// Desktop: grid-cols-3 gap-2
// Mobile: Carousel com indicadores de página (dots)

import { useIsMobile } from "@/hooks/use-mobile";
import { Carousel, CarouselContent, CarouselItem } from "@/components/ui/carousel";

// Se mobile: renderiza carousel
// Se desktop: renderiza grid atual
```

**Indicadores responsivos (dots):**
- Bolinha para cada mês
- Mês atual destacado em azul sólido
- Mês selecionado com anel
- Touch/swipe para navegar

---

### 2. Filtro de Vendedores Destacado

Criar uma seção dedicada para o filtro de vendedores que:
- Busca apenas usuários com role "atendente" da tabela `user_roles`
- Exibe cards com foto e nome (visual de seleção)
- Permite selecionar um ou mais vendedores
- Design destacado com gradiente e ícones

**Alterações em:** `src/pages/direcao/VendasDirecao.tsx`

```tsx
// Antes: Busca todos de admin_users
const { data } = await supabase
  .from('admin_users')
  .select('id, nome, user_id')
  .order('nome');

// Depois: Busca apenas atendentes via join com user_roles
const { data } = await supabase
  .from('user_roles')
  .select('user_id, admin_users!inner(id, nome, foto_perfil_url)')
  .eq('role', 'atendente')
  .order('admin_users(nome)');
```

**Design da seção:**
```tsx
<div className="mb-6 p-4 rounded-xl bg-gradient-to-r from-blue-600/20 to-blue-800/10 border border-blue-500/30">
  <div className="flex items-center gap-2 mb-3">
    <Users className="h-4 w-4 text-blue-400" />
    <span className="text-sm font-medium text-blue-300">Vendedores</span>
  </div>
  <div className="flex gap-2 overflow-x-auto pb-2">
    {/* Card "Todos" */}
    {/* Cards de atendentes com Avatar */}
  </div>
</div>
```

---

### 3. Fonte Reduzida na Tabela (Mobile)

**Alterações em:** `src/pages/direcao/VendasDirecao.tsx`

Adicionar classes responsivas para diminuir fonte em telas pequenas:

```tsx
// TableHead
className={`text-[10px] md:text-xs text-white/60 ...`}

// TableCell - renderCell function
// Aplicar text-[10px] md:text-sm em todo conteúdo da célula

// Exemplo para data:
<span className="text-white/80 text-[10px] md:text-sm">
  {format(new Date(venda.data_venda), 'dd/MM', { locale: ptBR })}
</span>

// Exemplo para cliente:
<span className="text-white font-medium text-[10px] md:text-sm truncate max-w-[80px] md:max-w-none">
  {venda.cliente_nome}
</span>
```

---

### Arquivos a Modificar

| Arquivo | Alteração |
|---------|-----------|
| `src/components/vendas/FaturamentoMensalGrid.tsx` | Adicionar modo carousel para mobile com indicadores |
| `src/pages/direcao/VendasDirecao.tsx` | 1. Filtrar atendentes por role 2. Criar seção destacada para filtro 3. Reduzir fonte da tabela |

---

### Detalhes Técnicos

**1. FaturamentoMensalGrid.tsx - Carousel Mobile**

```tsx
import { useIsMobile } from "@/hooks/use-mobile";
import { Carousel, CarouselContent, CarouselItem, CarouselApi } from "@/components/ui/carousel";

export function FaturamentoMensalGrid({ onMonthClick, selectedMonth }) {
  const isMobile = useIsMobile();
  const [api, setApi] = useState<CarouselApi>();
  const [currentSlide, setCurrentSlide] = useState(0);
  
  // Iniciar no mês atual
  useEffect(() => {
    if (api) {
      api.scrollTo(currentMonth);
    }
  }, [api]);
  
  // Atualizar indicador ao mudar slide
  useEffect(() => {
    if (!api) return;
    api.on("select", () => {
      setCurrentSlide(api.selectedScrollSnap());
    });
  }, [api]);

  if (isMobile) {
    return (
      <Carousel setApi={setApi} opts={{ startIndex: currentMonth }}>
        <CarouselContent>
          {faturamento?.map((mes, index) => (
            <CarouselItem key={mes.mes}>
              <Card onClick={() => onMonthClick?.(index)}>
                {/* Conteúdo do card */}
              </Card>
            </CarouselItem>
          ))}
        </CarouselContent>
        
        {/* Indicadores (dots) */}
        <div className="flex justify-center gap-1 mt-3">
          {faturamento?.map((_, index) => (
            <button
              key={index}
              className={cn(
                "w-2 h-2 rounded-full transition-all",
                currentSlide === index
                  ? "bg-blue-500 w-4"
                  : index === currentMonth
                    ? "bg-blue-400/50"
                    : "bg-white/20"
              )}
              onClick={() => api?.scrollTo(index)}
            />
          ))}
        </div>
      </Carousel>
    );
  }
  
  // Renderiza grid normal para desktop
  return <div className="grid grid-cols-3 gap-2">...</div>;
}
```

**2. VendasDirecao.tsx - Filtro de Atendentes**

```tsx
// Interface para atendente
interface Atendente {
  user_id: string;
  nome: string;
  foto_perfil_url: string | null;
}

// Fetch com join
useEffect(() => {
  const fetchAtendentes = async () => {
    const { data } = await supabase
      .from('user_roles')
      .select(`
        user_id,
        admin_users!inner(nome, foto_perfil_url)
      `)
      .eq('role', 'atendente');
    
    if (data) {
      const mapped = data.map(d => ({
        user_id: d.user_id,
        nome: d.admin_users.nome,
        foto_perfil_url: d.admin_users.foto_perfil_url
      }));
      setAtendentes(mapped);
    }
  };
  fetchAtendentes();
}, []);

// Seção destacada (antes dos filtros atuais)
<div className="mb-6 p-4 rounded-xl bg-gradient-to-r from-blue-600/20 to-blue-800/10 border border-blue-500/30">
  <div className="flex items-center gap-2 mb-3">
    <Users className="h-4 w-4 text-blue-400" />
    <span className="text-sm font-medium text-blue-300">Filtrar por Vendedor</span>
  </div>
  <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin">
    {/* Botão "Todos" */}
    <button
      onClick={() => setSelectedAtendente("todos")}
      className={cn(
        "flex-shrink-0 flex items-center gap-2 px-3 py-2 rounded-lg transition-all",
        selectedAtendente === "todos"
          ? "bg-blue-500 text-white"
          : "bg-white/5 text-white/60 hover:bg-white/10"
      )}
    >
      <Users className="h-4 w-4" />
      <span className="text-xs font-medium">Todos</span>
    </button>
    
    {/* Cards de atendentes */}
    {atendentes.map(atendente => (
      <button
        key={atendente.user_id}
        onClick={() => setSelectedAtendente(atendente.user_id)}
        className={cn(
          "flex-shrink-0 flex items-center gap-2 px-3 py-2 rounded-lg transition-all",
          selectedAtendente === atendente.user_id
            ? "bg-blue-500 text-white ring-2 ring-blue-400"
            : "bg-white/5 text-white/60 hover:bg-white/10"
        )}
      >
        <Avatar className="h-6 w-6">
          <AvatarImage src={atendente.foto_perfil_url} />
          <AvatarFallback className="text-[10px] bg-blue-500/20">
            {atendente.nome?.substring(0, 2).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <span className="text-xs font-medium whitespace-nowrap">{atendente.nome?.split(' ')[0]}</span>
      </button>
    ))}
  </div>
</div>
```

**3. VendasDirecao.tsx - Fonte Reduzida**

A função `renderCell` será atualizada para aplicar classes responsivas:

```tsx
// TableHead - linha 641-643
className={`text-[10px] md:text-xs lg:text-sm text-white/60 ...`}

// TableCell - todas as células terão fonte menor no mobile
case 'data':
  return (
    <span className="text-white/80 text-[10px] md:text-sm">
      {format(new Date(venda.data_venda), 'dd/MM', { locale: ptBR })}
    </span>
  );

case 'cliente':
  return (
    <span className="text-white font-medium text-[10px] md:text-sm truncate block max-w-[60px] md:max-w-none">
      {venda.cliente_nome}
    </span>
  );

case 'valor':
  return (
    <span className="text-white font-medium text-[10px] md:text-sm">
      {formatCurrency((venda.valor_venda || 0) + (venda.valor_credito || 0))}
    </span>
  );
```

---

### Resultado Esperado

1. **Mobile**: Faturamento mensal exibido como slider horizontal com dots de navegação
2. **Mobile + Desktop**: Seção de vendedores destacada com cards clicáveis mostrando foto e nome
3. **Mobile**: Tabela com fonte muito menor (`text-[10px]`) para caber mais informações
4. **Desktop**: Comportamento e visual mantidos (grid 3 colunas, fonte normal)

