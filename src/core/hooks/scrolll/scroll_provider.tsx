import React, { useCallback } from "react";
import { useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import { ScrollContextC } from "./ScrollContext";

/**
 * Define la estructura de los valores compartidos por el ScrollContext.
 */
export interface ScrollContextType {
  /**
   * Posición vertical actual del scroll en píxeles.
   *
   * @example
   * // Si el usuario ha bajado 250 píxeles:
   * scrollY === 250
   */
  scrollY: number;

  /**
   * Indica si el usuario ya hizo scroll más allá de 5px).
   *
   * @remarks
   * Esto permite activar transiciones o animaciones solo cuando
   * el usuario ha comenzado a desplazarse.
   */
  hasScrolled: boolean;

  /**
   * Indica si el usuario llego al final de la pagina.
   *
   * @remarks
   * Esto permite activar transiciones o animaciones solo cuando
   * el usuario ha llegado al final de la pagina.
   */
  atBottom: boolean;

  /**
   * Dirección actual del desplazamiento vertical.
   *
   * - `"up"` → El usuario se está desplazando hacia arriba.
   * - `"down"` → El usuario se está desplazando hacia abajo.
   * - `"none"` → No hay movimiento detectado.
   *
   * @defaultValue "none"
   */
  scrollDirection: "up" | "down" | "none";
  setScrollTarget?: (el: HTMLElement | null) => void; // 👈 nuevo
}

/**
 * Contexto de React que provee información sobre el estado del scroll.
 *
 * @remarks
 * Este contexto debe ser consumido a través de `useScroll()` dentro de un
 * `ScrollProvider`.
 */


/**
 * Proveedor que gestiona el estado del scroll y lo expone a los componentes hijos
 * mediante el `ScrollContext`.
 *
 * @param props.children Componentes que tendrán acceso al contexto del scroll.
 *
 * @example
 * ```tsx
 * <ScrollProvider>
 *   <App />
 * </ScrollProvider>
 * ```
 */
export const ScrollProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const targetRef = React.useRef<HTMLElement | null>(null);

  const [scrollY, setScrollY] = useState(0);
  const location = useLocation();
  const [hasScrolled, setHasScrolled] = useState(false);
  const [atBottom, setAtBottom] = useState(false);
  const [scrollDirection, setScrollDirection] = useState<
    "up" | "down" | "none"
  >("none");

  // Guardamos la posición previa para detectar dirección
  const prevScrollY = React.useRef(0);

  const ticking = React.useRef(false);

  /**
   * Listener optimizado que actualiza el estado del scroll.
   */
  const handleScroll = useCallback((target: HTMLElement) => {
    const currentY = target.scrollTop;
    const clientHeight = target.clientHeight;
    const scrollHeight = target.scrollHeight;

    if (!ticking.current) {
      ticking.current = true;
      requestAnimationFrame(() => {
        setScrollY(currentY);
        setHasScrolled(currentY > 120);
        setAtBottom(currentY + clientHeight >= scrollHeight - 200);

        if (currentY > prevScrollY.current) {
          setScrollDirection("down");
        } else if (currentY < prevScrollY.current) {
          setScrollDirection("up");
        } else {
          setScrollDirection("none");
        }

        prevScrollY.current = currentY;
        ticking.current = false;
      });
    }
  }, []);
  // 👇 función estable para pasar al add/removeEventListener
  const onScroll = useCallback(() => {
    if (targetRef.current) handleScroll(targetRef.current);
  }, [handleScroll]);

  // 👇 función pública para cambiar el elemento observado
  const setScrollTarget = useCallback(
    (el: HTMLElement | null) => {
      // Limpia el anterior
      if (targetRef.current) {
        targetRef.current.removeEventListener("scroll", onScroll);
      }

      // Actualiza referencia
      targetRef.current = el;

      // Si hay nuevo main, escucha su scroll
      if (el) {
        el.addEventListener("scroll", onScroll, { passive: true });
        const currentY = el.scrollTop;
        prevScrollY.current = currentY;
        setScrollY(currentY);
        setHasScrolled(currentY > 120);
        const clientHeight = el.clientHeight;
        const scrollHeight = el.scrollHeight;
        setAtBottom(currentY + clientHeight >= scrollHeight - 200);
      }
    },
    [onScroll] // depende del listener estable
  );

  useEffect(() => {
    // 👇 Cuando cambie la ruta, vuelve a evaluar el scroll actual
    onScroll();
  }, [location, onScroll]);

  // Limpieza global al desmontar el provider
  useEffect(() => {
    return () => {
      if (targetRef.current)
        targetRef.current.removeEventListener("scroll", onScroll);
    };
  }, [onScroll]);

  return (
    <ScrollContextC.Provider
      value={{
        scrollY,
        hasScrolled,
        atBottom,
        scrollDirection,
        setScrollTarget,
      }}
    >
      {children}
    </ScrollContextC.Provider>
  );
};


