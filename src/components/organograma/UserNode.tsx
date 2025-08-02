import { memo, useState } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Link } from 'lucide-react';

interface UserNodeData {
  nome: string;
  role: string;
  foto_perfil_url?: string;
  onStartConnection?: (nodeId: string) => void;
  onEndConnection?: (nodeId: string) => void;
  isConnectionMode?: boolean;
}

const getRoleBorderColor = (role: string) => {
  switch (role) {
    case 'administrador':
      return 'border-yellow-500';
    case 'gerente_comercial':
    case 'gerente_fabril':
      return 'border-orange-500';
    case 'atendente':
      return 'border-blue-500';
    default:
      return 'border-gray-400';
  }
};

const getRoleDisplayName = (role: string) => {
  switch (role) {
    case 'administrador':
      return 'Administrador';
    case 'gerente_comercial':
      return 'Gerente Comercial';
    case 'gerente_fabril':
      return 'Gerente Fabril';
    case 'atendente':
      return 'Atendente';
    default:
      return role;
  }
};

function UserNode({ data, id }: NodeProps) {
  const [isHovered, setIsHovered] = useState(false);
  const nodeData = data as unknown as UserNodeData;
  
  const handleStartConnection = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (nodeData.onStartConnection) {
      nodeData.onStartConnection(id as string);
    }
  };

  const handleEndConnection = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (nodeData.onEndConnection) {
      nodeData.onEndConnection(id as string);
    }
  };

  const borderColor = getRoleBorderColor(nodeData.role);
  const roleDisplay = getRoleDisplayName(nodeData.role);

  return (
    <div 
      className="text-center relative"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <Handle 
        type="target" 
        position={Position.Top} 
        className="!opacity-0"
      />
      <Handle 
        type="source" 
        position={Position.Bottom} 
        className="!opacity-0"
      />
      
      <div 
        className={`relative cursor-pointer transition-all duration-200 ${
          nodeData.isConnectionMode ? 'ring-2 ring-primary cursor-crosshair' : ''
        }`}
        onClick={nodeData.isConnectionMode ? handleEndConnection : undefined}
      >
        <Avatar 
          className={`w-20 h-20 border-4 ${borderColor} transition-all duration-200 hover:scale-105`}
        >
          <AvatarImage 
            src={nodeData.foto_perfil_url} 
            alt={nodeData.nome}
          />
          <AvatarFallback className="text-lg font-semibold">
            {nodeData.nome.split(' ').map(n => n[0]).join('').toUpperCase()}
          </AvatarFallback>
        </Avatar>
        
        {/* Botão de conexão que aparece no hover */}
        {isHovered && !nodeData.isConnectionMode && (
          <Button
            size="icon"
            variant="default"
            className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-primary hover:bg-primary/80 shadow-lg"
            onClick={handleStartConnection}
          >
            <Link className="h-3 w-3" />
          </Button>
        )}
        
        {nodeData.isConnectionMode && (
          <div className="absolute -inset-1 border-2 border-dashed border-primary rounded-full animate-pulse" />
        )}
      </div>
      
      <div className="mt-2 max-w-[120px]">
        <p className="text-sm font-semibold text-foreground truncate">
          {nodeData.nome}
        </p>
        <p className="text-xs text-muted-foreground">
          {roleDisplay}
        </p>
      </div>
    </div>
  );
}

export default memo(UserNode);