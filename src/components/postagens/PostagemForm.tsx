import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Postagem } from "@/hooks/usePostagens";

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
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
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
