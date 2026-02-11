import { Outlet } from "react-router-dom";
import { Box } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { useEffect, useRef } from "react";
import { useScroll } from "../../core/hooks/scrolll/useScroll";
import { CustomSx } from "../../atomic_design/sub_atomic_particles/Custom_sx";
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import FloatAppBar from "../../atomic_design/organisms/float_app_bar";

export default function Layout() {
  const theme = useTheme();
  const mainRef = useRef<HTMLElement>(null);

  const { setScrollTarget } = useScroll();

  useEffect(() => {
    if (mainRef.current && setScrollTarget) {
      setScrollTarget(mainRef.current);
      // Cuando el layout se desmonta, limpia el listener
      return () => setScrollTarget(null);
    }
  }, [setScrollTarget]);

  return (
    <Box display="flex" flexDirection="column" height="100vh">
      <Box
        component="main"
        ref={mainRef}
        flex={1}
        display="flex"
        flexDirection="column"
        height="100vh"
        overflow="auto"
      >
        <Box
          height={CustomSx.header.height}
          sx={{
            backgroundColor: theme.palette.background.default,
            flexShrink: 0, // evita que se colapse con otros elementos
          }}
        ></Box>
        <FloatAppBar/>

        <Box flex={1}>
          <Outlet /> {/* Aquí se renderiza tu página */}
        </Box>
      </Box>
    </Box>
  );
}
