import React, { createContext, useContext, useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';

interface User {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  cpf?: string;
  creci?: string;
  phone?: string;
  createdAt?: string;
  updatedAt?: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refetchUser: () => void;
}

const AuthContext = React.createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const queryClient = useQueryClient();

  // Query para buscar o usuário atual
  const { data: userData, isLoading, refetch } = useQuery({
    queryKey: ['auth', 'user'],
    queryFn: async () => {
      try {
        const response = await apiRequest('GET', '/api/auth/user');
        return await response.json();
      } catch (error) {
        // Se der erro 401 (não autorizado), retorna null
        return null;
      }
    },
    retry: false,
    staleTime: 5 * 60 * 1000, // 5 minutos
  });

  // Atualizar o estado do usuário quando os dados mudarem
  useEffect(() => {
    setUser(userData || null);
  }, [userData]);

  // Mutation para login
  const loginMutation = useMutation({
    mutationFn: async ({ email, password }: { email: string; password: string }) => {
      const response = await apiRequest('POST', '/api/auth/login', { email, password });
      return await response.json();
    },
    onSuccess: (data) => {
      setUser(data.user);
      queryClient.setQueryData(['auth', 'user'], data.user);
      queryClient.invalidateQueries({ queryKey: ['auth'] });
    },
  });

  // Mutation para logout
  const logoutMutation = useMutation({
    mutationFn: async () => {
      await apiRequest('POST', '/api/auth/logout');
    },
    onSuccess: () => {
      setUser(null);
      queryClient.setQueryData(['auth', 'user'], null);
      queryClient.clear();
      window.location.href = '/login';
    },
  });

  const login = async (email: string, password: string) => {
    await loginMutation.mutateAsync({ email, password });
  };

  const logout = async () => {
    await logoutMutation.mutateAsync();
  };

  const refetchUser = () => {
    refetch();
  };

  const value: AuthContextType = {
    user,
    isLoading,
    login,
    logout,
    refetchUser,
  };

  return (
      <AuthContext.Provider value={value}>
        {children}
      </AuthContext.Provider>
    );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}