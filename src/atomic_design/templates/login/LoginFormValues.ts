// login/useLoginForm.ts
import { useForm } from "react-hook-form";
import { loginWithEmail } from "./loginWithEmailFirebase";
import { FirebaseError } from "firebase/app";

export interface LoginFormValues {
    email: string;
    password: string;
}

export function useLoginForm() {
    const {
        register,
        handleSubmit,
        setError,
        formState: { errors, isSubmitting },
    } = useForm<LoginFormValues>();

    const onSubmit = async (data: LoginFormValues) => {
        try {
            await loginWithEmail(data.email, data.password);
            // 👉 aquí luego rediriges al dashboard
        } catch (error) {
            // Manejo de errores Firebase
            if (!(error instanceof FirebaseError)) {
                setError("email", { message: "Unexpected error" });
                return;
            }

            switch (error.code) {
                case "auth/invalid-credential":
                    setError("password", { message: "Invalid email or password" });
                    break;
                default:
                    setError("email", { message: error.message });
            }
        }
    };

    return {
        register,
        handleSubmit,
        errors,
        isSubmitting,
        onSubmit,
    };
}