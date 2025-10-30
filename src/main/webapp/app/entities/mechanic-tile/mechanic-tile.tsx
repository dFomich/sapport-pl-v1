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
  const [titleFilter, setTitleFilter] = useState('');

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

  const getSortIconByFieldName = (fieldName: string) => {
    return sortState.sort !== fieldName ? faSort : sortState.order === ASC ? faSortUp : faSortDown;
  };

  const filteredList = mechanicTileList.filter(tile => tile.title?.toLowerCase().includes(titleFilter.toLowerCase()));

  return (
    <div>
      <h2 id="mechanic-tile-heading" data-cy="MechanicTileHeading">
        <Translate contentKey="wmmappApp.mechanicTile.home.title">Mechanic Tiles</Translate>
      </h2>

      {/* Блок фильтра + кнопки */}
      <div className="d-flex justify-content-between align-items-center mb-3">
        <input
          type="text"
          className="form-control"
          placeholder="Фильтр по названию (title)"
          value={titleFilter}
          onChange={e => setTitleFilter(e.target.value)}
          style={{ maxWidth: '300px' }}
        />

        <div className="d-flex gap-2">
          <Button color="info" onClick={sortEntities} disabled={loading}>
            <FontAwesomeIcon icon="sync" spin={loading} />{' '}
            <Translate contentKey="wmmappApp.mechanicTile.home.refreshListLabel">Refresh List</Translate>
          </Button>
          <Link to="/mechanic-tile/new" className="btn btn-primary" id="jh-create-entity">
            <FontAwesomeIcon icon="plus" />
            &nbsp;
            <Translate contentKey="wmmappApp.mechanicTile.home.createLabel">Create new Mechanic Tile</Translate>
          </Link>
        </div>
      </div>

      <div className="table-responsive">
        {filteredList.length > 0 ? (
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
                  <Translate contentKey="wmmappApp.mechanicTile.categories">Categories</Translate>
                </th>
                <th>
                  <Translate contentKey="wmmappApp.mechanicTile.warehouses">Warehouses</Translate>
                </th>
                <th />
              </tr>
            </thead>
            <tbody>
              {filteredList.map((tile, i) => (
                <tr key={`entity-${i}`}>
                  <td>
                    <Button tag={Link} to={`/mechanic-tile/${tile.id}`} color="link" size="sm">
                      {tile.id}
                    </Button>
                  </td>
                  <td>{tile.title}</td>
                  <td>{tile.comment}</td>
                  <td>{tile.materialCode}</td>
                  <td style={{ maxWidth: 280, wordBreak: 'break-all' }}>{tile.imageUrl}</td>
                  <td>{tile.active ? 'true' : 'false'}</td>
                  <td>
                    {tile.categories?.map((cat, j) => (
                      <span key={j}>
                        <Link to={`/product-category/${cat.id}`}>{cat.name}</Link>
                        {j < tile.categories.length - 1 && ', '}
                      </span>
                    ))}
                  </td>
                  <td>
                    {tile.warehouses?.map((w, j) => (
                      <span key={j}>
                        <Link to={`/warehouse/${w.id}`}>{w.code}</Link>
                        {j < tile.warehouses.length - 1 && ', '}
                      </span>
                    ))}
                  </td>
                  <td className="text-end">
                    <div className="btn-group flex-btn-group-container">
                      <Button tag={Link} to={`/mechanic-tile/${tile.id}`} color="info" size="sm">
                        <FontAwesomeIcon icon="eye" /> <span className="d-none d-md-inline">View</span>
                      </Button>
                      <Button tag={Link} to={`/mechanic-tile/${tile.id}/edit`} color="primary" size="sm">
                        <FontAwesomeIcon icon="pencil-alt" /> <span className="d-none d-md-inline">Edit</span>
                      </Button>
                      <Button onClick={() => (window.location.href = `/mechanic-tile/${tile.id}/delete`)} color="danger" size="sm">
                        <FontAwesomeIcon icon="trash" /> <span className="d-none d-md-inline">Delete</span>
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
