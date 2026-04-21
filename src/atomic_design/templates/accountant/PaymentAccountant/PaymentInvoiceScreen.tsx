import { usePaymentInvoice } from "./usePaymentInvoice";
import { PaymentInvoiceView } from "./PaymentInvoiceView";


export const PaymentInvoiceScreen = () => {
    const {
        payment,
        saveAccountantObservation,
        applyDescuadre,
        changePaymentRoute,
        routes,
        isLoading,
        companyId,
    } = usePaymentInvoice();

    return (
        <PaymentInvoiceView
            payment={payment}
            routes={routes}
            isLoading={isLoading}
            onSaveObservation={saveAccountantObservation}
            onDescuadre={applyDescuadre}
            onChangeRoute={changePaymentRoute}
            companyId={companyId}
        />
    );
};