
# Ajustes no Ranking de Equipes de Instalacao

## 1. Remover coloracao das equipes (azul, roxa, vermelha)

Remover os seguintes elementos visuais baseados em `equipe.equipe_cor`:
- Borda esquerda colorida do card (linha 147)
- Bolinha colorida ao lado do nome da equipe (linhas 161-166)
- Badge de quantidade com cor da equipe (linhas 204-211) -- trocar para cor neutra

## 2. Classificacao P/G/GG no modal de instalacoes

Adicionar classificacao de tamanho baseada na metragem quadrada:
- P: menos de 25m2
- G: 25 a 50m2
- GG: mais de 50m2

Exibir como badge ao lado de cada instalacao no dialog. Somente para instalacoes de pedido que tenham metragem.

## 3. Melhorar o modal com informacoes adicionais

- Manter a separacao visual entre instalacoes de pedido e neo (badges "Pedido" e "Avulso")
- Exibir o tamanho P/G/GG como badge quando a metragem estiver disponivel
- Manter nome do cliente, data e metragem como ja esta

## Detalhes tecnicos

### Arquivo: `src/pages/logistica/RankingEquipesInstalacao.tsx`

1. **Remover cores da equipe**:
   - Remover `style={{ borderLeft: ... }}` do Card (linha 147)
   - Remover o bloco da bolinha colorida (linhas 161-166)
   - Trocar o badge de quantidade para usar cor fixa (branco/cinza) em vez de `equipe.equipe_cor` (linhas 204-211)

2. **Adicionar funcao de classificacao de tamanho**:
   ```
   function classificarPorta(metragem: number | null | undefined): string | null {
     if (!metragem || metragem <= 0) return null;
     if (metragem < 25) return 'P';
     if (metragem <= 50) return 'G';
     return 'GG';
   }
   ```

3. **Atualizar dialog de instalacoes**:
   - Adicionar badge de tamanho (P/G/GG) para cada instalacao que tenha metragem
   - Manter badges de origem (Pedido/Avulso) como ja estao

### Arquivos

1. **Editar**: `src/pages/logistica/RankingEquipesInstalacao.tsx`
