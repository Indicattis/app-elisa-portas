import { memo, useState } from 'react';
import { Handle, Position, NodeProps } from '@xyflow/react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface UserNodeData {
  nome: string;
  role: string;
  foto_perfil_url?: string;
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

function UserNode({ data }: NodeProps) {
  const [isConnecting, setIsConnecting] = useState(false);
  
  const handleDoubleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsConnecting(!isConnecting);
  };

  const borderColor = getRoleBorderColor((data as unknown as UserNodeData).role);
  const roleDisplay = getRoleDisplayName((data as unknown as UserNodeData).role);

  return (
    <div className="text-center">
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
          isConnecting ? 'ring-2 ring-primary' : ''
        }`}
        onDoubleClick={handleDoubleClick}
      >
        <Avatar 
          className={`w-20 h-20 border-4 ${borderColor} transition-all duration-200 hover:scale-105`}
        >
          <AvatarImage 
            src={(data as unknown as UserNodeData).foto_perfil_url} 
            alt={(data as unknown as UserNodeData).nome}
          />
          <AvatarFallback className="text-lg font-semibold">
            {(data as unknown as UserNodeData).nome.split(' ').map(n => n[0]).join('').toUpperCase()}
          </AvatarFallback>
        </Avatar>
        
        {isConnecting && (
          <div className="absolute -inset-1 border-2 border-dashed border-primary rounded-full animate-pulse" />
        )}
      </div>
      
      <div className="mt-2 max-w-[120px]">
        <p className="text-sm font-semibold text-foreground truncate">
          {(data as unknown as UserNodeData).nome}
        </p>
        <p className="text-xs text-muted-foreground">
          {roleDisplay}
        </p>
      </div>
    </div>
  );
}

export default memo(UserNode);