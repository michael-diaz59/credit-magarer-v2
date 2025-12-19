import { useForm } from "react-hook-form";
import { signInWithEmailAndPassword } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import type { LoginFormValues } from "../../atomic_design/templates/login/LoginFormValues";
import { auth } from "../../store/firebase/firebase";
import { LoginView } from "../../atomic_design/templates/login/loggin";
import { useEffect } from "react";
import { useAppSelector } from "../../store/redux/coreRedux";

export default function LoginPage() {
  const navigate = useNavigate();
  const user = useAppSelector((state) => state.auth.user);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    defaultValues: {
      email: "",
      password: "",
    },
  });

  useEffect(() => {
    if (user) {
      navigate("/", { replace: true });
    }
  }, [user, navigate]);

  const onSubmit = async (data: LoginFormValues) => {
    await signInWithEmailAndPassword(auth, data.email, data.password);
    navigate("/", { replace: true });
  };

  return (
    <LoginView
      register={register}
      handleSubmit={handleSubmit}
      errors={errors}
      isSubmitting={isSubmitting}
      onSubmit={onSubmit}
    />
  );
}
