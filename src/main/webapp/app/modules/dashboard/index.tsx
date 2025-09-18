import React from 'react';
import { Card, CardBody } from 'reactstrap';
import { Link } from 'react-router-dom';
import { Translate } from 'react-jhipster';
import { useAppSelector } from 'app/config/store';
import { hasAnyAuthority } from 'app/shared/auth/private-route';
import { AUTHORITIES } from 'app/config/constants';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faBoxes, faClipboardList, faStore, faCogs, faUsers, faTasks, faWrench } from '@fortawesome/free-solid-svg-icons';

import './dashboard.scss';

const Tile = ({ titleKey, to, icon }: { titleKey: string; to: string; icon: any }) => (
  <Link to={to} className="dashboard-tile-link">
    <Card className="dashboard-tile shadow-sm m-3">
      <CardBody className="text-center">
        <FontAwesomeIcon icon={icon} size="2x" className="mb-3 text-primary" />
        <h5 className="mb-0">
          <Translate contentKey={titleKey} />
        </h5>
      </CardBody>
    </Card>
  </Link>
);

const Dashboard = () => {
  const account = useAppSelector(state => state.authentication.account);
  const auth = account?.authorities || [];

  return (
    <div className="dashboard-container d-flex flex-wrap justify-content-center">
      {/* МЕХАНИК / СТАРШИЙ МЕХАНИК */}
      {hasAnyAuthority(auth, [AUTHORITIES.MECHANIC, AUTHORITIES.SENIOR_MECHANIC]) && (
        <>
          <Tile titleKey="dashboard.mechanic.catalog" to="/mechanic/catalog" icon={faStore} />
          <Tile titleKey="dashboard.mechanic.myOrders" to="/mechanic/my-orders" icon={faClipboardList} />
        </>
      )}

      {/* КЛАДОВЩИК */}
      {hasAnyAuthority(auth, [AUTHORITIES.WAREHOUSEMAN]) && (
        <>
          <Tile titleKey="dashboard.wh.orders" to="/warehouse/orders" icon={faClipboardList} />
          <Tile titleKey="dashboard.wh.stock" to="/inventory/stock" icon={faBoxes} />
        </>
      )}

      {/* СТАРШИЙ КЛАДОВЩИК */}
      {hasAnyAuthority(auth, [AUTHORITIES.SENIOR_WAREHOUSEMAN]) && (
        <>
          <Tile titleKey="dashboard.wh.orders" to="/warehouse/orders" icon={faClipboardList} />
          <Tile titleKey="dashboard.wh.stock" to="/inventory/stock" icon={faBoxes} />
          <Tile titleKey="dashboard.wh.catalog" to="/warehouse/catalog" icon={faStore} />
          <Tile titleKey="dashboard.wh.tiles" to="/mechanic-tile" icon={faCogs} />
        </>
      )}

      {/* АДМИН */}
      {hasAnyAuthority(auth, [AUTHORITIES.ADMIN]) && (
        <>
          <Tile titleKey="dashboard.admin.users" to="/admin/user-management" icon={faUsers} />
          <Tile titleKey="dashboard.admin.entities" to="/entities" icon={faTasks} />
          <Tile titleKey="dashboard.admin.warehouse" to="/entities/warehouse" icon={faBoxes} />
          <Tile titleKey="dashboard.admin.productCategory" to="/entities/product-category" icon={faStore} />
        </>
      )}

      {/* fallback */}
      {!auth.length && (
        <p>
          <Translate contentKey="dashboard.empty" />
        </p>
      )}
    </div>
  );
};

export default Dashboard;
