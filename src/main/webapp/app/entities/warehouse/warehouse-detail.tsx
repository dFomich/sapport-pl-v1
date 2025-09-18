import React, { useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Button, Col, Row } from 'reactstrap';
import { Translate } from 'react-jhipster';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import { useAppDispatch, useAppSelector } from 'app/config/store';

import { getEntity } from './warehouse.reducer';

export const WarehouseDetail = () => {
  const dispatch = useAppDispatch();

  const { id } = useParams<'id'>();

  useEffect(() => {
    dispatch(getEntity(id));
  }, []);

  const warehouseEntity = useAppSelector(state => state.warehouse.entity);
  return (
    <Row>
      <Col md="8">
        <h2 data-cy="warehouseDetailsHeading">
          <Translate contentKey="wmmappApp.warehouse.detail.title">Warehouse</Translate>
        </h2>
        <dl className="jh-entity-details">
          <dt>
            <span id="id">
              <Translate contentKey="global.field.id">ID</Translate>
            </span>
          </dt>
          <dd>{warehouseEntity.id}</dd>
          <dt>
            <span id="code">
              <Translate contentKey="wmmappApp.warehouse.code">Code</Translate>
            </span>
          </dt>
          <dd>{warehouseEntity.code}</dd>
          <dt>
            <span id="name">
              <Translate contentKey="wmmappApp.warehouse.name">Name</Translate>
            </span>
          </dt>
          <dd>{warehouseEntity.name}</dd>
          <dt>
            <span id="active">
              <Translate contentKey="wmmappApp.warehouse.active">Active</Translate>
            </span>
          </dt>
          <dd>{warehouseEntity.active ? 'true' : 'false'}</dd>
          <dt>
            <Translate contentKey="wmmappApp.warehouse.tiles">Tiles</Translate>
          </dt>
          <dd>
            {warehouseEntity.tiles
              ? warehouseEntity.tiles.map((val, i) => (
                  <span key={val.id}>
                    <a>{val.title}</a>
                    {warehouseEntity.tiles && i === warehouseEntity.tiles.length - 1 ? '' : ', '}
                  </span>
                ))
              : null}
          </dd>
        </dl>
        <Button tag={Link} to="/warehouse" replace color="info" data-cy="entityDetailsBackButton">
          <FontAwesomeIcon icon="arrow-left" />{' '}
          <span className="d-none d-md-inline">
            <Translate contentKey="entity.action.back">Back</Translate>
          </span>
        </Button>
        &nbsp;
        <Button tag={Link} to={`/warehouse/${warehouseEntity.id}/edit`} replace color="primary">
          <FontAwesomeIcon icon="pencil-alt" />{' '}
          <span className="d-none d-md-inline">
            <Translate contentKey="entity.action.edit">Edit</Translate>
          </span>
        </Button>
      </Col>
    </Row>
  );
};

export default WarehouseDetail;
