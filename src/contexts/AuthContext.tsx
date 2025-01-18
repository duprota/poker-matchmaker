import { createContext, useContext, useEffect, useState } from "react";
import { Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

type UserRole = 'user' | 'manager' | null;

interface AuthContextType {
  session: Session | null;
  userRole: UserRole;
  handleSignOut: () => Promise<void>;
  handlePromoteToManager: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  session: null,
  userRole: null,
  handleSignOut: async () => {},
  handlePromoteToManager: async () => {},
});

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [userRole, setUserRole] = useState<UserRole>(null);
  const { toast } = useToast();

  const fetchUserRole = async (userId: string) => {
    try {
      console.log("Fetching user role for:", userId);
      const { data, error } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Error fetching user role:', error);
        throw error;
      }
      console.log("Fetched user role:", data?.role);
      return data?.role || 'user';
    } catch (error) {
      console.error('Error fetching user role:', error);
      return 'user';
    }
  };

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log("Initial session:", session);
      setSession(session);
      if (session?.user) {
        fetchUserRole(session.user.id).then(setUserRole);
      }
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("Auth state changed:", event, session);
      setSession(session);

      if (session?.user) {
        const role = await fetchUserRole(session.user.id);
        setUserRole(role);
        if (event === 'SIGNED_IN') {
          toast({
            title: "Welcome!",
            description: "You've successfully signed in.",
          });
        }
      } else {
        setUserRole(null);
      }
    });

    return () => subscription.unsubscribe();
  }, [toast]);

  const handleSignOut = async () => {
    console.log("AuthContext: Signing out...");
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error("Error in AuthContext signOut:", error);
        throw error;
      }
      console.log("AuthContext: Sign out successful");
      setSession(null);
      setUserRole(null);
      toast({
        title: "Signed out",
        description: "You have been successfully signed out.",
      });
    } catch (error) {
      console.error("Error during sign out:", error);
      toast({
        title: "Error",
        description: "Failed to sign out. Please try again.",
        variant: "destructive",
      });
      throw error;
    }
  };

  const handlePromoteToManager = async () => {
    try {
      if (!session?.user?.id) {
        throw new Error('No authenticated user');
      }

      console.log("Promoting user to manager:", session.user.id);
      const { error } = await supabase.rpc('promote_to_manager', {
        user_id: session.user.id
      });

      if (error) throw error;

      setUserRole('manager');
      toast({
        title: "Success",
        description: "You have been promoted to manager status!",
      });
    } catch (error) {
      console.error('Error promoting to manager:', error);
      toast({
        title: "Error",
        description: "Failed to promote to manager status",
        variant: "destructive",
      });
      throw error;
    }
  };

  return (
    <AuthContext.Provider value={{ session, userRole, handleSignOut, handlePromoteToManager }}>
      {children}
    </AuthContext.Provider>
  );
};