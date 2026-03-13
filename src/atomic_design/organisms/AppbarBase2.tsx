import { basphatsAppBar, collectorAppBar } from "../../core/helpers/name_routes";
import { AppBarBaseC } from "../molecules/AppBarBaseC";

const AppbarBase2 = () => {
  return <AppBarBaseC items={basphatsAppBar} />;
};

export default AppbarBase2;


const CollectorAppBar = () => {
  return <AppBarBaseC items={collectorAppBar} />;
};

export { CollectorAppBar };
