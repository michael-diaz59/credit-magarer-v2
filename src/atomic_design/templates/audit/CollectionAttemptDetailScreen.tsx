import { useEffect, useState } from "react";
import {
    Box,
    Button,
    CircularProgress,
    Divider,
    Stack,
    Typography,
} from "@mui/material";
import { useNavigate, useParams } from "react-router-dom";
import { useAppSelector } from "../../../store/redux/coreRedux";
import { CollectionAttemptOrchestrator } from "../../../features/debits/domain/infraestructure/CollectionAttemptOrchestrator";
import type { CollectionAttempt } from "../../../features/debits/domain/business/entities/CollectionAttempt";
import { MiniMap } from "../../organisms/MiniMap";

export const CollectionAttemptDetailScreen = () => {
    const { attemptId } = useParams<{ attemptId: string }>();
    const navigate = useNavigate();
    const companyId = useAppSelector((state) => state.user.user?.companyId) ?? "";

    const [loading, setLoading] = useState(true);
    const [attempt, setAttempt] = useState<CollectionAttempt | null>(null);

    useEffect(() => {
        if (!attemptId || !companyId) return;

        const fetchAttempt = async () => {
            try {
                setLoading(true);
                const orchestrator = new CollectionAttemptOrchestrator();
                const result = await orchestrator.getAttemptById(companyId, attemptId);

                if (result.ok) {
                    setAttempt(result.value);
                }
            } catch (error) {
                console.error("Error cargando intento de cobro", error);
            } finally {
                setLoading(false);
            }
        };

        fetchAttempt();
    }, [attemptId, companyId]);

    if (loading) return (
        <Box display="flex" justifyContent="center" alignItems="center" height="100vh">
            <CircularProgress />
        </Box>
    );

    if (!attempt) {
        return <Typography p={3}>No se encontró el intento de cobro</Typography>;
    }

    return (
        <Box p={3}>
            <Typography variant="h5" mb={1}>{attempt.name}</Typography>
            <Typography variant="subtitle2" color="text.secondary" mb={2}>Detalle de Intento de Cobro</Typography>

            <Divider sx={{ mb: 2 }} />

            <Stack spacing={2}>
                <Typography><strong>ID de Deuda:</strong> {attempt.debtId}</Typography>
                <Typography><strong>ID de Cliente:</strong> {attempt.customerId}</Typography>
                <Typography><strong>ID de Cobrador:</strong> {attempt.collectorId}</Typography>
                <Typography><strong>Fecha:</strong> {attempt.date}</Typography>

                <Box>
                    <Typography variant="subtitle1" fontWeight={600}>Descripción del Cobrador:</Typography>
                    <Typography color="text.secondary">{attempt.colletorDescription || "Sin descripción"}</Typography>
                </Box>

                {attempt.auditorDescription && (
                    <Box>
                        <Typography variant="subtitle1" fontWeight={600}>Descripción del Auditor:</Typography>
                        <Typography color="text.secondary">{attempt.auditorDescription}</Typography>
                    </Box>
                )}
            </Stack>

            {attempt.location && (
                <>
                    <Divider sx={{ my: 3 }} />
                    <Typography variant="h6" mb={2}>Ubicación del Intento</Typography>
                    <MiniMap
                        latitude={attempt.location.latitude || 0}
                        longitude={attempt.location.longitude || 0}
                    />
                </>
            )}

            <Stack direction="row" spacing={2} mt={4}>
                <Button variant="outlined" onClick={() => navigate(-1)}>Volver</Button>
            </Stack>
        </Box>
    );
};
