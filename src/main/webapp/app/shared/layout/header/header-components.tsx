import React from 'react';
import { Translate } from 'react-jhipster';

import { NavItem, NavLink, NavbarBrand } from 'reactstrap';
import { NavLink as Link } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useAppSelector } from 'app/config/store';
import { getHomePathForRole } from 'app/shared/auth/role-utils';

export const Brand = () => (
  <NavbarBrand tag={Link} to="/" className="brand-logo d-flex align-items-center" style={{ height: '100%' }}>
    <img
      src="content/images/logo-sapport.png"
      alt="SAPPort Logo"
      style={{
        height: '100%', // логотип подгоняется под высоту хедера
        maxHeight: '45px', // можно регулировать максимум (увеличил в 2 раза)
        width: 'auto',
        cursor: 'pointer',
        transition: 'opacity 0.3s ease',
      }}
      onMouseEnter={e => (e.currentTarget.style.opacity = '0.8')}
      onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
    />
  </NavbarBrand>
);

export const Home = () => {
  const account = useAppSelector(state => state.authentication.account);
  const isAuthenticated = useAppSelector(state => state.authentication.isAuthenticated);

  const path = isAuthenticated ? getHomePathForRole(account?.authorities || []) : '/welcome';

  return (
    <NavItem>
      <NavLink tag={Link} to={path} className="d-flex align-items-center">
        <FontAwesomeIcon icon="home" />
        <span>
          <Translate contentKey="global.menu.home">Главная</Translate>
        </span>
      </NavLink>
    </NavItem>
  );
};
