import { useQuery } from "@tanstack/react-query";

export function useAuth() {
  return {
    user: { id: 1, name: "Corretor Teste" }, // Mock
    isLoading: false,
    isAuthenticated: true,
  };
}