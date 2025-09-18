import React, { useEffect } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Button, Col, Row } from 'reactstrap';
import { Translate, ValidatedField, ValidatedForm, translate } from 'react-jhipster';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import { mapIdList } from 'app/shared/util/entity-utils';
import { useAppDispatch, useAppSelector } from 'app/config/store';

import { getEntities as getProductCategories } from 'app/entities/product-category/product-category.reducer';
import { getEntities as getWarehouses } from 'app/entities/warehouse/warehouse.reducer';
import { createEntity, getEntity, reset, updateEntity } from './mechanic-tile.reducer';

export const MechanicTileUpdate = () => {
  const dispatch = useAppDispatch();

  const navigate = useNavigate();

  const { id } = useParams<'id'>();
  const isNew = id === undefined;

  const productCategories = useAppSelector(state => state.productCategory.entities);
  const warehouses = useAppSelector(state => state.warehouse.entities);
  const mechanicTileEntity = useAppSelector(state => state.mechanicTile.entity);
  const loading = useAppSelector(state => state.mechanicTile.loading);
  const updating = useAppSelector(state => state.mechanicTile.updating);
  const updateSuccess = useAppSelector(state => state.mechanicTile.updateSuccess);

  const handleClose = () => {
    navigate('/mechanic-tile');
  };

  useEffect(() => {
    if (isNew) {
      dispatch(reset());
    } else {
      dispatch(getEntity(id));
    }

    dispatch(getProductCategories({}));
    dispatch(getWarehouses({}));
  }, []);

  useEffect(() => {
    if (updateSuccess) {
      handleClose();
    }
  }, [updateSuccess]);

  const saveEntity = values => {
    if (values.id !== undefined && typeof values.id !== 'number') {
      values.id = Number(values.id);
    }

    const entity = {
      ...mechanicTileEntity,
      ...values,
      categories: mapIdList(values.categories),
      warehouses: mapIdList(values.warehouses),
    };

    if (isNew) {
      dispatch(createEntity(entity));
    } else {
      dispatch(updateEntity(entity));
    }
  };

  const defaultValues = () =>
    isNew
      ? {}
      : {
          ...mechanicTileEntity,
          categories: mechanicTileEntity?.categories?.map(e => e.id.toString()),
          warehouses: mechanicTileEntity?.warehouses?.map(e => e.id.toString()),
        };

  return (
    <div>
      <Row className="justify-content-center">
        <Col md="8">
          <h2 id="wmmappApp.mechanicTile.home.createOrEditLabel" data-cy="MechanicTileCreateUpdateHeading">
            <Translate contentKey="wmmappApp.mechanicTile.home.createOrEditLabel">Create or edit a MechanicTile</Translate>
          </h2>
        </Col>
      </Row>
      <Row className="justify-content-center">
        <Col md="8">
          {loading ? (
            <p>Loading...</p>
          ) : (
            <ValidatedForm defaultValues={defaultValues()} onSubmit={saveEntity}>
              {!isNew ? (
                <ValidatedField
                  name="id"
                  required
                  readOnly
                  id="mechanic-tile-id"
                  label={translate('global.field.id')}
                  validate={{ required: true }}
                />
              ) : null}
              <ValidatedField
                label={translate('wmmappApp.mechanicTile.title')}
                id="mechanic-tile-title"
                name="title"
                data-cy="title"
                type="text"
                validate={{
                  required: { value: true, message: translate('entity.validation.required') },
                  maxLength: { value: 128, message: translate('entity.validation.maxlength', { max: 128 }) },
                }}
              />
              <ValidatedField
                label={translate('wmmappApp.mechanicTile.comment')}
                id="mechanic-tile-comment"
                name="comment"
                data-cy="comment"
                type="text"
                validate={{
                  maxLength: { value: 1024, message: translate('entity.validation.maxlength', { max: 1024 }) },
                }}
              />
              <ValidatedField
                label={translate('wmmappApp.mechanicTile.materialCode')}
                id="mechanic-tile-materialCode"
                name="materialCode"
                data-cy="materialCode"
                type="text"
                validate={{
                  required: { value: true, message: translate('entity.validation.required') },
                  maxLength: { value: 64, message: translate('entity.validation.maxlength', { max: 64 }) },
                }}
              />
              <ValidatedField
                label={translate('wmmappApp.mechanicTile.imageUrl')}
                id="mechanic-tile-imageUrl"
                name="imageUrl"
                data-cy="imageUrl"
                type="text"
                validate={{
                  maxLength: { value: 512, message: translate('entity.validation.maxlength', { max: 512 }) },
                }}
              />
              <ValidatedField
                label={translate('wmmappApp.mechanicTile.active')}
                id="mechanic-tile-active"
                name="active"
                data-cy="active"
                check
                type="checkbox"
              />
              <ValidatedField
                label={translate('wmmappApp.mechanicTile.categories')}
                id="mechanic-tile-categories"
                data-cy="categories"
                type="select"
                multiple
                name="categories"
              >
                <option value="" key="0" />
                {productCategories
                  ? productCategories.map(otherEntity => (
                      <option value={otherEntity.id} key={otherEntity.id}>
                        {otherEntity.name}
                      </option>
                    ))
                  : null}
              </ValidatedField>
              <ValidatedField
                label={translate('wmmappApp.mechanicTile.warehouses')}
                id="mechanic-tile-warehouses"
                data-cy="warehouses"
                type="select"
                multiple
                name="warehouses"
              >
                <option value="" key="0" />
                {warehouses
                  ? warehouses.map(otherEntity => (
                      <option value={otherEntity.id} key={otherEntity.id}>
                        {otherEntity.code}
                      </option>
                    ))
                  : null}
              </ValidatedField>
              <Button tag={Link} id="cancel-save" data-cy="entityCreateCancelButton" to="/mechanic-tile" replace color="info">
                <FontAwesomeIcon icon="arrow-left" />
                &nbsp;
                <span className="d-none d-md-inline">
                  <Translate contentKey="entity.action.back">Back</Translate>
                </span>
              </Button>
              &nbsp;
              <Button color="primary" id="save-entity" data-cy="entityCreateSaveButton" type="submit" disabled={updating}>
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

export default MechanicTileUpdate;
