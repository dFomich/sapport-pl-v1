import React from 'react';
import { Route } from 'react-router';

import ErrorBoundaryRoutes from 'app/shared/error/error-boundary-routes';

import MechanicTile from './mechanic-tile';
import MechanicTileDetail from './mechanic-tile-detail';
import MechanicTileUpdate from './mechanic-tile-update';

import MechanicTileDeleteDialog from './mechanic-tile-delete-dialog';

const MechanicTileRoutes = () => (
  <ErrorBoundaryRoutes>
    <Route index element={<MechanicTile />} />
    <Route path="new" element={<MechanicTileUpdate />} />
    <Route path=":id">
      <Route index element={<MechanicTileDetail />} />
      <Route path="edit" element={<MechanicTileUpdate />} />
      <Route path="delete" element={<MechanicTileDeleteDialog />} />
    </Route>
  </ErrorBoundaryRoutes>
);

export default MechanicTileRoutes;
