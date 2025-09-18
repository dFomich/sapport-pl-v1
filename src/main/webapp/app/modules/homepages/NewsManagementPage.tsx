import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAppSelector } from 'app/config/store';
import { hasAnyAuthority } from 'app/shared/auth/private-route';
import { AUTHORITIES } from 'app/config/constants';
import NewsBlock from '../home/NewsBlock';

const NewsManagementPage = () => {
  const account = useAppSelector(state => state.authentication.account);
  const isEditor = hasAnyAuthority(account.authorities, [AUTHORITIES.ADMIN, 'ROLE_SENIOR_WAREHOUSEMAN']);

  if (!isEditor) {
    return <Navigate to="/unauthorized" />;
  }

  return (
    <div className="container mt-4">
      <h2 className="text-white mb-4">Управление новостями</h2>
      <NewsBlock />
    </div>
  );
};

export default NewsManagementPage;
