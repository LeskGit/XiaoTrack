import { createContext } from "react";
import type { AuthContextValue } from "./authContext.types";

/** `null` means "no AuthProvider above": `useAuth` turns that into an explicit error. */
export const AuthContext = createContext<AuthContextValue | null>(null);