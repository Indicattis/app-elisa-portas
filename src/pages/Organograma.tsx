import { useCallback, useState, useEffect } from 'react';
import {
  ReactFlow,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  Background,
  Controls,
  MiniMap,
  Node,
  Edge,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useUserPermissions } from '@/hooks/useUserPermissions';
import { useToast } from '@/hooks/use-toast';
import UserNode from '@/components/organograma/UserNode';
import { Save, Download, Upload } from 'lucide-react';

const nodeTypes = {
  userNode: UserNode,
};

interface AdminUser {
  id: string;
  nome: string;
  role: string;
  foto_perfil_url?: string;
}

export default function Organograma() {
  const { user } = useAuth();
  const { hasPermission } = useUserPermissions();
  const { toast } = useToast();
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [connectionMode, setConnectionMode] = useState<string | null>(null);

  useEffect(() => {
    if (hasPermission('organograma')) {
      fetchUsers();
    }
  }, []);

  const handleStartConnection = useCallback((sourceNodeId: string) => {
    setConnectionMode(sourceNodeId);
    // Atualizar nodes para indicar modo de conexão
    setNodes(nodes => 
      nodes.map(node => ({
        ...node,
        data: {
          ...node.data,
          isConnectionMode: node.id === sourceNodeId,
        }
      }))
    );
  }, [setNodes]);

  const handleEndConnection = useCallback((targetNodeId: string) => {
    if (connectionMode && connectionMode !== targetNodeId) {
      // Verificar se a conexão já existe
      const connectionExists = edges.some(edge => 
        (edge.source === connectionMode && edge.target === targetNodeId) ||
        (edge.source === targetNodeId && edge.target === connectionMode)
      );

      if (!connectionExists) {
        // Criar nova conexão
        const newEdge: Edge = {
          id: `${connectionMode}-${targetNodeId}`,
          source: connectionMode,
          target: targetNodeId,
          type: 'default',
        };
        setEdges(edges => [...edges, newEdge]);
        
        toast({
          title: "Conexão criada",
          description: "Vínculo adicionado com sucesso!",
        });
      } else {
        toast({
          variant: "destructive",
          title: "Conexão já existe",
          description: "Este vínculo já foi criado anteriormente.",
        });
      }
    }
    
    // Resetar modo de conexão
    setConnectionMode(null);
    setNodes(nodes => 
      nodes.map(node => ({
        ...node,
        data: {
          ...node.data,
          isConnectionMode: false,
        }
      }))
    );
  }, [connectionMode, edges, setEdges, setNodes, toast]);

  const loadSavedPositions = async () => {
    try {
      // Carregar posições salvas
      const { data: positions, error: posError } = await supabase
        .from('organograma_positions')
        .select('*');

      // Carregar conexões salvas
      const { data: connections, error: connError } = await supabase
        .from('organograma_connections')
        .select('*');

      if (posError) throw posError;
      if (connError) throw connError;

      // Aplicar posições e conexões se existirem
      if (positions && positions.length > 0) {
        setNodes(currentNodes => 
          currentNodes.map(node => {
            const savedPosition = positions.find(p => p.user_id === node.id);
            return savedPosition ? {
              ...node,
              position: { x: Number(savedPosition.position_x), y: Number(savedPosition.position_y) },
              data: {
                ...node.data,
                onStartConnection: handleStartConnection,
                onEndConnection: handleEndConnection,
                isConnectionMode: false,
              }
            } : {
              ...node,
              data: {
                ...node.data,
                onStartConnection: handleStartConnection,
                onEndConnection: handleEndConnection,
                isConnectionMode: false,
              }
            };
          })
        );
      }

      if (connections && connections.length > 0) {
        const savedEdges: Edge[] = connections.map(conn => ({
          id: `${conn.source_user_id}-${conn.target_user_id}`,
          source: conn.source_user_id,
          target: conn.target_user_id,
          type: 'default',
        }));
        setEdges(savedEdges);
      }
    } catch (error) {
      console.error('Erro ao carregar posições salvas:', error);
    }
  };

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('admin_users')
        .select('id, nome, role, foto_perfil_url, user_id')
        .eq('ativo', true);

      if (error) throw error;

      if (data) {
        setUsers(data);
        
        // Create initial nodes positioned in a grid
        const initialNodes: Node[] = data.map((user, index) => ({
          id: user.user_id, // Usar user_id em vez de id
          type: 'userNode',
          position: { 
            x: (index % 4) * 200 + 100, 
            y: Math.floor(index / 4) * 180 + 100 
          },
          data: {
            nome: user.nome,
            role: user.role,
            foto_perfil_url: user.foto_perfil_url,
            onStartConnection: handleStartConnection,
            onEndConnection: handleEndConnection,
            isConnectionMode: false,
          },
        }));
        
        setNodes(initialNodes);
        
        // Carregar posições salvas após criar os nós iniciais
        setTimeout(() => loadSavedPositions(), 100);
      }
    } catch (error) {
      console.error('Erro ao buscar usuários:', error);
    }
  };

  const saveOrganograma = async () => {
    if (!user) return;
    
    setIsSaving(true);
    try {
      // Salvar posições dos nós
      const positionsToSave = nodes.map(node => ({
        user_id: node.id,
        position_x: node.position.x,
        position_y: node.position.y,
        created_by: user.id
      }));

      // Primeiro remover posições existentes
      await supabase
        .from('organograma_positions')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000'); // Remove all

      // Inserir novas posições
      const { error: posError } = await supabase
        .from('organograma_positions')
        .insert(positionsToSave);

      if (posError) throw posError;

      // Salvar conexões
      const connectionsToSave = edges.map(edge => ({
        source_user_id: edge.source,
        target_user_id: edge.target,
        created_by: user.id
      }));

      // Primeiro remover conexões existentes
      await supabase
        .from('organograma_connections')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000'); // Remove all

      // Inserir novas conexões
      if (connectionsToSave.length > 0) {
        const { error: connError } = await supabase
          .from('organograma_connections')
          .insert(connectionsToSave);

        if (connError) throw connError;
      }

      toast({
        title: "Sucesso",
        description: "Organograma salvo com sucesso!",
      });
    } catch (error) {
      console.error('Erro ao salvar organograma:', error);
      toast({
        variant: "destructive",
        title: "Erro",
        description: "Erro ao salvar organograma",
      });
    } finally {
      setIsSaving(false);
    }
  };


  const onConnect = useCallback(
    (params: Connection) => {
      // Verificar se a conexão já existe
      const connectionExists = edges.some(edge => 
        (edge.source === params.source && edge.target === params.target) ||
        (edge.source === params.target && edge.target === params.source)
      );

      if (!connectionExists) {
        setEdges((eds) => addEdge(params, eds));
        toast({
          title: "Conexão criada",
          description: "Vínculo adicionado com sucesso!",
        });
      } else {
        toast({
          variant: "destructive",
          title: "Conexão já existe",
          description: "Este vínculo já foi criado anteriormente.",
        });
      }
    },
    [setEdges, edges, toast]
  );

  if (!hasPermission('organograma')) {
    return (
      <div className="p-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-muted-foreground">
            Acesso Negado
          </h1>
          <p className="text-muted-foreground mt-2">
            Você não tem permissão para acessar o organograma.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen w-full flex flex-col">
      {/* Header com botão de salvar */}
      <div className="p-4 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Organograma</h1>
            <p className="text-muted-foreground">
              Organize a estrutura hierárquica da empresa. Arraste os usuários para posicionar e arraste de um nó para outro para criar vínculos.
            </p>
            {connectionMode && (
              <p className="text-sm text-primary font-medium mt-1">
                Modo de conexão ativo - Clique em outro usuário para criar vínculo
              </p>
            )}
          </div>
          <div className="flex gap-2">
            <Button
              onClick={saveOrganograma}
              disabled={isSaving}
              className="flex items-center gap-2"
            >
              <Save className="h-4 w-4" />
              {isSaving ? 'Salvando...' : 'Salvar Organograma'}
            </Button>
          </div>
        </div>
      </div>

      {/* ReactFlow */}
      <div className="flex-1">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          nodeTypes={nodeTypes}
          fitView
          className="bg-background"
          deleteKeyCode={["Backspace", "Delete"]}
        >
          <Background />
          <Controls />
          <MiniMap 
            nodeColor={(node) => {
              const role = node.data?.role;
              if (role === 'administrador') return '#FFD700';
              if (role === 'gerente_comercial' || role === 'gerente_fabril') return '#FFA500';
              return '#6B7280';
            }}
          />
        </ReactFlow>
      </div>
    </div>
  );
}