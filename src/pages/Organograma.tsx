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
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import UserNode from '@/components/organograma/UserNode';

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
  const { isAdmin } = useAuth();
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [users, setUsers] = useState<AdminUser[]>([]);

  useEffect(() => {
    if (isAdmin) {
      fetchUsers();
    }
  }, [isAdmin]);

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('admin_users')
        .select('id, nome, role, foto_perfil_url')
        .eq('ativo', true);

      if (error) throw error;

      if (data) {
        setUsers(data);
        
        // Create initial nodes positioned in a grid
        const initialNodes: Node[] = data.map((user, index) => ({
          id: user.id,
          type: 'userNode',
          position: { 
            x: (index % 4) * 200 + 100, 
            y: Math.floor(index / 4) * 180 + 100 
          },
          data: {
            nome: user.nome,
            role: user.role,
            foto_perfil_url: user.foto_perfil_url,
          },
        }));
        
        setNodes(initialNodes);
      }
    } catch (error) {
      console.error('Erro ao buscar usuários:', error);
    }
  };

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    [setEdges]
  );

  if (!isAdmin) {
    return (
      <div className="p-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-muted-foreground">
            Acesso Negado
          </h1>
          <p className="text-muted-foreground mt-2">
            Apenas administradores podem acessar o organograma.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen w-full">
      <div className="h-full">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          nodeTypes={nodeTypes}
          fitView
          className="bg-background"
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