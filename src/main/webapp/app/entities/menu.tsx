// src/main/webapp/app/entities/menu.tsx
import React from 'react';
import MenuItem from 'app/shared/layout/menus/menu-item';

// Это — только автогенерируемые пункты для сущностей JHipster.
// НИКАКИХ NavDropdown, никаких useAppSelector, никаких hasAnyAuthority.
const EntitiesMenuItems = () => (
  <>
    <MenuItem icon="asterisk" to="/warehouse">
      Warehouse
    </MenuItem>
    <MenuItem icon="asterisk" to="/product-category">
      Product Category
    </MenuItem>
    <MenuItem icon="asterisk" to="/mechanic-tile">
      Mechanic Tile
    </MenuItem>

    {/* jhipster-needle-add-entity-to-menu - JHipster will add entities to the menu here */}
  </>
);

export default EntitiesMenuItems;
