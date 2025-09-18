import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAppSelector } from 'app/config/store';
import { getHomePathForRole } from 'app/shared/auth/role-utils';

const RoleRedirect = () => {
  const account = useAppSelector(state => state.authentication.account);

  if (!account || !account.authorities) {
    return <Navigate to="/welcome" replace />;
  }

  const path = getHomePathForRole(account.authorities);

  return <Navigate to={path} replace />;
};

export default RoleRedirect;
