import { Card, Typography } from "@mui/material";
import type { SimulateDebtOutput } from "../../features/debits/domain/business/useCases/debt/SimulateDebtCase";
import { MoneyTypography } from "../atoms/MoneyTypography";
import { SectionInstallments } from "./SectionInstallments";

type Props = {
    data: SimulateDebtOutput;
};

export function SimulateDebtResultCard({ data }: Props) {
    if (!data || data.capital <= 0) return null;

    return (
        <>
            <Card sx={{ mt: 2, p: 2, backgroundColor: "#f5f5f5" }}>
                <Typography variant="h6">Resultado de la simulación</Typography>

                <MoneyTypography
                    label="Total capital + interés:"
                    value={data.totalAmount}
                />

                <MoneyTypography
                    label="Valor de cuotas:"
                    value={data.valueOfInstallments}
                />

                <MoneyTypography
                    label="Valor de cuotas redondeadas:"
                    value={data.pago_cuota_reound}
                />

                <Typography>
                    El número de cuotas sin aproximar es {data.totalInstallments}
                </Typography>

                <Typography>
                    El número de cuotas al aproximar{" "}
                    {data.totalInstallments - data.cuotasCompletas}
                </Typography>

                <MoneyTypography
                    label="Valor de la última cuota:"
                    value={data.pago_ultima_cuota}
                />
            </Card>
            <SectionInstallments installments={data.installments} title="cuotas" color="success" onClick={() => { }} />
        </>
    );
}