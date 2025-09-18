import { IProductCategory } from 'app/shared/model/product-category.model';
import { IWarehouse } from 'app/shared/model/warehouse.model';

export interface IMechanicTile {
  id?: number;
  title?: string;
  comment?: string | null;
  materialCode?: string;
  imageUrl?: string | null;
  active?: boolean;
  categories?: IProductCategory[] | null;
  warehouses?: IWarehouse[] | null;
}

export const defaultValue: Readonly<IMechanicTile> = {
  active: false,
};
