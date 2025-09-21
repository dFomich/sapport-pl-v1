import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Button, Col, Input, Row, Spinner } from 'reactstrap';
import clsx from 'clsx';

import '../mechanic/mechanic-catalog.scss';

type Tile = {
  id: number;
  title: string;
  comment?: string;
  imageUrl?: string;
  materialCode: string;
  availableStock: number;
  categories: string[];
};

const pageSize = 30;

const colorByStock = (qty: number) => {
  if (qty <= 0) return '#ffe5e5';
  if (qty >= 20) return '#e6ffe6';
  return '#fff9e6';
};

const WarehouseCatalog: React.FC = () => {
  const [storages, setStorages] = useState<string[]>([]);
  const [activeSt, setActiveSt] = useState<string>('');

  const [categories, setCategories] = useState<string[]>([]);
  const [category, setCategory] = useState<string>('');

  const [q, setQ] = useState('');
  const [allTiles, setAllTiles] = useState<Tile[]>([]); // все плитки
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(false);

  const [view, setView] = useState<'large' | 'medium' | 'list'>('medium');
  const [isEditing, setIsEditing] = useState(false);

  // склады
  useEffect(() => {
    let mounted = true;
    axios.get<string[]>('/api/inventory/storage-types').then(r => {
      if (!mounted) return;
      const list = r.data || [];
      setStorages(list);
      if (list.length && !activeSt) setActiveSt(list[0]);
    });
    return () => {
      mounted = false;
    };
  }, []);

  // категории
  useEffect(() => {
    if (!activeSt) return;
    let mounted = true;
    axios.get<string[]>('/api/mechanic/catalog/categories', { params: { storageType: activeSt } }).then(r => {
      if (!mounted) return;
      setCategories(r.data || []);
    });
    return () => {
      mounted = false;
    };
  }, [activeSt]);

  // загрузка всех плиток
  const load = async (st = activeSt) => {
    if (!st) return;
    setLoading(true);
    const res = await axios.get<Tile[]>('/api/mechanic/catalog/tiles', {
      params: { storageType: st, sort: 'title,asc', size: 1000 }, // 👈 загружаем максимум
    });
    setAllTiles(res.data || []);
    setPage(0);
    setLoading(false);
  };

  useEffect(() => {
    if (activeSt) load(activeSt);
  }, [activeSt]);

  // перезагрузка при фильтрации
  useEffect(() => {
    setPage(0);
  }, [q, category]);

  // фильтрация и пагинация
  const filtered = allTiles.filter(t => {
    const matchTitle = q ? t.title.toLowerCase().includes(q.toLowerCase()) : true;
    const matchCategory = category ? t.categories.includes(category) : true;
    return matchTitle && matchCategory;
  });

  const total = filtered.length;
  const pages = Math.max(1, Math.ceil(total / pageSize));
  const paginated = filtered.slice(page * pageSize, (page + 1) * pageSize);

  return (
    <div className="container mt-4 mechanic-catalog">
      <Row className="mb-2 align-items-center">
        <Col>
          <h4>Так выглядит витрина у механиков</h4>
        </Col>
        <Col className="text-end">
          <div className="btn-group me-2">
            <Button active={view === 'large'} onClick={() => setView('large')}>
              Крупно
            </Button>
            <Button active={view === 'medium'} onClick={() => setView('medium')}>
              Средне
            </Button>
            <Button active={view === 'list'} onClick={() => setView('list')}>
              Список
            </Button>
          </div>
          <Button color={isEditing ? 'secondary' : 'primary'} onClick={() => setIsEditing(!isEditing)}>
            {isEditing ? 'Завершить редактирование' : 'Редактировать плитки'}
          </Button>
        </Col>
      </Row>

      {/* Вкладки складов */}
      <div className="mb-3">
        {storages.map(s => (
          <Button key={s} color={s === activeSt ? 'primary' : 'secondary'} className="me-2 mb-2" onClick={() => setActiveSt(s)}>
            {s}
          </Button>
        ))}
      </div>

      {/* Фильтры */}
      <Row className="g-2 align-items-center mb-3">
        <Col md="6">
          <Input placeholder="Поиск по названию" value={q} onChange={e => setQ(e.target.value)} />
        </Col>
        <Col md="4">
          <select className="form-select" value={category} onChange={e => setCategory(e.target.value)}>
            <option value="">Все категории</option>
            {categories.map(c => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </Col>
        <Col md="2" className="text-end">
          {loading ? <Spinner size="sm" /> : <span>Всего: {total}</span>}
        </Col>
      </Row>

      {/* Плитки / список */}
      {view !== 'list' ? (
        <div
          className="tiles-grid"
          style={{ display: 'grid', gridTemplateColumns: view === 'large' ? 'repeat(5, 1fr)' : 'repeat(10, 1fr)', gap: 12 }}
        >
          {paginated.map(t => (
            <div
              key={t.id}
              className="tile"
              style={{ background: colorByStock(t.availableStock), cursor: isEditing ? 'pointer' : 'default' }}
              title={t.title}
            >
              <div className="tile-head">
                <div className="tile-title">{t.title}</div>
              </div>
              {t.comment && (
                <div className="tile-comment text-muted small" title={t.comment}>
                  {t.comment}
                </div>
              )}
              {t.imageUrl ? (
                <img className="tile-img" src={t.imageUrl} alt="" />
              ) : (
                <div className="tile-img tile-img--placeholder">нет фото</div>
              )}
              <div className="tile-meta">
                <div className="small text-muted">Склад: {activeSt}</div>
                <div className="small">
                  Остаток: <b>{t.availableStock}</b>
                </div>
              </div>
              {isEditing && (
                <button
                  className="tile-add"
                  onClick={() => (window.location.href = `/mechanic-tile/${t.id}/edit`)}
                  title="Редактировать плитку"
                >
                  ✏️
                </button>
              )}
            </div>
          ))}
          {paginated.length === 0 && !loading && <div className="text-muted">Нет данных</div>}
        </div>
      ) : (
        <div className="list-group">
          {paginated.map(t => (
            <div
              key={t.id}
              className={clsx('list-group-item d-flex justify-content-between align-items-center', { 'opacity-75': t.availableStock <= 0 })}
              style={{ background: colorByStock(t.availableStock), cursor: isEditing ? 'pointer' : 'default' }}
              onClick={() => isEditing && (window.location.href = `/mechanic-tile/${t.id}/edit`)}
            >
              <div>
                <div className="fw-bold">{t.title}</div>
                {t.comment && <div className="small text-muted">{t.comment}</div>}
                <div className="small text-muted">
                  Склад: {activeSt} · Остаток: {t.availableStock}
                </div>
              </div>
              {isEditing && (
                <Button
                  color="primary"
                  size="sm"
                  onClick={e => {
                    e.stopPropagation();
                    window.location.href = `/mechanic-tile/${t.id}/edit`;
                  }}
                >
                  ✏️ Редактировать
                </Button>
              )}
            </div>
          ))}
          {paginated.length === 0 && !loading && <div className="text-muted">Нет данных</div>}
        </div>
      )}

      {/* Пагинация */}
      <Row className="mt-3">
        <Col className="d-flex justify-content-between">
          <Button disabled={page === 0} onClick={() => setPage(p => p - 1)}>
            Назад
          </Button>
          <div>
            Стр. {page + 1} / {pages}
          </div>
          <Button disabled={page + 1 >= pages} onClick={() => setPage(p => p + 1)}>
            Вперёд
          </Button>
        </Col>
      </Row>
    </div>
  );
};

export default WarehouseCatalog;
