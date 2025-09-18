import React from 'react';
import { Translate, ValidatedField, translate } from 'react-jhipster';
import { Alert, Button, Col, Form, Modal, ModalBody, ModalFooter, ModalHeader, Row } from 'reactstrap';
import { FieldError, useForm } from 'react-hook-form';
import './login-modal.scss';

export interface ILoginModalProps {
  showModal: boolean;
  loginError: boolean;
  handleLogin: (username: string, password: string, rememberMe: boolean) => void;
  handleClose: () => void;
}

const LoginModal = (props: ILoginModalProps) => {
  const login = ({ username, password, rememberMe }) => {
    props.handleLogin(username, password, rememberMe);
  };

  const {
    handleSubmit,
    register,
    formState: { errors, touchedFields },
  } = useForm({ mode: 'onTouched' });

  const { loginError, handleClose } = props;

  const handleLoginSubmit = e => {
    handleSubmit(login)(e);
  };

  return (
    <Modal
      isOpen={props.showModal}
      toggle={handleClose}
      backdrop="static"
      id="login-page"
      autoFocus={false}
      contentClassName="login-modal-dark"
    >
      <Form onSubmit={handleLoginSubmit}>
        <ModalHeader id="login-title" data-cy="loginTitle" toggle={handleClose} className="login-modal-header">
          <Translate contentKey="login.title">Вход</Translate>
        </ModalHeader>
        <ModalBody className="login-modal-body">
          <Row>
            <Col md="12">
              {loginError ? (
                <Alert color="danger" data-cy="loginError" className="login-alert">
                  <Translate contentKey="login.messages.error.authentication">
                    <strong>Ошибка входа!</strong> Проверьте логин и пароль.
                  </Translate>
                </Alert>
              ) : null}
            </Col>
            <Col md="12">
              <ValidatedField
                name="username"
                label={translate('global.form.username.label')}
                placeholder={translate('global.form.username.placeholder')}
                required
                autoFocus
                data-cy="username"
                validate={{ required: 'Username cannot be empty!' }}
                register={register}
                error={errors.username as FieldError}
                isTouched={touchedFields.username}
              />
              <ValidatedField
                name="password"
                type="password"
                label={translate('login.form.password')}
                placeholder={translate('login.form.password.placeholder')}
                required
                data-cy="password"
                validate={{ required: 'Password cannot be empty!' }}
                register={register}
                error={errors.password as FieldError}
                isTouched={touchedFields.password}
              />
              <ValidatedField
                name="rememberMe"
                type="checkbox"
                check
                label={translate('login.form.rememberme')}
                value={true}
                register={register}
              />
            </Col>
          </Row>

          {/* Сообщение без кнопки регистрации */}
          <div className="login-info-text">Нет своего аккаунта? Обратись к сотрудникам склада</div>
        </ModalBody>
        <ModalFooter className="login-modal-footer">
          <Button color="secondary" onClick={handleClose} tabIndex={1}>
            Отмена
          </Button>{' '}
          <Button color="primary" type="submit" data-cy="submit">
            Начать работу
          </Button>
        </ModalFooter>
      </Form>
    </Modal>
  );
};

export default LoginModal;
