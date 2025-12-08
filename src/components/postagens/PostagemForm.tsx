import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Postagem } from "@/hooks/usePostagens";
import { Clock } from "lucide-react";

interface PostagemFormProps {
  postagem?: Postagem;
  onSubmit: (data: any) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export function PostagemForm({
  postagem,
  onSubmit,
  onCancel,
  isLoading,
}: PostagemFormProps) {
  const [formData, setFormData] = useState({
    titulo: postagem?.titulo || "",
    descricao: postagem?.descricao || "",
    link_post: postagem?.link_post || "",
    data_postagem: postagem?.data_postagem || new Date().toISOString().split("T")[0],
    plataforma: postagem?.plataforma || "instagram",
    curtidas: postagem?.curtidas || 0,
    visualizacoes: postagem?.visualizacoes || 0,
    comentarios: postagem?.comentarios || 0,
    agendada: postagem?.agendada ?? false,
    postada: postagem?.postada ?? true,
    hora_agendamento: postagem?.hora_agendamento || "",
  });

  const handleAgendadaChange = (checked: boolean) => {
    if (checked) {
      // Se está agendando, marca como não postada ainda
      setFormData({ 
        ...formData, 
        agendada: true, 
        postada: false,
        hora_agendamento: formData.hora_agendamento || "09:00"
      });
    } else {
      // Se não está agendando, marca como já postada
      setFormData({ 
        ...formData, 
        agendada: false, 
        postada: true,
        hora_agendamento: ""
      });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      ...formData,
      hora_agendamento: formData.agendada ? formData.hora_agendamento : null,
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="titulo">Título *</Label>
        <Input
          id="titulo"
          value={formData.titulo}
          onChange={(e) =>
            setFormData({ ...formData, titulo: e.target.value })
          }
          required
          placeholder="Título da postagem"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="descricao">Descrição</Label>
        <Textarea
          id="descricao"
          value={formData.descricao}
          onChange={(e) =>
            setFormData({ ...formData, descricao: e.target.value })
          }
          placeholder="Descrição da postagem"
          rows={3}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="data_postagem">Data da Postagem *</Label>
          <Input
            id="data_postagem"
            type="date"
            value={formData.data_postagem}
            onChange={(e) =>
              setFormData({ ...formData, data_postagem: e.target.value })
            }
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="plataforma">Plataforma</Label>
          <Select
            value={formData.plataforma}
            onValueChange={(value) =>
              setFormData({ ...formData, plataforma: value })
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="instagram">Instagram</SelectItem>
              <SelectItem value="facebook">Facebook</SelectItem>
              <SelectItem value="youtube">YouTube</SelectItem>
              <SelectItem value="tiktok">TikTok</SelectItem>
              <SelectItem value="linkedin">LinkedIn</SelectItem>
              <SelectItem value="twitter">Twitter/X</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Seção de Agendamento */}
      <div className="rounded-lg border p-4 space-y-4 bg-muted/30">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <Label htmlFor="agendada" className="font-medium">Agendar postagem</Label>
          </div>
          <Switch
            id="agendada"
            checked={formData.agendada}
            onCheckedChange={handleAgendadaChange}
          />
        </div>
        
        {formData.agendada && (
          <div className="space-y-2">
            <Label htmlFor="hora_agendamento">Horário do agendamento</Label>
            <Input
              id="hora_agendamento"
              type="time"
              value={formData.hora_agendamento}
              onChange={(e) =>
                setFormData({ ...formData, hora_agendamento: e.target.value })
              }
            />
            <p className="text-xs text-muted-foreground">
              O post será marcado como postado automaticamente quando a data e hora chegarem.
            </p>
          </div>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="link_post">Link da Postagem</Label>
        <Input
          id="link_post"
          type="url"
          value={formData.link_post}
          onChange={(e) =>
            setFormData({ ...formData, link_post: e.target.value })
          }
          placeholder="https://..."
        />
      </div>

      <div className="grid grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label htmlFor="curtidas">Curtidas</Label>
          <Input
            id="curtidas"
            type="number"
            min="0"
            value={formData.curtidas}
            onChange={(e) =>
              setFormData({ ...formData, curtidas: parseInt(e.target.value) || 0 })
            }
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="visualizacoes">Visualizações</Label>
          <Input
            id="visualizacoes"
            type="number"
            min="0"
            value={formData.visualizacoes}
            onChange={(e) =>
              setFormData({
                ...formData,
                visualizacoes: parseInt(e.target.value) || 0,
              })
            }
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="comentarios">Comentários</Label>
          <Input
            id="comentarios"
            type="number"
            min="0"
            value={formData.comentarios}
            onChange={(e) =>
              setFormData({
                ...formData,
                comentarios: parseInt(e.target.value) || 0,
              })
            }
          />
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? "Salvando..." : postagem ? "Atualizar" : "Criar"}
        </Button>
      </div>
    </form>
  );
}
