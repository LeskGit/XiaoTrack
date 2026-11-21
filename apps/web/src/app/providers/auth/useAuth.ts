import { useContext } from "react";
import type { AuthContextValue } from "./authContext.types";
import { AuthContext } from "./authContext";

/** Reads the auth context. Throws if called outside `<AuthProvider>`, so the return type never includes `null`. */
export const useAuth = (): AuthContextValue => {
    const context = useContext(AuthContext);
    if (context === null) {
        throw new Error('useAuth muse be used in AuthProvider');
    }
    return context;
}