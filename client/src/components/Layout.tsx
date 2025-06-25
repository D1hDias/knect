import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/hooks/useAuth";
import {
  Home,
  Building2,
  Search,
  Store,
  HandHeart,
  FileText,
  FileCheck,
  Clock,
  Settings,
  LogOut,
  Menu,
  X,
  Bell,
  User,
  Moon,
  Sun,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useTheme } from "@/contexts/ThemeContext";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

const navigationItems = [
  { href: "/dashboard", label: "Dashboard", icon: Home },
  { href: "/captacao", label: "Captação de Imóveis", icon: Building2 },
  { href: "/due-diligence", label: "Due Diligence", icon: Search },
  { href: "/mercado", label: "Imóveis no Mercado", icon: Store },
  { href: "/propostas", label: "Propostas", icon: HandHeart },
  { href: "/contratos", label: "Contratos", icon: FileText },
  { href: "/instrumento", label: "Instrumento Definitivo", icon: FileCheck },
  { href: "/timeline", label: "Acompanhamento", icon: Clock },
];

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [location] = useLocation();
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error("Error logging out:", error);
    }
  };

  const getUserInitials = () => {
    if (!user?.firstName || !user?.lastName) return "U";
    return `${user.firstName[0]}${user.lastName[0]}`.toUpperCase();
  };

  return (
    <div className="min-h-screen bg-background flex transition-colors duration-200">
      {/* Sidebar */}
      <div
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-gradient-to-b from-[#001f3f] to-[#004286] shadow-lg transform transition-all duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0 ${
        sidebarOpen ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between h-16 px-6 border-b border-white/10">
          <div className="flex items-center justify-center space-x-2 w-full">
            <img 
                src="/src/assets/logo.png" 
                alt="Ventus Hub" 
                className=" w-[120px] h-auto"
            />
        </div>
          <Button
            variant="ghost"
            size="sm"
            className="lg:hidden"
            onClick={() => setSidebarOpen(false)}
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        <nav className="mt-6 px-3">
          <div className="space-y-1">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              const isActive = location === item.href;
              
              return (
                <Link key={item.href} href={item.href}>
                  <div
                    className={`flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors cursor-pointer ${
                    isActive
                        ? "bg-white/20 text-white border-r-2 border-white"
                        : "text-white/80 hover:bg-white/10 hover:text-white"
                    }`}
                  >
                    <Icon className="mr-3 h-5 w-5" />
                    {item.label}
                  </div>
                </Link>
              );
            })}
          </div>
        </nav>

        <div className="absolute bottom-4 left-0 right-0 px-3">
          <div className="flex items-center px-3 py-2 text-sm text-white/80 cursor-pointer hover:bg-white/10 rounded-md">
            <Settings className="mr-3 h-5 w-5" />
            Configurações
          </div>
        </div>
      </div>

      {/* Overlay para mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black bg-opacity-50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-card border-b border-border shadow-sm transition-colors duration-200">
          <div className="flex items-center justify-between h-16 px-6">
            <div className="flex items-center">
              <Button
                variant="ghost"
                size="sm"
                className="lg:hidden"
                onClick={() => setSidebarOpen(true)}
              >
                <Menu className="h-5 w-5" />
              </Button>
              
              <h1 className="ml-4 text-2xl font-semibold text-white lg:ml-0">
                {navigationItems.find(item => item.href === location)?.label || "Dashboard"}
              </h1>
            </div>

            <div className="flex items-center space-x-4">
            {/* Theme toggle */}
            <Button
                variant="ghost"
                size="sm"
                onClick={toggleTheme}
                className="h-8 w-8"
            >
                {theme === "dark" ? (
                <Sun className="h-4 w-4" />
                ) : (
                <Moon className="h-4 w-4" />
                )}
            </Button>

            {/* Notifications */}
            <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="relative">
                <Bell className="h-5 w-5" />
                <span className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 rounded-full text-xs text-white flex items-center justify-center">
                    3
                </span>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80">
                <div className="px-3 py-2 font-medium border-b">Notificações</div>
                
                <DropdownMenuItem className="flex items-start gap-3 p-3 hover:bg-muted/50">
                <div className="bg-yellow-100 dark:bg-yellow-900/30 p-1.5 rounded-full">
                    <Clock className="h-3 w-3 text-yellow-600 dark:text-yellow-400" />
                </div>
                <div className="flex-1 space-y-1">
                    <p className="text-sm font-medium">Prazo do contrato expira em 2 dias</p>
                    <p className="text-xs text-muted-foreground">Casa Jardins - Contrato #1234</p>
                    <p className="text-xs text-muted-foreground">há 30 minutos</p>
                </div>
                </DropdownMenuItem>
                
                <DropdownMenuItem className="flex items-start gap-3 p-3 hover:bg-muted/50">
                <div className="bg-blue-100 dark:bg-blue-900/30 p-1.5 rounded-full">
                    <FileText className="h-3 w-3 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="flex-1 space-y-1">
                    <p className="text-sm font-medium">Novos documentos disponíveis</p>
                    <p className="text-xs text-muted-foreground">Due diligence concluída - Apartamento Vila Madalena</p>
                    <p className="text-xs text-muted-foreground">há 1 hora</p>
                </div>
                </DropdownMenuItem>
                
                <DropdownMenuItem className="flex items-start gap-3 p-3 hover:bg-muted/50">
                <div className="bg-green-100 dark:bg-green-900/30 p-1.5 rounded-full">
                    <Building2 className="h-3 w-3 text-green-600 dark:text-green-400" />
                </div>
                <div className="flex-1 space-y-1">
                    <p className="text-sm font-medium">Agendamento de visita confirmado</p>
                    <p className="text-xs text-muted-foreground">Hoje às 15h - Apartamento Vila Madalena</p>
                    <p className="text-xs text-muted-foreground">há 2 horas</p>
                </div>
                </DropdownMenuItem>
                
                <div className="border-t p-2">
                <Button variant="ghost" size="sm" className="w-full text-xs">
                    Ver todas as notificações
                </Button>
                </div>
            </DropdownMenuContent>
            </DropdownMenu>

            {/* User menu */}
            <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-blue-600 text-white text-sm">
                    {getUserInitials()}
                    </AvatarFallback>
                </Avatar>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">
                    {user?.firstName} {user?.lastName}
                    </p>
                    <p className="text-xs leading-none text-muted-foreground">
                    {user?.email}
                    </p>
                    {user?.creci && (
                    <p className="text-xs leading-none text-muted-foreground">
                        CRECI: {user.creci}
                    </p>
                    )}
                </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                <Link href="/configuracoes" className="w-full">
                    <User className="mr-2 h-4 w-4" />
                    <span>Perfil</span>
                </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                <Link href="/configuracoes" className="w-full">
                    <Settings className="mr-2 h-4 w-4" />
                    <span>Configurações</span>
                </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout}>
                <LogOut className="mr-2 h-4 w-4" />
                <span>Sair</span>
                </DropdownMenuItem>
            </DropdownMenuContent>
            </DropdownMenu>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}