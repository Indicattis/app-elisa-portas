import { MinimalistLayout } from '@/components/MinimalistLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Accordion, 
  AccordionContent, 
  AccordionItem, 
  AccordionTrigger 
} from '@/components/ui/accordion';
import { 
  Percent, 
  PlusCircle, 
  CreditCard, 
  FileText, 
  AlertCircle,
  CheckCircle2,
  XCircle,
  Banknote,
  Receipt,
  Clock,
  User,
  MapPin,
  Package,
  Lock
} from 'lucide-react';

export default function RegrasVendasDirecao() {
  return (
    <MinimalistLayout
      title="Regras de Vendas"
      subtitle="Manual do sistema de vendas"
      backPath="/direcao/vendas"
      breadcrumbItems={[
        { label: 'Home', path: '/home' },
        { label: 'Direção', path: '/direcao' },
        { label: 'Vendas', path: '/direcao/vendas' },
        { label: 'Regras de Vendas' }
      ]}
    >
      <div className="space-y-6">
        {/* Seção de Descontos */}
        <Card className="bg-gradient-to-br from-blue-500/10 to-blue-900/20 border-blue-500/20">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-white">
              <Percent className="h-5 w-5 text-blue-400" />
              Regras de Desconto
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3">
              <div className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/10">
                <div className="flex items-center gap-3">
                  <Banknote className="h-4 w-4 text-green-400" />
                  <span className="text-white/80 text-sm">Pagamento à vista (não cartão)</span>
                </div>
                <Badge className="bg-green-500/20 text-green-400 border-green-500/30">+5%</Badge>
              </div>
              
              <div className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/10">
                <div className="flex items-center gap-3">
                  <User className="h-4 w-4 text-blue-400" />
                  <span className="text-white/80 text-sm">Venda presencial</span>
                </div>
                <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">+3%</Badge>
              </div>
              
              <div className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/10">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                  <span className="text-white/80 text-sm">Limite sem autorização</span>
                </div>
                <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">8%</Badge>
              </div>
              
              <div className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/10">
                <div className="flex items-center gap-3">
                  <Lock className="h-4 w-4 text-amber-400" />
                  <span className="text-white/80 text-sm">Com senha do responsável</span>
                </div>
                <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30">+5%</Badge>
              </div>
              
              <div className="flex items-center justify-between p-3 rounded-lg bg-red-500/10 border border-red-500/30">
                <div className="flex items-center gap-3">
                  <AlertCircle className="h-4 w-4 text-red-400" />
                  <span className="text-white font-medium text-sm">Limite absoluto do sistema</span>
                </div>
                <Badge className="bg-red-500/20 text-red-400 border-red-500/30">13%</Badge>
              </div>
            </div>
            
            <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
              <p className="text-amber-300 text-xs flex items-start gap-2">
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                <span>Descontos acima de 13% são automaticamente bloqueados pelo sistema, mesmo com autorização.</span>
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Seção de Acréscimos */}
        <Card className="bg-gradient-to-br from-green-500/10 to-green-900/20 border-green-500/20">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-white">
              <PlusCircle className="h-5 w-5 text-green-400" />
              Regras de Acréscimo (Crédito)
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-start gap-3 p-3 rounded-lg bg-white/5 border border-white/10">
                <CheckCircle2 className="h-4 w-4 text-green-400 mt-0.5" />
                <p className="text-white/80 text-sm">
                  O acréscimo (crédito) adiciona valor ao total da venda, aumentando a margem.
                </p>
              </div>
              
              <div className="flex items-start gap-3 p-3 rounded-lg bg-red-500/10 border border-red-500/30">
                <XCircle className="h-4 w-4 text-red-400 mt-0.5" />
                <p className="text-white/80 text-sm">
                  <strong className="text-red-400">Não pode</strong> ser aplicado se houver qualquer desconto na venda.
                </p>
              </div>
              
              <div className="flex items-start gap-3 p-3 rounded-lg bg-white/5 border border-white/10">
                <Receipt className="h-4 w-4 text-blue-400 mt-0.5" />
                <p className="text-white/80 text-sm">
                  Usado para adicionar margem extra ou cobrar por serviços adicionais.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Seção de Formas de Pagamento */}
        <Card className="bg-gradient-to-br from-purple-500/10 to-purple-900/20 border-purple-500/20">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-white">
              <CreditCard className="h-5 w-5 text-purple-400" />
              Formas de Pagamento
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Accordion type="single" collapsible className="space-y-2">
              <AccordionItem value="boleto" className="border-white/10">
                <AccordionTrigger className="text-white hover:no-underline py-3">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-blue-400" />
                    <span>Boleto</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="text-white/70 pb-4">
                  <div className="space-y-2 pl-6">
                    <p className="text-sm">Permite parcelamento com intervalos customizáveis entre parcelas:</p>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {[7, 15, 21, 28, 30, 45, 60].map(dias => (
                        <Badge key={dias} variant="outline" className="text-white/60 border-white/20">
                          {dias} dias
                        </Badge>
                      ))}
                    </div>
                  </div>
                </AccordionContent>
              </AccordionItem>
              
              <AccordionItem value="avista" className="border-white/10">
                <AccordionTrigger className="text-white hover:no-underline py-3">
                  <div className="flex items-center gap-2">
                    <Banknote className="h-4 w-4 text-green-400" />
                    <span>À Vista</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="text-white/70 pb-4">
                  <div className="space-y-2 pl-6">
                    <p className="text-sm flex items-center gap-2">
                      <AlertCircle className="h-4 w-4 text-amber-400" />
                      <span>Requer upload de comprovante de pagamento</span>
                    </p>
                    <p className="text-sm">Habilita desconto de até 5% por pagamento à vista.</p>
                  </div>
                </AccordionContent>
              </AccordionItem>
              
              <AccordionItem value="cartao" className="border-white/10">
                <AccordionTrigger className="text-white hover:no-underline py-3">
                  <div className="flex items-center gap-2">
                    <CreditCard className="h-4 w-4 text-purple-400" />
                    <span>Cartão de Crédito</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="text-white/70 pb-4">
                  <div className="space-y-2 pl-6">
                    <p className="text-sm">Permite parcelamento de 1 a 12 vezes.</p>
                    <p className="text-sm text-amber-400 flex items-center gap-2">
                      <AlertCircle className="h-4 w-4" />
                      <span>Não habilita desconto por pagamento à vista.</span>
                    </p>
                  </div>
                </AccordionContent>
              </AccordionItem>
              
              <AccordionItem value="dinheiro" className="border-white/10">
                <AccordionTrigger className="text-white hover:no-underline py-3">
                  <div className="flex items-center gap-2">
                    <Banknote className="h-4 w-4 text-emerald-400" />
                    <span>Dinheiro</span>
                  </div>
                </AccordionTrigger>
                <AccordionContent className="text-white/70 pb-4">
                  <div className="pl-6">
                    <p className="text-sm">Sem parâmetros adicionais necessários.</p>
                    <p className="text-sm">Habilita desconto de até 5% por pagamento à vista.</p>
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </CardContent>
        </Card>

        {/* Seção de Campos Obrigatórios */}
        <Card className="bg-gradient-to-br from-amber-500/10 to-amber-900/20 border-amber-500/20">
          <CardHeader className="pb-2">
            <CardTitle className="flex items-center gap-2 text-white">
              <FileText className="h-5 w-5 text-amber-400" />
              Campos Obrigatórios
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              {/* Dados do Cliente */}
              <div className="space-y-3">
                <h4 className="text-sm font-medium text-white flex items-center gap-2">
                  <User className="h-4 w-4 text-blue-400" />
                  Dados do Cliente
                </h4>
                <div className="space-y-2 pl-6">
                  <div className="flex items-center gap-2 text-white/70 text-sm">
                    <CheckCircle2 className="h-3 w-3 text-green-400" />
                    <span>Nome do cliente</span>
                  </div>
                  <div className="flex items-center gap-2 text-white/70 text-sm">
                    <CheckCircle2 className="h-3 w-3 text-green-400" />
                    <span>Telefone</span>
                  </div>
                </div>
              </div>
              
              {/* Localização */}
              <div className="space-y-3">
                <h4 className="text-sm font-medium text-white flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-red-400" />
                  Localização
                </h4>
                <div className="space-y-2 pl-6">
                  <div className="flex items-center gap-2 text-white/70 text-sm">
                    <CheckCircle2 className="h-3 w-3 text-green-400" />
                    <span>Estado</span>
                  </div>
                  <div className="flex items-center gap-2 text-white/70 text-sm">
                    <CheckCircle2 className="h-3 w-3 text-green-400" />
                    <span>Cidade</span>
                  </div>
                  <div className="flex items-center gap-2 text-white/70 text-sm">
                    <CheckCircle2 className="h-3 w-3 text-green-400" />
                    <span>CEP</span>
                  </div>
                  <div className="flex items-center gap-2 text-white/70 text-sm">
                    <CheckCircle2 className="h-3 w-3 text-green-400" />
                    <span>Bairro (mínimo 2 caracteres)</span>
                  </div>
                  <div className="flex items-center gap-2 text-white/70 text-sm">
                    <CheckCircle2 className="h-3 w-3 text-green-400" />
                    <span>Endereço (mínimo 2 caracteres)</span>
                  </div>
                </div>
              </div>
              
              {/* Produtos */}
              <div className="space-y-3">
                <h4 className="text-sm font-medium text-white flex items-center gap-2">
                  <Package className="h-4 w-4 text-purple-400" />
                  Produtos
                </h4>
                <div className="space-y-2 pl-6">
                  <div className="flex items-center gap-2 text-white/70 text-sm">
                    <CheckCircle2 className="h-3 w-3 text-green-400" />
                    <span>Mínimo 1 produto na venda</span>
                  </div>
                </div>
              </div>
              
              {/* Documentos */}
              <div className="space-y-3">
                <h4 className="text-sm font-medium text-white flex items-center gap-2">
                  <FileText className="h-4 w-4 text-amber-400" />
                  Documentos (Opcional)
                </h4>
                <div className="space-y-2 pl-6">
                  <div className="flex items-center gap-2 text-white/70 text-sm">
                    <Clock className="h-3 w-3 text-amber-400" />
                    <span>CPF: 11 dígitos (se informado)</span>
                  </div>
                  <div className="flex items-center gap-2 text-white/70 text-sm">
                    <Clock className="h-3 w-3 text-amber-400" />
                    <span>CNPJ: 14 dígitos (se informado)</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </MinimalistLayout>
  );
}
