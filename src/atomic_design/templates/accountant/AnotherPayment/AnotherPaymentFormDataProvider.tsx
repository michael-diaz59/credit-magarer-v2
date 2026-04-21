import React, { useEffect, useState } from "react";
import { useAppSelector } from "../../../../store/redux/coreRedux";
import BankAccountOrchestrator from "../../../../features/bankAccounts/domain/infraestructure/BankAccountOrchestrator";
import type { BankAccount } from "../../../../features/bankAccounts/domain/business/entities/BankAccount";

type Props = {
  children: (data: {
    bankAccounts: BankAccount[];
    loading: boolean;
  }) => React.ReactNode;
};

export const AnotherPaymentFormDataProvider = ({ children }: Props) => {
  const companyId = useAppSelector((state) => state.user.user?.companyId ?? "");

  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!companyId) return;

    const loadBankAccounts = async () => {
      setLoading(true);
      const orchestrator = new BankAccountOrchestrator();
      const result = await orchestrator.getAll({ companyId });

      if (result.ok) {
        setBankAccounts(result.value.bankAccounts);
      }
      setLoading(false);
    };

    loadBankAccounts().catch((error) => {
      console.error("Error loading bank accounts", error);
      setLoading(false);
    });
  }, [companyId]);

  return <>{children({ bankAccounts, loading })}</>;
};
