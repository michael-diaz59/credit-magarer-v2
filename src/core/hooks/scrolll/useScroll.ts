import React from "react";
import type { ScrollContextType } from "./scroll_provider";
import { ScrollContextC } from "./ScrollContext";

/**
 * Hook que simplifica el acceso al `ScrollContext`.
 *
 * @returns El estado actual del scroll (`scrollY`, `hasScrolled`, `scrollDirection`).
 *
 * @example
 * ```tsx
 * const { scrollY, hasScrolled, scrollDirection } = useScroll();
 *
 * return <p>Scroll actual: {scrollY}px</p>;
 * ```
 */
export const useScroll = (): ScrollContextType => {
  const context = React.useContext(ScrollContextC);
  return context;
};