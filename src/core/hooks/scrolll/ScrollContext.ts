import { createContext } from "react";

/**
 * Contexto de React que provee información sobre el estado del scroll.
 *
 * @remarks
 * Este contexto debe ser consumido a través de `useScroll()` dentro de un
 * `ScrollProvider`.
 */
export interface ScrollContextType {
  scrollY: number;
  hasScrolled: boolean;
  atBottom: boolean;
  scrollDirection: "up" | "down" | "none";
  setScrollTarget?: (el: HTMLElement | null) => void;
}

 export  const ScrollContextC = createContext<ScrollContextType>({
  scrollY: 0,
  hasScrolled: false,
  atBottom: false,
  scrollDirection: "none",
});
