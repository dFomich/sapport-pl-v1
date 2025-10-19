// src/main/webapp/app/routes.tsx
import React from 'react';
import { Route } from 'react-router';

import Loadable from 'react-loadable';
import WarehouseOrders from 'app/modules/warehouse/warehouse-orders';
import MyOrders from 'app/modules/mechanic/my-orders';

import MechanicCatalog from 'app/modules/mechanic/mechanic-catalog';
import { CartProvider } from 'app/modules/mechanic/cart-context';
import OrderSuccess from 'app/modules/mechanic/order-success';

import InventoryUpload from 'app/modules/inventory/inventory-upload';
import InventoryStock from 'app/modules/inventory/inventory-stock';
import Login from 'app/modules/login/login';
import Register from 'app/modules/account/register/register';
import Activate from 'app/modules/account/activate/activate';
import PasswordResetInit from 'app/modules/account/password-reset/init/password-reset-init';
import PasswordResetFinish from 'app/modules/account/password-reset/finish/password-reset-finish';
import Logout from 'app/modules/login/logout';

import PrivateRoute from 'app/shared/auth/private-route';
import ErrorBoundaryRoutes from 'app/shared/error/error-boundary-routes';
import PageNotFound from 'app/shared/error/page-not-found';
import WarehouseCatalog from 'app/modules/warehouse/warehouse-catalog';
import WelcomePage from 'app/modules/welcome/WelcomePage';
import MechanicHomePage from 'app/modules/homepages/MechanicHomePage';
import SeniorMechanicHomePage from 'app/modules/homepages/SeniorMechanicHomePage';
import WarehousemanHomePage from 'app/modules/homepages/WarehousemanHomePage';
import SeniorWarehousemanHomePage from 'app/modules/homepages/SeniorWarehousemanHomePage';
import AdminHomePage from 'app/modules/homepages/AdminHomePage';
import RoleRedirect from 'app/shared/auth/role-redirect';
import NewsManagementPage from 'app/modules/homepages/NewsManagementPage';
import GalleryManagementPage from 'app/modules/homepages/GalleryManagementPage';
import LogoutPage from 'app/modules/logout/LogoutPage';
import WarehouseList from 'app/modules/warehouse/warehouse-list';
import WarehouseAnalogs from 'app/modules/warehouse/warehouse-analogs';

import { AUTHORITIES } from 'app/config/constants';

// ⬇️ точечный lazy-импорт только маршрутов сущности MechanicTile
const MechanicTileRoutes = Loadable({
  loader: () => import(/* webpackChunkName: "entity-mechanic-tile" */ 'app/entities/mechanic-tile'),
  loading: () => <div>loading ...</div>,
});

// (опционально) полный блок EntitiesRoutes оставляем только для ADMIN:
const EntitiesRoutes = Loadable({
  loader: () => import(/* webpackChunkName: "entities" */ 'app/entities/routes'),
  loading: () => <div>loading ...</div>,
});

const loading = <div>loading ...</div>;

const Account = Loadable({
  loader: () => import(/* webpackChunkName: "account" */ 'app/modules/account'),
  loading: () => loading,
});

const Admin = Loadable({
  loader: () => import(/* webpackChunkName: "administration" */ 'app/modules/administration'),
  loading: () => loading,
});

