
export function handleWhatsAppClick(telefone: string, nome: string) {
  const message = `Olá ${nome}, entramos em contato sobre seu interesse em portas. Como podemos ajudá-lo?`;
  const whatsappUrl = `https://wa.me/55${telefone.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`;
  window.open(whatsappUrl, '_blank');
}
