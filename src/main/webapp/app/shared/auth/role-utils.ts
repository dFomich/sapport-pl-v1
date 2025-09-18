// src/main/webapp/app/shared/auth/role-utils.ts

/**
 * Возвращает путь к домашней странице в зависимости от роли.
 */
export const getHomePathForRole = (authorities: string[]): string => {
  if (!authorities || authorities.length === 0) {
    return '/welcome';
  }

  if (authorities.includes('ROLE_ADMIN')) {
    return '/home/admin';
  }
  if (authorities.includes('ROLE_SENIOR_MECHANIC')) {
    return '/home/senior-mechanic';
  }
  if (authorities.includes('ROLE_MECHANIC')) {
    return '/home/mechanic';
  }
  if (authorities.includes('ROLE_SENIOR_WAREHOUSEMAN')) {
    return '/home/senior-warehouseman';
  }
  if (authorities.includes('ROLE_WAREHOUSEMAN')) {
    return '/home/warehouseman';
  }

  // запасной вариант
  return '/welcome';
};
