import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function GestaoInstalacaoDirecao() {
  const navigate = useNavigate();

  useEffect(() => {
    navigate("/direcao/gestao-instalacao/ordens-instalacoes", { replace: true });
  }, [navigate]);

  return null;
}
