import { useMutation } from "@tanstack/react-query";
import { useAuth } from "@/context/AuthContext";

// Re-export for convenience
export { useAuth } from "@/context/AuthContext";

export function useLogin() {
  const { login } = useAuth();

  return useMutation({
    mutationFn: async ({
      username,
      password,
    }: {
      username: string;
      password: string;
    }) => {
      await login(username, password);
    },
  });
}

export function useLogout() {
  const { logout } = useAuth();

  return logout;
}
