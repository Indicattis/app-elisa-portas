import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Home } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { ProfileDropdownMenu } from "@/components/ProfileDropdownMenu";

export function AdminHeader() {
  const { userRole } = useAuth();
  const navigate = useNavigate();

  if (!userRole) return null;

  return (
    <header className="h-12 bg-card border-b border-border px-2 flex items-center justify-between">
      <div className="flex items-center gap-2">
        <h1 className="text-lg font-bold text-foreground">Administração</h1>
      </div>

      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate("/")}
          className="gap-2"
        >
          <Home className="h-4 w-4" />
          <span className="hidden sm:inline">Dashboard</span>
        </Button>

        <ProfileDropdownMenu variant="popover" avatarSize={32} />
      </div>
    </header>
  );
}
