import { useAppSelector } from "../../../store/redux/coreRedux";


export const useDebtPermissions = () => {
  const role = useAppSelector(
    (state) => state.user.user?.roles
  );

  return {
    canEditDebt:
      role && (role.includes("OFFICE_ADVISOR")),
  };
};
