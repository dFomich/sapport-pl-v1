import React, { useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Button, Col, Row } from 'reactstrap';
import { Translate } from 'react-jhipster';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import { useAppDispatch, useAppSelector } from 'app/config/store';

import { getEntity } from './mechanic-tile.reducer';

export const MechanicTileDetail = () => {
  const dispatch = useAppDispatch();

  const { id } = useParams<'id'>();

  useEffect(() => {
    dispatch(getEntity(id));
  }, []);

  const mechanicTileEntity = useAppSelector(state => state.mechanicTile.entity);
  return (
    <Row>
      <Col md="8">
        <h2 data-cy="mechanicTileDetailsHeading">
          <Translate contentKey="wmmappApp.mechanicTile.detail.title">MechanicTile</Translate>
        </h2>
        <dl className="jh-entity-details">
          <dt>
            <span id="id">
              <Translate contentKey="global.field.id">ID</Translate>
            </span>
          </dt>
          <dd>{mechanicTileEntity.id}</dd>
          <dt>
            <span id="title">
              <Translate contentKey="wmmappApp.mechanicTile.title">Title</Translate>
            </span>
          </dt>
          <dd>{mechanicTileEntity.title}</dd>
          <dt>
            <span id="comment">
              <Translate contentKey="wmmappApp.mechanicTile.comment">Comment</Translate>
            </span>
          </dt>
          <dd>{mechanicTileEntity.comment}</dd>
          <dt>
            <span id="materialCode">
              <Translate contentKey="wmmappApp.mechanicTile.materialCode">Material Code</Translate>
            </span>
          </dt>
          <dd>{mechanicTileEntity.materialCode}</dd>
          <dt>
            <span id="imageUrl">
              <Translate contentKey="wmmappApp.mechanicTile.imageUrl">Image Url</Translate>
            </span>
          </dt>
          <dd>{mechanicTileEntity.imageUrl}</dd>
          <dt>
            <span id="active">
              <Translate contentKey="wmmappApp.mechanicTile.active">Active</Translate>
            </span>
          </dt>
          <dd>{mechanicTileEntity.active ? 'true' : 'false'}</dd>
          <dt>
            <Translate contentKey="wmmappApp.mechanicTile.categories">Categories</Translate>
          </dt>
          <dd>
            {mechanicTileEntity.categories
              ? mechanicTileEntity.categories.map((val, i) => (
                  <span key={val.id}>
                    <a>{val.name}</a>
                    {mechanicTileEntity.categories && i === mechanicTileEntity.categories.length - 1 ? '' : ', '}
                  </span>
                ))
              : null}
          </dd>
          <dt>
            <Translate contentKey="wmmappApp.mechanicTile.warehouses">Warehouses</Translate>
          </dt>
          <dd>
            {mechanicTileEntity.warehouses
              ? mechanicTileEntity.warehouses.map((val, i) => (
                  <span key={val.id}>
                    <a>{val.code}</a>
                    {mechanicTileEntity.warehouses && i === mechanicTileEntity.warehouses.length - 1 ? '' : ', '}
                  </span>
                ))
              : null}
          </dd>
        </dl>
        <Button tag={Link} to="/mechanic-tile" replace color="info" data-cy="entityDetailsBackButton">
          <FontAwesomeIcon icon="arrow-left" />{' '}
          <span className="d-none d-md-inline">
            <Translate contentKey="entity.action.back">Back</Translate>
          </span>
        </Button>
        &nbsp;
        <Button tag={Link} to={`/mechanic-tile/${mechanicTileEntity.id}/edit`} replace color="primary">
          <FontAwesomeIcon icon="pencil-alt" />{' '}
          <span className="d-none d-md-inline">
            <Translate contentKey="entity.action.edit">Edit</Translate>
          </span>
        </Button>
      </Col>
    </Row>
  );
};

export default MechanicTileDetail;
