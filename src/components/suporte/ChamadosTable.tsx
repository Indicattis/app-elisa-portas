import { useState } from "react";
import { format } from "date-fns";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FileText, Edit } from "lucide-react";
import { ChamadoSuporte } from "@/types/suporte";
import { AdicionarNotaModal } from "./AdicionarNotaModal";
import { AlterarStatusModal } from "./AlterarStatusModal";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface ChamadosTableProps {
  chamados: ChamadoSuporte[];
  onUpdateNotas: (data: { id: string; notas: string }) => void;
  onUpdateStatus: (data: {
    id: string;
    status: "pendente" | "cancelado" | "resolvido";
  }) => void;
}

export function ChamadosTable({
  chamados,
  onUpdateNotas,
  onUpdateStatus,
}: ChamadosTableProps) {
  const [notaModalOpen, setNotaModalOpen] = useState(false);
  const [statusModalOpen, setStatusModalOpen] = useState(false);
  const [notaViewOpen, setNotaViewOpen] = useState(false);
  const [selectedChamado, setSelectedChamado] = useState<ChamadoSuporte | null>(
    null
  );

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pendente":
        return (
          <Badge
            variant="secondary"
            className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100"
          >
            Pendente
          </Badge>
        );
      case "resolvido":
        return (
          <Badge
            variant="default"
            className="bg-green-100 text-green-800 hover:bg-green-100"
          >
            Resolvido
          </Badge>
        );
      case "cancelado":
        return <Badge variant="destructive">Cancelado</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const handleOpenNotaModal = (chamado: ChamadoSuporte) => {
    setSelectedChamado(chamado);
    setNotaModalOpen(true);
  };

  const handleOpenStatusModal = (chamado: ChamadoSuporte) => {
    setSelectedChamado(chamado);
    setStatusModalOpen(true);
  };

  const handleViewNota = (chamado: ChamadoSuporte) => {
    setSelectedChamado(chamado);
    setNotaViewOpen(true);
  };

  return (
    <>
      <div className="rounded-md border text-[6px]">
        <Table>
          <TableHeader>
            <TableRow className="h-10">
              <TableHead className="w-16">Foto</TableHead>
              <TableHead>Nome</TableHead>
              <TableHead>CPF</TableHead>
              <TableHead>Telefone</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Data Cadastro</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Nota</TableHead>
              <TableHead className="w-[150px]">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {chamados.map((chamado) => (
              <TableRow key={chamado.id} className="h-12">
                <TableCell>
                  {chamado.foto_url ? (
                    <img 
                      src={chamado.foto_url} 
                      alt="Anexo"
                      className="w-12 h-12 object-cover rounded cursor-pointer hover:opacity-80"
                      onClick={() => window.open(chamado.foto_url, '_blank')}
                    />
                  ) : (
                    <div className="w-12 h-12 bg-muted rounded flex items-center justify-center text-xs text-muted-foreground">
                      -
                    </div>
                  )}
                </TableCell>
                <TableCell className="font-medium">{chamado.nome}</TableCell>
                <TableCell>{chamado.cpf}</TableCell>
                <TableCell>{chamado.telefone}</TableCell>
                <TableCell>{chamado.email}</TableCell>
                <TableCell>
                  {format(new Date(chamado.created_at), "dd/MM/yyyy")}
                </TableCell>
                <TableCell>{getStatusBadge(chamado.status)}</TableCell>
                <TableCell>
                  {chamado.notas ? (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleViewNota(chamado)}
                      className="h-7 px-2"
                    >
                      <FileText className="h-3.5 w-3.5" />
                    </Button>
                  ) : (
                    <span className="text-muted-foreground">-</span>
                  )}
                </TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleOpenNotaModal(chamado)}
                      className="h-8 px-2"
                    >
                      <FileText className="h-3.5 w-3.5 mr-1" />
                      Nota
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleOpenStatusModal(chamado)}
                      className="h-8 px-2"
                    >
                      <Edit className="h-3.5 w-3.5 mr-1" />
                      Status
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {selectedChamado && (
        <>
          <AdicionarNotaModal
            open={notaModalOpen}
            onOpenChange={setNotaModalOpen}
            currentNota={selectedChamado.notas}
            onSave={(nota) =>
              onUpdateNotas({ id: selectedChamado.id, notas: nota })
            }
          />

          <AlterarStatusModal
            open={statusModalOpen}
            onOpenChange={setStatusModalOpen}
            currentStatus={selectedChamado.status}
            onSave={(status) =>
              onUpdateStatus({ id: selectedChamado.id, status })
            }
          />

          <Dialog open={notaViewOpen} onOpenChange={setNotaViewOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Nota do Chamado</DialogTitle>
              </DialogHeader>
              <div className="py-4">
                <div className="space-y-2">
                  <p className="text-sm font-medium">Chamado #{selectedChamado.id.slice(0, 8)}</p>
                  <p className="text-sm text-muted-foreground">{selectedChamado.nome}</p>
                  <div className="mt-4 p-3 bg-muted rounded-md">
                    <p className="text-sm whitespace-pre-wrap">
                      {selectedChamado.notas || "Sem nota"}
                    </p>
                  </div>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </>
      )}
    </>
  );
}
