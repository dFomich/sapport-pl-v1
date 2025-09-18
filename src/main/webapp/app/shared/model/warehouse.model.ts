import { IMechanicTile } from 'app/shared/model/mechanic-tile.model';

export interface IWarehouse {
  id?: number;
  code?: string;
  name?: string | null;
  active?: boolean;
  tiles?: IMechanicTile[] | null;
}

export const defaultValue: Readonly<IWarehouse> = {
  active: false,
};
