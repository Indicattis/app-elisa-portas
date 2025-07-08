export function getTempoAtendimento(dataInicio: string) {
  const inicio = new Date(dataInicio);
  const agora = new Date();
  const diffMs = agora.getTime() - inicio.getTime();
  
  const diffMinutos = Math.floor(diffMs / (1000 * 60));
  const diffHoras = Math.floor(diffMinutos / 60);
  const diffDias = Math.floor(diffHoras / 24);
  const diffSemanas = Math.floor(diffDias / 7);

  if (diffSemanas > 0) {
    const diasRestantes = diffDias % 7;
    return diasRestantes > 0 ? `${diffSemanas}sem ${diasRestantes}d` : `${diffSemanas}sem`;
  }
  
  if (diffDias > 0) {
    const horasRestantes = diffHoras % 24;
    return horasRestantes > 0 ? `${diffDias}d ${horasRestantes}h` : `${diffDias}d`;
  }
  
  if (diffHoras > 0) {
    const minutosRestantes = diffMinutos % 60;
    return minutosRestantes > 0 ? `${diffHoras}h ${minutosRestantes}m` : `${diffHoras}h`;
  }
  
  return `${diffMinutos}m`;
}

export function handleWhatsAppClick(telefone: string, nome: string) {
  const message = `Olá ${nome}, entramos em contato sobre seu interesse em portas. Como podemos ajudá-lo?`;
  const whatsappUrl = `https://wa.me/55${telefone.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`;
  window.open(whatsappUrl, '_blank');
}