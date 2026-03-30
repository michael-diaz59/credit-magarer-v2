import { useEffect, useState } from "react";
import { useAppDispatch, useAppSelector } from "../../../../store/redux/coreRedux";
import type { Route } from "../../../../features/routes/domain/business/entities/Route";
import { RouteOrchestrator } from "../../../../features/routes/domain/infraestructure/RouteOrchestrator";

type Props = {
  getRoutes?: boolean;
  children: (data: {
    routes: Route[];
    loading: boolean;
  }) => React.ReactNode;
};

export const DebtFormDataProvider = ({ children, getRoutes = true }: Props) => {
  const dispatch = useAppDispatch();
  const companyId = useAppSelector(
    (state) => state.user.user?.companyId ?? ""
  );

  const [routes, setRoutes] = useState<Route[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!companyId) return;
    if (!getRoutes) {
      setLoading(false);
      return;
    };

    const loadCollectors = async () => {
      setLoading(true);

      const orchestrator = new RouteOrchestrator();

      const result = await orchestrator.getRoutesUseCase.execute({
        companyId,
      });

      if (result.ok) {
        setRoutes(result.value);
      }

      setLoading(false);
    };

    loadCollectors().catch((error) => {
      console.error("Error cargando rutas", error);
      setLoading(false);
    });
  }, [dispatch, companyId]);

  return <>{children({ routes, loading })}</>;
};