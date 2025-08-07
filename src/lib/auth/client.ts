"use client";

import { useSession, signIn, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useCallback } from "react";

export function useAuth() {
  const { data: session, status } = useSession();
  const router = useRouter();
  
  const login = useCallback(async (username: string, password: string) => {
    try {
      const result = await signIn("credentials", {
        username,
        password,
        redirect: false,
      });
      
      if (result?.error) {
        return { success: false, error: "Invalid credentials" };
      }
      
      if (result?.ok) {
        router.push("/");
        router.refresh();
        return { success: true };
      }
      
      return { success: false, error: "Something went wrong" };
    } catch (error) {
      console.error("Login error:", error);
      return { success: false, error: "An error occurred during login" };
    }
  }, [router]);
  
  const logout = useCallback(async () => {
    await signOut({ 
      redirect: true,
      callbackUrl: "/login" 
    });
  }, []);
  
  return {
    session,
    status,
    isAuthenticated: status === "authenticated",
    isLoading: status === "loading",
    login,
    logout,
  };
}

// Custom hook to require authentication
export function useRequireAuth(redirectTo = "/login") {
  const { status } = useSession();
  const router = useRouter();
  
  if (status === "loading") {
    return { isLoading: true };
  }
  
  if (status === "unauthenticated") {
    router.push(redirectTo);
    return { isLoading: true };
  }
  
  return { isLoading: false };
}