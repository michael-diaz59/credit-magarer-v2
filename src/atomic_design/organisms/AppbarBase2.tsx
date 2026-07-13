import { accountantAppBar, basphatsAppBar, collectorAppBar, officeAdvisorAppBar } from "../../core/helpers/name_routes";
import { AppBarBaseC } from "../molecules/AppBarBaseC";

const AppbarBase2 = () => {
  return <AppBarBaseC items={basphatsAppBar} />;
};


export default AppbarBase2;


const CollectorAppBar = () => {
  return <AppBarBaseC items={collectorAppBar} />;
};

export { CollectorAppBar };

const EmptyAppBar = () => {
  return <AppBarBaseC items={[]} />;
};

export { EmptyAppBar };


const OfficeAdvisorAppBar = () => {
  return <AppBarBaseC items={officeAdvisorAppBar} />;
};

export { OfficeAdvisorAppBar };

const AccountantAppBar = () => {
  return <AppBarBaseC items={accountantAppBar} />;
};

export { AccountantAppBar };
