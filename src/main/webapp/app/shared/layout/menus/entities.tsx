// src/main/webapp/app/shared/layout/menus/entities.tsx
import React from 'react';
import { translate } from 'react-jhipster';
import { useAppSelector } from 'app/config/store';
import { hasAnyAuthority } from 'app/shared/auth/private-route';
import { AUTHORITIES } from 'app/config/constants';
import { NavDropdown } from './menu-components';
import MenuItem from './menu-item';
import EntitiesMenuItems from 'app/entities/menu';

const EntitiesMenu = () => {
  const isAuthenticated = useAppSelector(s => s.authentication.isAuthenticated);
  const authorities = useAppSelector(s => s.authentication.account?.authorities || []);

  const canSeeWarehouse = isAuthenticated && hasAnyAuthority(authorities, [AUTHORITIES.WAREHOUSEMAN, AUTHORITIES.SENIOR_WAREHOUSEMAN]);

  const canSeeMechanicCatalog =
    isAuthenticated &&
    hasAnyAuthority(authorities, [AUTHORITIES.MECHANIC, AUTHORITIES.SENIOR_MECHANIC, AUTHORITIES.MANAGER, AUTHORITIES.SENIOR_MANAGER]);

  const canManageTiles = isAuthenticated && hasAnyAuthority(authorities, [AUTHORITIES.ADMIN, AUTHORITIES.SENIOR_WAREHOUSEMAN]);

  const isAdmin = isAuthenticated && hasAnyAuthority(authorities, [AUTHORITIES.ADMIN]);

  const canSeeWarehouseCatalog = isAuthenticated && hasAnyAuthority(authorities, [AUTHORITIES.SENIOR_WAREHOUSEMAN]);
  const canManageNews = isAuthenticated && hasAnyAuthority(authorities, [AUTHORITIES.ADMIN, AUTHORITIES.SENIOR_WAREHOUSEMAN]);
  const canManageGallery = isAuthenticated && hasAnyAuthority(authorities, [AUTHORITIES.ADMIN, AUTHORITIES.SENIOR_WAREHOUSEMAN]);

  return (
    <NavDropdown
      icon="th-list"
      name={translate('global.menu.entities.main')}
      id="entity-menu"
      data-cy="entity"
      style={{ maxHeight: '80vh', overflow: 'auto' }}
    >
      {canSeeWarehouse && (
        <>
          <MenuItem icon="upload" to="/inventory/upload">
            Загрузка остатков
          </MenuItem>
          <MenuItem icon="boxes-stacked" to="/inventory/stock">
            Остатки склада
          </MenuItem>
          <MenuItem icon="clipboard-list" to="/warehouse/orders">
            Заявки на выдачу
          </MenuItem>
        </>
      )}

      {canManageGallery && (
        <MenuItem icon="image" to="/gallery-management">
          Управление галереей
        </MenuItem>
      )}

      {canManageNews && (
        <MenuItem icon="bullhorn" to="/news-management">
          Управление новостями
        </MenuItem>
      )}

      {canSeeWarehouseCatalog && (
        <MenuItem icon="truck" to="/warehouse/catalog">
          Витрина механика
        </MenuItem>
      )}

      {canSeeMechanicCatalog && (
        <>
          <MenuItem icon="truck" to="/mechanic/catalog">
            Витрина механика
          </MenuItem>
          <MenuItem icon="list" to="/mechanic/my-orders">
            Мои заявки
          </MenuItem>
        </>
      )}

      {canManageTiles && (
        <MenuItem icon="th-large" to="/mechanic-tile">
          Управление плитками
        </MenuItem>
      )}

      {isAdmin && <EntitiesMenuItems />}
      {/* Все автогенерированные CRUD-меню остаются только админу */}
    </NavDropdown>
  );
};

export default EntitiesMenu;
