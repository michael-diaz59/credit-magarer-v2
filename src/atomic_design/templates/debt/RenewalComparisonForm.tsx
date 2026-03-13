import { Button, MenuItem, Stack, TextField, Grid, Typography, Box } from "@mui/material";
import {
    debtStatusList,
    type Debt,
    type DebtType,
} from "../../../features/debits/domain/business/entities/Debt";
import type { DebtFormMode } from "./DebtFormMode";
import { Controller, useForm } from "react-hook-form";
import { useEffect, useState } from "react";
import UserOrchestrator from "../../../features/users/domain/infraestructure/UserOrchestrator";
import { useAppDispatch, useAppSelector } from "../../../store/redux/coreRedux";
import type { User } from "../../../features/users/domain/business/entities/User";
import { useNavigate } from "react-router-dom";
import { ScreenPaths } from "../../../core/helpers/name_routes";
import { textFieldSX } from "../../atoms/textFieldSX";

export type DebtFormAction = "create" | "update" | "preApprove";

export type RenewalComparisonFormProps = {
    debtId: string;
    originalDebt: Omit<Debt, "id">;
    proposedDebt: Omit<Debt, "id">;
    mode: DebtFormMode;
    onSubmit: (action: DebtFormAction, data: Omit<Debt, "id">) => void;
};



const debtTypes: DebtType[] = ["credito", "prenda"];

