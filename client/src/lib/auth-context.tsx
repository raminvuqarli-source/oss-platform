import { createContext, useContext, useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest, queryClient, getQueryFn, clearDemoToken } from "./queryClient";
import type { User, UserRole } from "@shared/schema";
import { initOneSignal, loginOneSignal, logoutOneSignal, setOneSignalTags, requestNotificationPermission } from "./onesignal";

type RegisterData = {
  username: string;
  password: string;
  fullName: string;
  email?: string;
  role: string;
  hotelData?: {
    name: string;
    country?: string;
    city?: string;
    address?: string;
    postalCode?: string;
    phone?: string;
    email?: string;
    website?: string;
    starRating?: string;
    totalRooms?: number;
    numberOfFloors?: number;
    buildingType?: string;
    primaryGuestType?: string;
    hasSmartDevices?: boolean;
    smartDoorLocks?: boolean;
    smartHvac?: boolean;
    smartLighting?: boolean;
    pmsSystem?: boolean;
    bmsSystem?: boolean;
    iotSensors?: boolean;
    pmsSoftware?: string;
    pmsOther?: string;
    expectedSmartRoomCount?: number;
    billingCurrency?: string;
    billingContactEmail?: string;
  };
};

type AuthContextType = {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isDemoMode: boolean;
  login: (username: string, password: string) => Promise<User>;
  register: (data: RegisterData) => Promise<User>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [authUser, setAuthUser] = useState<User | null>(null);
  
  const { data: queryUser, isFetching, isFetched } = useQuery<User | null>({
    queryKey: ["/api/auth/me"],
    queryFn: getQueryFn({ on401: "returnNull" }),
    retry: false,
    staleTime: 30 * 1000,
    refetchOnWindowFocus: true,
  });

  useEffect(() => {
    initOneSignal();
  }, []);

  useEffect(() => {
    if (isFetched && queryUser) {
      setAuthUser(queryUser);
      (async () => {
        await loginOneSignal(queryUser.id);
        await setOneSignalTags({ role: queryUser.role, hotelId: queryUser.hotelId || "" });
        await requestNotificationPermission();
      })();
    }
  }, [queryUser, isFetched]);

  const loginMutation = useMutation({
    mutationFn: async (credentials: { username: string; password: string }) => {
      queryClient.clear();
      const response = await apiRequest("POST", "/api/auth/login", credentials);
      return response.json();
    },
    onSuccess: (data: User) => {
      setAuthUser(data);
      queryClient.setQueryData(["/api/auth/me"], data);
      if (typeof window !== "undefined" && typeof (window as any).gtag === "function") {
        (window as any).gtag("event", "user_login", { method: "email" });
      }
      (async () => {
        await loginOneSignal(data.id);
        await setOneSignalTags({ role: data.role, hotelId: data.hotelId || "" });
        await requestNotificationPermission();
      })();
    },
  });

  const registerMutation = useMutation({
    mutationFn: async (data: RegisterData) => {
      queryClient.clear();
      const endpoint = data.hotelData ? "/api/auth/register-hotel" : "/api/auth/register";
      const response = await apiRequest("POST", endpoint, data);
      const result = await response.json();
      return data.hotelData ? result.user : result;
    },
    onSuccess: (data: User) => {
      setAuthUser(data);
      queryClient.setQueryData(["/api/auth/me"], data);
    },
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/auth/logout", {});
    },
    onSuccess: () => {
      clearDemoToken();
      logoutOneSignal();
      setAuthUser(null);
      queryClient.setQueryData(["/api/auth/me"], null);
      queryClient.clear();
    },
  });

  const login = async (username: string, password: string): Promise<User> => {
    return await loginMutation.mutateAsync({ username, password });
  };

  const register = async (data: RegisterData): Promise<User> => {
    return await registerMutation.mutateAsync(data);
  };

  const logout = async () => {
    await logoutMutation.mutateAsync();
  };

  const user = isFetched ? (queryUser ?? authUser) : authUser;
  const isLoading = !isFetched;
  const isDemoMode = !!user?.username?.startsWith("demo_");

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        isDemoMode,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
