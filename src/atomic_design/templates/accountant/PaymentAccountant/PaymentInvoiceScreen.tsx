import { usePaymentInvoice } from "./usePaymentInvoice";
import { PaymentInvoiceView } from "./PaymentInvoiceView";


export const PaymentInvoiceScreen = () => {
    const {
        payment,
        saveAccountantObservation,
        applyDescuadre,
        isLoading,
    } = usePaymentInvoice();

    return (
        <PaymentInvoiceView
            payment={payment}
            isLoading={isLoading}
            onSaveObservation={saveAccountantObservation}
            onDescuadre={applyDescuadre}
        />
    );
};