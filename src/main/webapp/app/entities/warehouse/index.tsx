import React from 'react';
import { Route } from 'react-router';

import ErrorBoundaryRoutes from 'app/shared/error/error-boundary-routes';

import Warehouse from './warehouse';
import WarehouseDetail from './warehouse-detail';
import WarehouseUpdate from './warehouse-update';
import WarehouseDeleteDialog from './warehouse-delete-dialog';

const WarehouseRoutes = () => (
  <ErrorBoundaryRoutes>
    <Route index element={<Warehouse />} />
    <Route path="new" element={<WarehouseUpdate />} />
    <Route path=":id">
      <Route index element={<WarehouseDetail />} />
      <Route path="edit" element={<WarehouseUpdate />} />
      <Route path="delete" element={<WarehouseDeleteDialog />} />
    </Route>
  </ErrorBoundaryRoutes>
);

export default WarehouseRoutes;
