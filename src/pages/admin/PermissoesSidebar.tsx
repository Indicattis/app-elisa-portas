import { RolePermissionManager } from "@/components/RolePermissionManager";
import { InterfaceAccessManager } from "@/components/InterfaceAccessManager";

export default function PermissoesSidebar() {
  return (
    <div className="space-y-6">
      <InterfaceAccessManager />
      <RolePermissionManager />
    </div>
  );
}
