import { FormProvider, useForm } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { LoginView } from "../../atomic_design/templates/login/loggin";
import { useEffect, useMemo } from "react";
import { useAppDispatch, useAppSelector } from "../../store/redux/coreRedux";
import AuthOrchestrator from "../../features/userAuthentication/domain/infraestructure/AuthOrchestrator";

export interface LoginFormValues {
    email: string;
    password: string;
}

//controller de la pagina de login
export default function LoginPage() {
  const navigate = useNavigate();
  const user = useAppSelector((state) => state.auth.user);
  const dispatch = useAppDispatch();

  const authOrchestrator = useMemo(
    () => new AuthOrchestrator(dispatch),
    [dispatch]
  );

  // useForm crea el formulario
  const form = useForm<LoginFormValues>({
    defaultValues: {
      email: "",
      password: "",
    },
  });

  useEffect(() => {
    if (user) navigate("/", { replace: true });
  }, [user, navigate]);

  const onSubmit = async (data: LoginFormValues) => {
    const success = await authOrchestrator.login(data);
    if (success) navigate("/", { replace: true });
  };

  return (
    // con FormProvider expongo al contexto de la app el form/LoginFormValues
    <FormProvider {...form}>
      <LoginView onSubmit={onSubmit} />
    </FormProvider>
  );
}
