
// DEPRECATED: Use useCanaisAquisicao hook instead
export const canaisAquisicao = [
  "Google",
  "Meta (Facebook/Instagram)",
  "LinkedIn", 
  "Indicação",
  "Cliente fidelizado",
  "Autorizado",
  "Outros"
];

export const getDisplayName = (canal: string): string => {
  // Mapear canais antigos para novos
  const mapeamento: { [key: string]: string } = {
    "Facebook": "Meta (Facebook/Instagram)",
    "Instagram": "Meta (Facebook/Instagram)",
    "Meta": "Meta (Facebook/Instagram)",
    "Outros": "Autorizado"
  };
  
  return mapeamento[canal] || canal;
};
