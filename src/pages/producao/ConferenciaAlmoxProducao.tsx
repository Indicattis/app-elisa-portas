import ConferenciaHubAlmox from "@/pages/estoque/ConferenciaHubAlmox";

export default function ConferenciaAlmoxProducao() {
  return (
    <ConferenciaHubAlmox 
      returnPath="/producao" 
      executionBasePath="/producao/conferencia-almox"
    />
  );
}
