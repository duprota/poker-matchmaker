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

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [userRole, setUserRole] = useState<UserRole>(null);
  const { toast } = useToast();

  const fetchUserRole = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', userId)
        .single();

      if (error) throw error;
      return data?.role || 'user';
    } catch (error) {
      console.error('Error fetching user role:', error);
      return 'user';
    }
  };

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session?.user) {
        fetchUserRole(session.user.id).then(setUserRole);
      }
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state changed:', event, session);
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

    return () => {
      subscription.unsubscribe();
    };
  }, [toast]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  const handlePromoteToManager = async () => {
    try {
      const { error } = await supabase.rpc('promote_to_manager', {
        user_id: session?.user.id
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: "You have been promoted to manager status!",
      });
      
      setUserRole('manager');
    } catch (error) {
      console.error('Error promoting to manager:', error);
      toast({
        title: "Error",
        description: "Failed to promote to manager status",
        variant: "destructive",
      });
    }
  };

  return (
    <AuthContext.Provider value={{ session, userRole, handleSignOut, handlePromoteToManager }}>
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