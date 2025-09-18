import React, { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Button, Table } from 'reactstrap';
import { Translate, getSortState } from 'react-jhipster';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSort, faSortDown, faSortUp } from '@fortawesome/free-solid-svg-icons';
import { ASC, DESC } from 'app/shared/util/pagination.constants';
import { overrideSortStateWithQueryParams } from 'app/shared/util/entity-utils';
import { useAppDispatch, useAppSelector } from 'app/config/store';

import { getEntities } from './mechanic-tile.reducer';

export const MechanicTile = () => {
  const dispatch = useAppDispatch();

  const pageLocation = useLocation();
  const navigate = useNavigate();

  const [sortState, setSortState] = useState(overrideSortStateWithQueryParams(getSortState(pageLocation, 'id'), pageLocation.search));

  const mechanicTileList = useAppSelector(state => state.mechanicTile.entities);
  const loading = useAppSelector(state => state.mechanicTile.loading);

  const getAllEntities = () => {
    dispatch(
      getEntities({
        sort: `${sortState.sort},${sortState.order}`,
      }),
    );
  };

  const sortEntities = () => {
    getAllEntities();
    const endURL = `?sort=${sortState.sort},${sortState.order}`;
    if (pageLocation.search !== endURL) {
      navigate(`${pageLocation.pathname}${endURL}`);
    }
  };

  useEffect(() => {
    sortEntities();
  }, [sortState.order, sortState.sort]);

  const sort = p => () => {
    setSortState({
      ...sortState,
      order: sortState.order === ASC ? DESC : ASC,
      sort: p,
    });
  };

  const handleSyncList = () => {
    sortEntities();
  };

  const getSortIconByFieldName = (fieldName: string) => {
    const sortFieldName = sortState.sort;
    const order = sortState.order;
    if (sortFieldName !== fieldName) {
      return faSort;
    }
    return order === ASC ? faSortUp : faSortDown;
  };

  return (
    <div>
      <h2 id="mechanic-tile-heading" data-cy="MechanicTileHeading">
        <Translate contentKey="wmmappApp.mechanicTile.home.title">Mechanic Tiles</Translate>
        <div className="d-flex justify-content-end">
          <Button className="me-2" color="info" onClick={handleSyncList} disabled={loading}>
            <FontAwesomeIcon icon="sync" spin={loading} />{' '}
            <Translate contentKey="wmmappApp.mechanicTile.home.refreshListLabel">Refresh List</Translate>
          </Button>
          <Link to="/mechanic-tile/new" className="btn btn-primary jh-create-entity" id="jh-create-entity" data-cy="entityCreateButton">
            <FontAwesomeIcon icon="plus" />
            &nbsp;
            <Translate contentKey="wmmappApp.mechanicTile.home.createLabel">Create new Mechanic Tile</Translate>
          </Link>
        </div>
      </h2>
      <div className="table-responsive">
        {mechanicTileList && mechanicTileList.length > 0 ? (
          <Table responsive>
            <thead>
              <tr>
                <th className="hand" onClick={sort('id')}>
                  <Translate contentKey="wmmappApp.mechanicTile.id">ID</Translate> <FontAwesomeIcon icon={getSortIconByFieldName('id')} />
                </th>
                <th className="hand" onClick={sort('title')}>
                  <Translate contentKey="wmmappApp.mechanicTile.title">Title</Translate>{' '}
                  <FontAwesomeIcon icon={getSortIconByFieldName('title')} />
                </th>
                <th className="hand" onClick={sort('comment')}>
                  <Translate contentKey="wmmappApp.mechanicTile.comment">Comment</Translate>{' '}
                  <FontAwesomeIcon icon={getSortIconByFieldName('comment')} />
                </th>
                <th className="hand" onClick={sort('materialCode')}>
                  <Translate contentKey="wmmappApp.mechanicTile.materialCode">Material Code</Translate>{' '}
                  <FontAwesomeIcon icon={getSortIconByFieldName('materialCode')} />
                </th>
                <th className="hand" onClick={sort('imageUrl')}>
                  <Translate contentKey="wmmappApp.mechanicTile.imageUrl">Image Url</Translate>{' '}
                  <FontAwesomeIcon icon={getSortIconByFieldName('imageUrl')} />
                </th>
                <th className="hand" onClick={sort('active')}>
                  <Translate contentKey="wmmappApp.mechanicTile.active">Active</Translate>{' '}
                  <FontAwesomeIcon icon={getSortIconByFieldName('active')} />
                </th>
                <th>
                  <Translate contentKey="wmmappApp.mechanicTile.categories">Categories</Translate> <FontAwesomeIcon icon="sort" />
                </th>
                <th>
                  <Translate contentKey="wmmappApp.mechanicTile.warehouses">Warehouses</Translate> <FontAwesomeIcon icon="sort" />
                </th>
                <th />
              </tr>
            </thead>
            <tbody>
              {mechanicTileList.map((mechanicTile, i) => (
                <tr key={`entity-${i}`} data-cy="entityTable">
                  <td>
                    <Button tag={Link} to={`/mechanic-tile/${mechanicTile.id}`} color="link" size="sm">
                      {mechanicTile.id}
                    </Button>
                  </td>
                  <td>{mechanicTile.title}</td>
                  <td>{mechanicTile.comment}</td>
                  <td>{mechanicTile.materialCode}</td>
                  <td>{mechanicTile.imageUrl}</td>
                  <td>{mechanicTile.active ? 'true' : 'false'}</td>
                  <td>
                    {mechanicTile.categories
                      ? mechanicTile.categories.map((val, j) => (
                          <span key={j}>
                            <Link to={`/product-category/${val.id}`}>{val.name}</Link>
                            {j === mechanicTile.categories.length - 1 ? '' : ', '}
                          </span>
                        ))
                      : null}
                  </td>
                  <td>
                    {mechanicTile.warehouses
                      ? mechanicTile.warehouses.map((val, j) => (
                          <span key={j}>
                            <Link to={`/warehouse/${val.id}`}>{val.code}</Link>
                            {j === mechanicTile.warehouses.length - 1 ? '' : ', '}
                          </span>
                        ))
                      : null}
                  </td>
                  <td className="text-end">
                    <div className="btn-group flex-btn-group-container">
                      <Button tag={Link} to={`/mechanic-tile/${mechanicTile.id}`} color="info" size="sm" data-cy="entityDetailsButton">
                        <FontAwesomeIcon icon="eye" />{' '}
                        <span className="d-none d-md-inline">
                          <Translate contentKey="entity.action.view">View</Translate>
                        </span>
                      </Button>
                      <Button tag={Link} to={`/mechanic-tile/${mechanicTile.id}/edit`} color="primary" size="sm" data-cy="entityEditButton">
                        <FontAwesomeIcon icon="pencil-alt" />{' '}
                        <span className="d-none d-md-inline">
                          <Translate contentKey="entity.action.edit">Edit</Translate>
                        </span>
                      </Button>
                      <Button
                        onClick={() => (window.location.href = `/mechanic-tile/${mechanicTile.id}/delete`)}
                        color="danger"
                        size="sm"
                        data-cy="entityDeleteButton"
                      >
                        <FontAwesomeIcon icon="trash" />{' '}
                        <span className="d-none d-md-inline">
                          <Translate contentKey="entity.action.delete">Delete</Translate>
                        </span>
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        ) : (
          !loading && (
            <div className="alert alert-warning">
              <Translate contentKey="wmmappApp.mechanicTile.home.notFound">No Mechanic Tiles found</Translate>
            </div>
          )
        )}
      </div>
    </div>
  );
};

export default MechanicTile;
