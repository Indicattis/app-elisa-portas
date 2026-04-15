export function VendasHeaderRow({ mode = 'pedido' }: { mode?: 'pedido' | 'faturamento' }) {
  return (
    <div
      className="grid items-center gap-1.5 px-2 h-7 text-[9px] font-medium text-muted-foreground/70 uppercase tracking-wider"
      style={{
        gridTemplateColumns: mode === 'faturamento'
          ? '24px 1fr 100px 60px 50px 50px 60px 65px 80px 35px 35px 55px 70px 70px 60px 70px 30px 30px'
          : '20px 24px 1fr 100px 60px 50px 50px 60px 65px 80px 35px 35px 55px 70px 70px 60px 30px 30px 30px 20px'
      }}
    >
      {mode === 'pedido' && <div />}
      <div />
      <div>Cliente</div>
      <div className="text-center">Cidade</div>
      <div className="text-center">Data</div>
      <div className="text-center">Dias</div>
      <div className="text-center">Tipo</div>
      <div className="text-center">Portas</div>
      <div className="text-center">Cores</div>
      <div className="text-center">Pgto</div>
      <div className="text-center">Parc.</div>
      <div className="text-center">Ent.</div>
      <div className="text-center">Desc.</div>
      <div className="text-center">Valor</div>
      <div className="text-center">Total</div>
      <div className="text-center">Lucro</div>
      {mode === 'faturamento' ? (
        <>
          <div className="text-center">Fat.</div>
          <div />
          <div />
        </>
      ) : (
        <>
          <div />
          <div />
          <div />
          <div />
        </>
      )}
    </div>
  );
}
