import React, { useContext } from "react";
export const Store = React.createContext(null);
export const useStudio = () => useContext(Store);
