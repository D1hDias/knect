import { Bell, Search, Moon, Sun, User, Settings, LogOut } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useTheme } from "@/contexts/ThemeContext";
import { useAuth } from "@/hooks/useAuth";

export function TopHeader() {
  const { theme, toggleTheme } = useTheme();
  const { user } = useAuth();
  
  console.log("Theme atual:", theme); // Adicione esta linha para debug
  console.log("ToggleTheme function:", toggleTheme); // E esta também

  return (
    <header className="bg-background border-b border-border px-6 py-4">
      <div className="flex items-center justify-between gap-4">
        {/* Search */}
        <div className="flex-1 max-w-md">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar imóveis, clientes, contratos..."
              className="pl-10"
            />
          </div>
        </div>

        {/* Right side */}
        <div className="flex items-center gap-3">
            {/* Theme toggle */}
            <Button
              variant="outline"
              size="icon"
              onClick={() => {
                console.log("Clicou no botão theme");
                if (document.documentElement.classList.contains('dark')) {
                  document.documentElement.classList.remove('dark');
                } else {
                  document.documentElement.classList.add('dark');
                }
              }}
              className="h-9 w-9"
            >
              🌙
            </Button>

            {/* Notifications */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="icon" className="h-9 w-9 relative">
                  <Bell className="h-4 w-4" />
                  <Badge variant="destructive" className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 text-xs flex items-center justify-center">3</Badge>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-80">
              <div className="px-3 py-2 font-medium">Notificações</div>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="flex items-start gap-3 p-3">
                <div className="bg-yellow-100 dark:bg-yellow-900 p-1 rounded">
                  <Bell className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">Prazo do contrato expira em 2 dias</p>
                  <p className="text-xs text-muted-foreground">Casa Jardins - Contrato #1234</p>
                </div>
              </DropdownMenuItem>
              <DropdownMenuItem className="flex items-start gap-3 p-3">
                <div className="bg-blue-100 dark:bg-blue-900 p-1 rounded">
                  <Bell className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">Novos documentos disponíveis</p>
                  <p className="text-xs text-muted-foreground">Due diligence concluída</p>
                </div>
              </DropdownMenuItem>
              <DropdownMenuItem className="flex items-start gap-3 p-3">
                <div className="bg-green-100 dark:bg-green-900 p-1 rounded">
                  <Bell className="h-4 w-4 text-green-600 dark:text-green-400" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium">Agendamento de visita hoje às 15h</p>
                  <p className="text-xs text-muted-foreground">Apartamento Vila Madalena</p>
                </div>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* User menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-auto p-1">
                <div className="flex items-center gap-2">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={user?.profileImageUrl || ""} />
                    <AvatarFallback>
                      {user?.firstName?.[0]}{user?.lastName?.[0]}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-sm font-medium">
                    {user?.firstName} {user?.lastName}
                  </span>
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => window.location.href = "/configuracoes"}>
                <User className="mr-2 h-4 w-4" />
                Meu Perfil
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => window.location.href = "/configuracoes"}>
                <Settings className="mr-2 h-4 w-4" />
                Configurações
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => window.location.href = "/api/logout"}>
                <LogOut className="mr-2 h-4 w-4" />
                Sair
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
