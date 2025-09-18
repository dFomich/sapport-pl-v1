import React from 'react';
import { Route } from 'react-router-dom';
import ErrorBoundaryRoutes from 'app/shared/error/error-boundary-routes';

// entity route groups
import WarehouseRoutes from './warehouse';
import ProductCategoryRoutes from './product-category';
import MechanicTileRoutes from './mechanic-tile';

const EntitiesRoutes = () => (
  <ErrorBoundaryRoutes>
    <Route path="warehouse/*" element={<WarehouseRoutes />} />
    <Route path="product-category/*" element={<ProductCategoryRoutes />} />
    <Route path="mechanic-tile/*" element={<MechanicTileRoutes />} />
    {/* jhipster-needle-add-route - JHipster will add routes here */}
  </ErrorBoundaryRoutes>
);

export default EntitiesRoutes;
