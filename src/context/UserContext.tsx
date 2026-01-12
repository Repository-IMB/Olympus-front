import { createContext, useContext } from "react";

export type UserContextType = {
  userContext: any;
};

export const UserContext = createContext<UserContextType | null>(null);

export const useUserContext = () => {
  const ctx = useContext(UserContext);
  if (!ctx) {
    throw new Error("useUserContext debe usarse dentro de UserContext.Provider");
  }
  return ctx;
};
