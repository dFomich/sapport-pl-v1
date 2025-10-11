import React, { useLayoutEffect } from 'react';
import { useAppDispatch } from 'app/config/store';
import { logout } from 'app/shared/reducers/authentication';

export const Logout = () => {
  const dispatch = useAppDispatch();

  useLayoutEffect(() => {
    dispatch(logout());

    // ✅ Перенаправляем всегда на страницу благодарности
    window.location.href = '/logout-info';
  }, [dispatch]);

  return (
    <div className="p-5 text-center">
      <h4>Выход из системы...</h4>
    </div>
  );
};

export default Logout;
