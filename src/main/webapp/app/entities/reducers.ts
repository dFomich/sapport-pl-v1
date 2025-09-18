import warehouse from './warehouse/warehouse.reducer';
import productCategory from './product-category/product-category.reducer';
import mechanicTile from './mechanic-tile/mechanic-tile.reducer';

/**
 * Набор редьюсеров сущностей. Он разворачивается в корень стора
 * в shared/reducers/index.ts через `...entitiesReducers`.
 */
const entitiesReducers = {
  warehouse,
  productCategory,
  mechanicTile,
  // jhipster-needle-add-reducer-combine - JHipster will add reducer here
};

export default entitiesReducers;
