import React, { useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Button, Col, Row } from 'reactstrap';
import { Translate, ValidatedField, ValidatedForm, translate } from 'react-jhipster';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import { languages, locales } from 'app/config/translation';
import { useAppDispatch, useAppSelector } from 'app/config/store';
import { createUser, getRoles, getUser, reset, updateUser } from './user-management.reducer';

export const UserManagementUpdate = () => {
  const dispatch = useAppDispatch();

  const navigate = useNavigate();

  const { login } = useParams<'login'>();
  const isNew = login === undefined;

  useEffect(() => {
    if (isNew) {
      dispatch(reset());
    } else {
      dispatch(getUser(login));
    }
    dispatch(getRoles());
    return () => {
      dispatch(reset());
    };
  }, [login]);

  const handleClose = () => {
    navigate('/admin/user-management');
  };

  const saveUser = values => {
    // Проверка пароля
    if (isNew && (!values.password || values.password.length < 4)) {
      alert('Password is required (min 4 characters).');
      return;
    }
    if (values.password && values.confirmPassword && values.password !== values.confirmPassword) {
      alert('Passwords do not match.');
      return;
    }

    const payload = {
      ...values,
      ...(values.password ? { password: values.password } : {}),
      // при создании — обязательно активируем
      ...(isNew ? { activated: true } : {}),
      // на всякий случай, если ролей не выбрали — даём базовую
      ...(values.authorities?.length ? {} : { authorities: ['ROLE_USER'] }),
    };

    if (isNew) {
      dispatch(createUser(payload));
    } else {
      dispatch(updateUser(payload));
    }
    handleClose();
  };

  const isInvalid = false;
  const user = useAppSelector(state => state.userManagement.user);
  const loading = useAppSelector(state => state.userManagement.loading);
  const updating = useAppSelector(state => state.userManagement.updating);
  const authorities = useAppSelector(state => state.userManagement.authorities);

  const passwordValidate = isNew
    ? {
        required: { value: true, message: 'Password is required.' },
        minLength: { value: 4, message: 'Minimum length is 4.' },
        maxLength: { value: 60, message: 'Maximum length is 60.' },
      }
    : {
        minLength: { value: 4, message: 'Minimum length is 4.' },
        maxLength: { value: 60, message: 'Maximum length is 60.' },
      };

  return (
    <div>
      <Row className="justify-content-center">
        <Col md="8">
          <h1>
            <Translate contentKey="userManagement.home.createOrEditLabel">Create or edit a User</Translate>
          </h1>
        </Col>
      </Row>
      <Row className="justify-content-center">
        <Col md="8">
          {loading ? (
            <p>Loading...</p>
          ) : (
            <ValidatedForm onSubmit={saveUser} defaultValues={isNew ? { langKey: 'en', activated: true } : user}>
              {user.id ? (
                <ValidatedField
                  type="text"
                  name="id"
                  required
                  readOnly
                  label={translate('global.field.id')}
                  validate={{ required: true }}
                />
              ) : null}
              <ValidatedField
                type="text"
                name="login"
                label={translate('userManagement.login')}
                validate={{
                  required: { value: true, message: translate('register.messages.validate.login.required') },
                  pattern: {
                    value: /^[a-zA-Z0-9!$&*+=?^_`{|}~.-]+@[a-zA-Z0-9-]+(?:\\.[a-zA-Z0-9-]+)*$|^[_.@A-Za-z0-9-]+$/,
                    message: translate('register.messages.validate.login.pattern'),
                  },
                  minLength: { value: 1, message: translate('register.messages.validate.login.minlength') },
                  maxLength: { value: 50, message: translate('register.messages.validate.login.maxlength') },
                }}
              />
              {/* Пароль (обязателен только при создании) */}
              <ValidatedField name="password" type="password" label="Password" validate={passwordValidate} />
              <ValidatedField name="confirmPassword" type="password" label="Confirm password" />
              <ValidatedField
                type="text"
                name="firstName"
                label={translate('userManagement.firstName')}
                validate={{ maxLength: { value: 50, message: translate('entity.validation.maxlength', { max: 50 }) } }}
              />
              <ValidatedField
                type="text"
                name="lastName"
                label={translate('userManagement.lastName')}
                validate={{ maxLength: { value: 50, message: translate('entity.validation.maxlength', { max: 50 }) } }}
              />
              <ValidatedField
                type="checkbox"
                name="activated"
                check
                value={true}
                disabled={!user.id}
                label={translate('userManagement.activated')}
              />
              <ValidatedField type="select" name="langKey" label={translate('userManagement.langKey')}>
                {locales.map(locale => (
                  <option value={locale} key={locale}>
                    {languages[locale].name}
                  </option>
                ))}
              </ValidatedField>
              <ValidatedField type="select" name="authorities" multiple label={translate('userManagement.profiles')}>
                {authorities.map(role => (
                  <option value={role} key={role}>
                    {role}
                  </option>
                ))}
              </ValidatedField>
              <Button tag={Link} to="/admin/user-management" replace color="info">
                <FontAwesomeIcon icon="arrow-left" />
                &nbsp;
                <span className="d-none d-md-inline">
                  <Translate contentKey="entity.action.back">Back</Translate>
                </span>
              </Button>
              &nbsp;
              <Button color="primary" type="submit" disabled={isInvalid || updating}>
                <FontAwesomeIcon icon="save" />
                &nbsp;
                <Translate contentKey="entity.action.save">Save</Translate>
              </Button>
            </ValidatedForm>
          )}
        </Col>
      </Row>
    </div>
  );
};

export default UserManagementUpdate;
