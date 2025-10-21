// import { useState, useEffect, createContext, useContext } from "react";
// import { supabase } from "@/integrations/supabase/client";

// const AuthContext = createContext();

// export const useAuth = () => {
//   const context = useContext(AuthContext);
//   if (!context) {
//     throw new Error('useAuth must be used within an AuthProvider');
//   }
//   return context;
// };

// export const AuthProvider = ({ children }) => {
//   const [user, setUser] = useState(null);
//   const [session, setSession] = useState(null);
//   const [userRole, setUserRole] = useState('user');
//   const [loading, setLoading] = useState(true);

//   useEffect(() => {
//     // Set up auth state listener
//     const { data: { subscription } } = supabase.auth.onAuthStateChange(
//       async (event, session) => {
//         setSession(session);
//         setUser(session?.user ?? null);
        
//         // Fetch user role when user signs in
//         if (session?.user) {
//           setTimeout(async () => {
//             try {
//               const { data, error } = await supabase
//                 .from('user_roles')
//                 .select('role')
//                 .eq('user_id', session.user.id)
//                 .single();
              
//               if (!error && data) {
//                 setUserRole(data.role);
//               } else {
//                 // Create default user role if none exists
//                 await supabase
//                   .from('user_roles')
//                   .insert([{ user_id: session.user.id, role: 'user' }]);
//                 setUserRole('user');
//               }
//             } catch (error) {
//               console.error('Error fetching user role:', error);
//               setUserRole('user');
//             }
//           }, 0);
//         } else {
//           setUserRole('user');
//         }
        
//         setLoading(false);
//       }
//     );

//     // Check for existing session
//     supabase.auth.getSession().then(({ data: { session } }) => {
//       setSession(session);
//       setUser(session?.user ?? null);
      
//       if (session?.user) {
//         // Fetch user role for existing session
//         setTimeout(async () => {
//           try {
//             const { data, error } = await supabase
//               .from('user_roles')
//               .select('role')
//               .eq('user_id', session.user.id)
//               .single();
            
//             if (!error && data) {
//               setUserRole(data.role);
//             } else {
//               setUserRole('user');
//             }
//           } catch (error) {
//             console.error('Error fetching user role:', error);
//             setUserRole('user');
//           }
//           setLoading(false);
//         }, 0);
//       } else {
//         setLoading(false);
//       }
//     });

//     return () => subscription.unsubscribe();
//   }, []);

//   const signUp = async (email, password) => {
//     const redirectUrl = `${window.location.origin}/`;
    
//     const { error } = await supabase.auth.signUp({
//       email,
//       password,
//       options: {
//         emailRedirectTo: redirectUrl
//       }
//     });
//     return { error };
//   };

//   const signIn = async (email, password) => {
//     const { error } = await supabase.auth.signInWithPassword({
//       email,
//       password
//     });
//     return { error };
//   };

//   const signOut = async () => {
//     const { error } = await supabase.auth.signOut();
//     if (!error) {
//       setUser(null);
//       setSession(null);
//       setUserRole('user');
//     }
//     return { error };
//   };

//   const isAdmin = () => userRole === 'admin';
//   const isManager = () => userRole === 'manager' || userRole === 'admin';

//   return (
//     <AuthContext.Provider value={{
//       user,
//       session,
//       userRole,
//       loading,
//       signUp,
//       signIn,
//       signOut,
//       isAdmin,
//       isManager
//     }}>
//       {children}
//     </AuthContext.Provider>
//   );
// };
import { useState, useEffect, createContext, useContext } from "react";

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  // Mock data for local development
  const [user, setUser] = useState({ id: 'mock-user-id', email: 'admin@local.com' });
  const [session, setSession] = useState({ user });
  const [userRole, setUserRole] = useState('admin');
  const [loading, setLoading] = useState(false);

  const signUp = async (email, password) => {
    console.log('Mock signUp called with:', email);
    return { error: null };
  };

  const signIn = async (email, password) => {
    console.log('Mock signIn called with:', email);
    setUser({ id: 'mock-user-id', email });
    return { error: null };
  };

  const signOut = async () => {
    console.log('Mock signOut called');
    setUser(null);
    setSession(null);
    setUserRole('user');
    return { error: null };
  };

  const isAdmin = () => userRole === 'admin';
  const isManager = () => userRole === 'manager' || userRole === 'admin';

  const value = {
    user,
    session,
    userRole,
    loading,
    signUp,
    signIn,
    signOut,
    isAdmin,
    isManager
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};