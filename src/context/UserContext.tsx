import { createContext, useContext } from "react";

export type UserContextType = {
  id: number;
  nombre: string;
  correo: string;
  rol: string;
  idRol: number;
  areaCodigo: string;
  accesoTotal: boolean;
  idPersonal: number | null;
};

export type UserContextProviderType = {
  userContext: UserContextType | null;
};

export const UserContext = createContext<UserContextProviderType | null>(null);

export const useUserContext = () => {
  const ctx = useContext(UserContext);
  if (!ctx) {
    throw new Error("useUserContext debe usarse dentro de UserContext.Provider");
  }
  return ctx;
};