export const RenewalComparisonForm = ({
    debtId,
    originalDebt,
    proposedDebt,
    mode,
    onSubmit,
}: RenewalComparisonFormProps) => {
    const navigate = useNavigate();
    const readOnly = mode === "view";
    const canEditStatus = mode === "audit" || mode === "admin";

    const dispatch = useAppDispatch();
    const companyId = useAppSelector((state) => state.user.user?.companyId ?? "");

    const [collectors, setCollectors] = useState<User[]>([]);

    const {
        register,
        handleSubmit,
        control,
        formState: { errors },
    } = useForm<Omit<Debt, "id">>({
        defaultValues: originalDebt,
    });

    useEffect(() => {
        if (!companyId) return;

        const loadCollectors = async (): Promise<void> => {
            const orchestrator = new UserOrchestrator(dispatch);
            const result = await orchestrator.getUsersByCompany({
                id: companyId,
                rol: "COLLECTOR",
            });

            if (result.state.ok) {
                setCollectors(result.state.value);
            }
        };

        loadCollectors().catch((error: unknown) => {
            console.error("Error cargando cobradores", error);
        });
    }, [dispatch, companyId]);

    const ComparisonValue = ({ value }: { value: any }) => (
        <Typography variant="caption" sx={{ color: "error.main", mt: -1, ml: 1, fontWeight: "bold" }}>
            Propuesta: {value?.toString() || "N/A"}
        </Typography>
    );

    return (
        <form
            onSubmit={handleSubmit((data) => {
                onSubmit("update", {
                    ...proposedDebt,
                    ...data,
                    status: "activa",
                });
            })}
        >
            <Grid container spacing={2}>
                {/* SECCION 1 */}
                <Grid>
                    <Stack spacing={3}>
                        {/* STATUS */}
                        {canEditStatus && (
                            <Box>
                                <Controller
                                    name="status"
                                    control={control}
                                    rules={{ required: "El estado es obligatorio" }}
                                    render={({ field }) => (
                                        <TextField
                                            {...field}
                                            sx={textFieldSX}
                                            select
                                            label="Estado"
                                            fullWidth
                                            error={!!errors.status}
                                            helperText={errors.status?.message}
                                        >
                                            {debtStatusList.map((status) => (
                                                <MenuItem key={status} value={status}>
                                                    {status}
                                                </MenuItem>
                                            ))}
                                        </TextField>
                                    )}
                                />
                                <ComparisonValue value={proposedDebt.status} />
                            </Box>
                        )}

                        {/* COBRADOR */}
                        <Box>
                            <Controller
                                name="collectorId"
                                control={control}
                                rules={{ required: "Debe asignar un cobrador" }}
                                render={({ field }) => (
                                    <TextField
                                        {...field}
                                        value={collectors.some((c) => c.id === field.value) ? field.value : ""}
                                        select
                                        sx={textFieldSX}
                                        label="Cobrador asignado"
                                        fullWidth
                                        error={!!errors.collectorId}
                                        helperText={errors.collectorId?.message}
                                    >
                                        {collectors.map((collector) => (
                                            <MenuItem key={collector.id} value={collector.id}>
                                                {collector.name}
                                            </MenuItem>
                                        ))}
                                    </TextField>
                                )}
                            />
                            <ComparisonValue
                                value={collectors.find(c => c.id === proposedDebt.collectorId)?.name || proposedDebt.collectorId}
                            />
                        </Box>

                        {/* CÉDULA */}
                        <Box>
                            <TextField
                                label="Cédula del cliente"
                                fullWidth
                                sx={textFieldSX}
                                disabled
                                error={!!errors.costumerDocument}
                                helperText={errors.costumerDocument?.message}
                                {...register("costumerDocument")}
                            />
                            <ComparisonValue value={proposedDebt.costumerDocument} />
                        </Box>
                    </Stack>
                </Grid>

                {/* SECCION 2 */}
                <Grid>
                    <Stack spacing={3}>
                        {/* TIPO */}
                        <Box>
                            <Controller
                                name="type"
                                control={control}
                                rules={{ required: "El tipo es obligatorio" }}
                                render={({ field }) => (
                                    <TextField
                                        {...field}
                                        select
                                        label="Tipo"
                                        fullWidth
                                        sx={textFieldSX}
                                        disabled={mode === "view"}
                                        error={!!errors.type}
                                        helperText={errors.type?.message}
                                    >
                                        {debtTypes.map((type) => (
                                            <MenuItem key={type} value={type}>
                                                {type}
                                            </MenuItem>
                                        ))}
                                    </TextField>
                                )}
                            />
                            <ComparisonValue value={proposedDebt.type} />
                        </Box>

                        {/* MONTO */}
                        <Box>
                            <TextField
                                label="Monto capital"
                                type="number"
                                fullWidth
                                disabled={mode === "view"}
                                sx={textFieldSX}
                                error={!!errors.totalAmount}
                                helperText={errors.totalAmount?.message}
                                {...register("totalAmount", {
                                    valueAsNumber: true,
                                    required: "Monto obligatorio",
                                })}
                            />
                            <ComparisonValue value={proposedDebt.totalAmount} />
                        </Box>

                        <Box>
                            <Controller
                                name="debtTerms"
                                control={control}
                                rules={{ required: "Periodicidad obligatoria" }}
                                render={({ field }) => (
                                    <TextField
                                        {...field}
                                        select
                                        label="Periodicidad"
                                        fullWidth
                                        sx={textFieldSX}
                                        disabled={mode === "view"}
                                        error={!!errors.debtTerms}
                                        helperText={errors.debtTerms?.message}
                                    >
                                        <MenuItem value="diario">Diario</MenuItem>
                                        <MenuItem value="semanal">Semanal</MenuItem>
                                        <MenuItem value="quincenal">Quincenal</MenuItem>
                                        <MenuItem value="mensual">Mensual</MenuItem>
                                    </TextField>
                                )}
                            />
                            <ComparisonValue value={proposedDebt.debtTerms} />
                        </Box>
                    </Stack>
                </Grid>

                {/* SECCION 3 */}
                <Grid>
                    <Stack spacing={3}>
                        {/* Tasa de inters */}
                        <Box>
                            <TextField
                                label="Tasa de interes %"
                                type="number"
                                fullWidth
                                sx={textFieldSX}
                                disabled={mode === "view"}
                                error={!!errors.interestRate}
                                helperText={errors.interestRate?.message}
                                {...register("interestRate", {
                                    valueAsNumber: true,
                                    required: "Tasa obligatoria",
                                })}
                            />
                            <ComparisonValue value={proposedDebt.interestRate} />
                        </Box>

                        {/*numero de cuotas*/}
                        <Box>
                            <TextField
                                label="Número de cuotas"
                                type="number"
                                sx={textFieldSX}
                                fullWidth
                                disabled={mode === "view"}
                                error={!!errors.installmentCount}
                                helperText={errors.installmentCount?.message}
                                {...register("installmentCount", {
                                    valueAsNumber: true,
                                    required: "Cuotas obligatorias",
                                })}
                            />
                            <ComparisonValue value={proposedDebt.installmentCount} />
                        </Box>

                        {/* FECHA */}
                        <Box>
                            <TextField
                                label="Fecha de inicio"
                                type="date"
                                sx={textFieldSX}
                                fullWidth
                                InputLabelProps={{ shrink: true }}
                                error={!!errors.startDate}
                                helperText={errors.startDate?.message}
                                {...register("startDate", {
                                    required: "Fecha obligatoria",
                                })}
                            />
                            <ComparisonValue value={proposedDebt.startDate} />
                        </Box>
                    </Stack>
                </Grid>
            </Grid>

            {/* ACTION BUTTONS */}
            <Stack direction="row" spacing={2} justifyContent="flex-end" mt={3}>
                {!readOnly && (
                    <Button type="submit" variant="contained" color="primary">
                        Aprobar Renovación
                    </Button>
                )}
                {debtId && (
                    <Button
                        variant="outlined"
                        color="info"
                        onClick={() => navigate(ScreenPaths.auditor.installments(debtId))}
                    >
                        Ver todas las cuotas
                    </Button>
                )}
            </Stack>
        </form>
    );
};
