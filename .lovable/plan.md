
# Plano: Corrigir Metragem das Ordens do Giovanni

## Problema Identificado

Giovanni Jean da Silva tem **6 ordens de perfiladeira concluídas com metragem_linear = 0** que deveriam ter valores corretos. A mais crítica é a **OPE-2026-0047** que está dentro do período da meta ativa.

## Ordens a Corrigir

| Ordem | Metragem Calculada |
|-------|-------------------|
| OPE-2026-0047 | 1.516,32m |
| OPE-2026-0050 | 323,44m |
| OPE-2026-0049 | 144,16m |
| OPE-2026-0048 | 80,32m |
| OPE-2026-0044 | 579,00m |
| OPE-2026-0040 | 126,69m |
| **Total** | **2.769,93m** |

## Solução

Executar uma query SQL para atualizar a metragem_linear de todas as ordens afetadas:

```sql
-- Atualizar metragem das ordens do Giovanni
UPDATE ordens_perfiladeira SET metragem_linear = 1516.32 WHERE id = '6ff87734-c222-466f-8ec2-1b98554aa366';
UPDATE ordens_perfiladeira SET metragem_linear = 323.44 WHERE id = '81f76a52-f16c-41a7-b5a2-e207f36d76e8';
UPDATE ordens_perfiladeira SET metragem_linear = 144.16 WHERE id = '39e37d1f-926a-4a48-9fa3-f5c2b7d2042f';
UPDATE ordens_perfiladeira SET metragem_linear = 80.32 WHERE id = 'f0c518c2-5a6d-4f20-91a6-0eb15e4c8c55';
UPDATE ordens_perfiladeira SET metragem_linear = 579.00 WHERE id = '3d959980-7c36-440d-9617-e3f081bec6f9';
UPDATE ordens_perfiladeira SET metragem_linear = 126.69 WHERE id = 'b3932605-3c88-46dd-acf8-8a9750d3e534';
```

## Impacto na Meta

Após a correção:
- Meta do Giovanni: 10.000 metros (período 02/02 a 06/02)
- Progresso atual: 0 metros
- **Novo progresso**: 1.516,32m (15,16%)

## Resultado Esperado

- Todas as 6 ordens terão metragem_linear corrigida
- A meta do Giovanni mostrará progresso de ~1.516m/10.000m
- O código já foi corrigido anteriormente, então futuras ordens calcularão automaticamente
