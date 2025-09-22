import FarmerTable from './FarmerTable';
import FeatureInspector from './FeatureInspector';
import LayerLegend from './LayerLegend';

const SidebarPanels = () => (
  <div className="space-y-6">
    <FarmerTable />
    <FeatureInspector />
    <LayerLegend />
  </div>
);

export default SidebarPanels;
