
# Filtrar botoes por permissao e ocultar "Voltar" na home

## Resumo
Duas alteracoes simples: (1) na pagina `/producao`, filtrar os botoes para exibir apenas aqueles cujas rotas o usuario autenticado tem acesso, e (2) no header, esconder o botao "Voltar" quando o usuario estiver na home (`/producao`).

## Alteracoes

### 1. `src/pages/ProducaoHome.tsx`
- Adicionar um `routeKey` a cada item do array `BOTOES` mapeando para a chave correspondente na tabela `app_routes`
- Importar `useProducaoAuth` para obter o `user_id`
- Importar `useQuery` e `supabase` para buscar as rotas acessiveis do usuario via `has_route_access`
- Filtrar o array `BOTOES` para exibir apenas os botoes cujo `routeKey` o usuario tem permissao
- Mapeamento de routeKeys:
  - Solda: `producao_solda`
  - Perfiladeira: `producao_perfiladeira`
  - Separacao: `producao_separacao`
  - Qualidade: `producao_qualidade`
  - Pintura: `producao_pintura`
  - Embalagem: `producao_embalagem`
  - Carregamento: `producao_carregamento`
  - Instalacoes: `producao_instalacoes`
  - Terceirizacao: `producao_terceirizacao`
  - Estoque: `producao_conferencia_estoque`
  - Almoxarifado: `producao_conferencia_almox`

### 2. `src/components/producao/ProducaoHeader.tsx`
- Usar a variavel `isProducaoHome` (ja existente) para renderizar condicionalmente o botao "Voltar"
- Quando `isProducaoHome === true`, nao exibir o botao

## Secao Tecnica

### Logica de filtragem (ProducaoHome)
Buscar todas as rotas acessiveis do usuario de uma vez so usando uma query na tabela `user_route_access` com prefixo `producao_`, em vez de chamar `has_route_access` para cada botao individualmente. Isso reduz o numero de chamadas ao banco.

```text
// Hook inline com useQuery
const { data: accessibleKeys = [] } = useQuery({
  queryKey: ['producao-home-access', user?.user_id],
  queryFn: async () => {
    // Admin tem acesso total
    const { data } = await supabase
      .from('user_route_access')
      .select('route_key')
      .eq('user_id', user.user_id)
      .eq('can_access', true)
      .like('route_key', 'producao_%');
    return data?.map(r => r.route_key) || [];
  },
  enabled: !!user?.user_id,
});

// Filtrar botoes
const botoesVisiveis = BOTOES.filter(btn => accessibleKeys.includes(btn.routeKey));
```

Para admins (verificado via `admin_users.role`), todos os botoes devem aparecer sem filtragem.

### Header condicional
```text
{!isProducaoHome && (
  <Button variant="ghost" size="sm" onClick={handleVoltar}>
    <ArrowLeft className="h-4 w-4 mr-2" />
    Voltar
  </Button>
)}
```

### Arquivos afetados
1. `src/pages/ProducaoHome.tsx` - adicionar routeKey aos botoes + filtrar por permissao
2. `src/components/producao/ProducaoHeader.tsx` - ocultar botao "Voltar" na home
