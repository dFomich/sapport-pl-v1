import { loadingBarReducer as loadingBar } from 'react-redux-loading-bar';

// общие редьюсеры
import authentication from './authentication';
import applicationProfile from './application-profile';
import locale from './locale';

// админка
import administration from 'app/modules/administration/administration.reducer';
import userManagement from 'app/modules/administration/user-management/user-management.reducer';

// аккаунт
import register from 'app/modules/account/register/register.reducer';
import activate from 'app/modules/account/activate/activate.reducer';
import password from 'app/modules/account/password/password.reducer';
import passwordReset from 'app/modules/account/password-reset/password-reset.reducer';
import settings from 'app/modules/account/settings/settings.reducer';

// сущности (см. пункт 2)
import entitiesReducers from 'app/entities/reducers';

/**
 * Никаких «state.entities.…» — раскладываем сущности на верхний уровень,
 * чтобы селекторы `state.warehouse`, `state.productCategory`, `state.mechanicTile`
 * продолжили работать.
 */
const rootReducer = {
  authentication,
  applicationProfile,
  administration,
  userManagement,

  register,
  activate,
  password,
  passwordReset,
  settings,

  locale,

  // 👇 развернули сущности в корень стора
  ...entitiesReducers,

  loadingBar,
};

export default rootReducer;