const AppRoutes = () => {
  return (
    <div className="view-routes">
      <ErrorBoundaryRoutes>
        {/* публичные / общие */}

        <Route path="login" element={<Login />} />
        <Route path="logout" element={<Logout />} />

        {/* склад */}
        <Route
          path="inventory/upload"
          element={
            <PrivateRoute hasAnyAuthorities={[AUTHORITIES.WAREHOUSEMAN, AUTHORITIES.SENIOR_WAREHOUSEMAN]}>
              <InventoryUpload />
            </PrivateRoute>
          }
        />
        <Route
          path="inventory/stock"
          element={
            <PrivateRoute hasAnyAuthorities={[AUTHORITIES.WAREHOUSEMAN, AUTHORITIES.SENIOR_WAREHOUSEMAN]}>
              <InventoryStock />
            </PrivateRoute>
          }
        />
        {/* домашние страницы */}
        <Route path="/home/mechanic" element={<MechanicHomePage />} />
        <Route path="/home/senior-mechanic" element={<SeniorMechanicHomePage />} />
        <Route path="/home/warehouseman" element={<WarehousemanHomePage />} />
        <Route path="/home/senior-warehouseman" element={<SeniorWarehousemanHomePage />} />
        <Route path="/home/admin" element={<AdminHomePage />} />
        <Route path="/home" element={<RoleRedirect />} />
        <Route path="/logout-info" element={<LogoutPage />} />

        <Route
          path="mechanic/my-orders"
          element={
            <PrivateRoute hasAnyAuthorities={[AUTHORITIES.MECHANIC, AUTHORITIES.SENIOR_MECHANIC]}>
              <MyOrders />
            </PrivateRoute>
          }
        />

        <Route
          path="warehouse/orders"
          element={
            <PrivateRoute hasAnyAuthorities={[AUTHORITIES.WAREHOUSEMAN, AUTHORITIES.SENIOR_WAREHOUSEMAN]}>
              <WarehouseOrders />
            </PrivateRoute>
          }
        />

        <Route path="/welcome" element={<WelcomePage />} />
        <Route path="/" element={<WelcomePage />} />

        <Route
          path="/news-management"
          element={
            <PrivateRoute hasAnyAuthorities={[AUTHORITIES.ADMIN, AUTHORITIES.SENIOR_WAREHOUSEMAN]}>
              <NewsManagementPage />
            </PrivateRoute>
          }
        />

        <Route
          path="/gallery-management"
          element={
            <PrivateRoute hasAnyAuthorities={[AUTHORITIES.ADMIN, AUTHORITIES.SENIOR_WAREHOUSEMAN]}>
              <GalleryManagementPage />
            </PrivateRoute>
          }
        />

        {/* витрина механика */}
        <Route
          path="mechanic/catalog"
          element={
            <PrivateRoute
              hasAnyAuthorities={[AUTHORITIES.MECHANIC, AUTHORITIES.SENIOR_MECHANIC, AUTHORITIES.MANAGER, AUTHORITIES.SENIOR_MANAGER]}
            >
              <CartProvider>
                <MechanicCatalog />
              </CartProvider>
            </PrivateRoute>
          }
        />

        <Route
          path="warehouse/catalog"
          element={
            <PrivateRoute hasAnyAuthorities={[AUTHORITIES.SENIOR_WAREHOUSEMAN]}>
              <WarehouseCatalog />
            </PrivateRoute>
          }
        />
        <Route
          path="warehouse/list"
          element={
            <PrivateRoute hasAnyAuthorities={[AUTHORITIES.SENIOR_WAREHOUSEMAN, AUTHORITIES.WAREHOUSEMAN]}>
              <WarehouseList />
            </PrivateRoute>
          }
        />

        <Route
          path="warehouse/analogs"
          element={
            <PrivateRoute hasAnyAuthorities={[AUTHORITIES.WAREHOUSEMAN, AUTHORITIES.SENIOR_WAREHOUSEMAN]}>
              <WarehouseAnalogs />
            </PrivateRoute>
          }
        />

        <Route
          path="mechanic/order-success"
          element={
            <PrivateRoute
              hasAnyAuthorities={[AUTHORITIES.MECHANIC, AUTHORITIES.SENIOR_MECHANIC, AUTHORITIES.MANAGER, AUTHORITIES.SENIOR_MANAGER]}
            >
              <OrderSuccess />
            </PrivateRoute>
          }
        />

        {/* CRUD по плиткам — доступен админу и старшему кладовщику */}
        <Route
          path="mechanic-tile/*"
          element={
            <PrivateRoute hasAnyAuthorities={[AUTHORITIES.ADMIN, AUTHORITIES.SENIOR_WAREHOUSEMAN]}>
              <MechanicTileRoutes />
            </PrivateRoute>
          }
        />

        {/* Личный кабинет */}
        <Route path="account">
          <Route
            path="*"
            element={
              <PrivateRoute hasAnyAuthorities={[AUTHORITIES.ADMIN, AUTHORITIES.USER]}>
                <Account />
              </PrivateRoute>
            }
          />
          <Route path="register" element={<Register />} />
          <Route path="activate" element={<Activate />} />
          <Route path="reset">
            <Route path="request" element={<PasswordResetInit />} />
            <Route path="finish" element={<PasswordResetFinish />} />
          </Route>
        </Route>

        {/* Админ-модуль */}
        <Route
          path="admin/*"
          element={
            <PrivateRoute hasAnyAuthorities={[AUTHORITIES.ADMIN]}>
              <Admin />
            </PrivateRoute>
          }
        />

        {/* (опционально) Полный список сущностей — только админу.
            Если не нужен, можно удалить этот блок. */}
        <Route
          path="entities/*"
          element={
            <PrivateRoute hasAnyAuthorities={[AUTHORITIES.ADMIN]}>
              <EntitiesRoutes />
            </PrivateRoute>
          }
        />

        <Route
          path="*"
          element={
            <PrivateRoute hasAnyAuthorities={[]}>
              <EntitiesRoutes />
            </PrivateRoute>
          }
        />

        {/* 404 */}
        <Route path="*" element={<PageNotFound />} />
      </ErrorBoundaryRoutes>
    </div>
  );
};

export default AppRoutes;
