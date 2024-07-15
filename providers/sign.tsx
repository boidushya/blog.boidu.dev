"use client";

import React, { createContext, Dispatch, SetStateAction, useEffect, useLayoutEffect, useState } from "react";

export interface TSignContext {
  open: boolean;
  setOpen: Dispatch<SetStateAction<boolean>>;
}

export const defaultSign = "obsidian";

export const SignContext = createContext<TSignContext>({
  open: false,
  setOpen: () => {},
});

const SignProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [open, setOpen] = useState<boolean>(false);

  return <SignContext.Provider value={{ open, setOpen }}>{children}</SignContext.Provider>;
};

export const useSign = () => {
  const context = React.useContext(SignContext) as TSignContext;
  if (context === undefined) {
    throw new Error("useSign must be used within a SignProvider");
  }
  return context;
};

export default SignProvider;
