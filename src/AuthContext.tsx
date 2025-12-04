// app/AuthContext.tsx
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { createContext, ReactNode, useEffect, useState } from "react";
import { auth, db } from "./firebase";

export const AuthContext = createContext<any>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<any>(null);
    const [role, setRole] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        return onAuthStateChanged(auth, async (usr) => {
            if (usr) {
                setUser(usr);
                const snap = await getDoc(doc(db, "users", usr.uid));
                if (snap.exists()) setRole(snap.data().role);
            } else {
                setUser(null);
                setRole(null);
            }
            setLoading(false);
        });
    }, []);

    return (
        <AuthContext.Provider value={{ user, role, loading }}>
            {children}
        </AuthContext.Provider>
    );
}
