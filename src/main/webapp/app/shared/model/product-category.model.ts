import { IMechanicTile } from 'app/shared/model/mechanic-tile.model';

export interface IProductCategory {
  id?: number;
  name?: string;
  active?: boolean;
  tiles?: IMechanicTile[] | null;
}

export const defaultValue: Readonly<IProductCategory> = {
  active: false,
};
