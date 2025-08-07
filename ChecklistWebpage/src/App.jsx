import { createContext, useContext } from "react";
import Checklist from "./Checklist";

const Context = createContext();

export const useGlobalContext = () => {
  const context = useContext(Context);
  if (!context) {
    throw new Error('useGlobalContext must be used within a Context.Provider');
  }
  return context;
}

export default function App() {
  // You can add any values your context should provide here, for example translations 't'
  const t = (key) => {
    const translations = {
      toggle_theme: "Toggle theme",
      // add more keys if needed
    };
    return translations[key] || key;
  };

  return (
    <Context.Provider value={{ t }}>
      <Checklist />
    </Context.Provider>
  );
}
