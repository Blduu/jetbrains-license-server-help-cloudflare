export type ProductRowFromJson = {
  name: string;
  productCode: string;
  iconClass: string;
};

export type PluginRowFromJson = {
  id: number;
  productCode: string;
  name: string;
  pricingModel: string;
  icon: string;
  description?: string;
};
