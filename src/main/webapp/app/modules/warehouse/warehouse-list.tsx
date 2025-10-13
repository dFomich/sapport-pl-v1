import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Button, Col, Input, Modal, ModalBody, ModalHeader, Row, Spinner } from 'reactstrap';
import clsx from 'clsx';
import RefreshIcon from '@mui/icons-material/Refresh';
import '../mechanic/mechanic-catalog.scss';

type Tile = {
  id: number;
  title: string;
  materialCode: string;
  comment?: string;
  imageUrl?: string;
  availableStock: number;
  categories: string[];
};

const pageSize = 30;
const REFRESH_INTERVAL = 30;

const colorByStock = (qty: number) => {
  if (qty <= 0) return '#ffe5e5';
  if (qty <= 10) return '#fff9e6';
  return '#e6ffe6';
};

const WarehouseList: React.FC = () => {
  const [storages, setStorages] = useState<string[]>([]);
  const [activeSt, setActiveSt] = useState<string>('');
  const [categories, setCategories] = useState<string[]>([]);
  const [category, setCategory] = useState('');
  const [q, setQ] = useState('');
  const [allTiles, setAllTiles] = useState<Tile[]>([]);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(false);
  const [view, setView] = useState<'large' | 'medium' | 'list'>('medium');
  const [selectedTile, setSelectedTile] = useState<Tile | null>(null);
  const [sortByQtyAsc, setSortByQtyAsc] = useState<boolean | null>(null);
  const [autoTimer, setAutoTimer] = useState(REFRESH_INTERVAL);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Список складов
  useEffect(() => {
    axios.get<string[]>('/api/inventory/storage-types').then(r => {
      const list = r.data || [];
      setStorages(list);
      if (list.length && !activeSt) setActiveSt(list[0]);
    });
  }, []);

  // Категории
  useEffect(() => {
    if (!activeSt) return;
    axios.get<string[]>('/api/mechanic/catalog/categories', { params: { storageType: activeSt } }).then(r => setCategories(r.data || []));
  }, [activeSt]);

  // Загрузка товаров
  const loadTiles = async (st = activeSt) => {
    if (!st) return;
    setLoading(true);
    try {
      const res = await axios.get<Tile[]>('/api/mechanic/catalog/tiles', {
        params: { storageType: st, size: 1000 },
      });
      const sorted = (res.data || []).sort((a, b) => a.title.localeCompare(b.title));
      setAllTiles(sorted);
      setPage(0);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (activeSt) loadTiles(activeSt);
  }, [activeSt]);

  // Автообновление остатков
  useEffect(() => {
    if (!activeSt || loading) return;
    const tick = () => {
      setAutoTimer(prev => {
        if (prev > 1) return prev - 1;
        refreshStocks();
        return REFRESH_INTERVAL;
      });
    };
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [activeSt, allTiles, loading]);

  const refreshStocks = async () => {
    if (!activeSt) return;
    try {
      setIsRefreshing(true);
      const res = await axios.get<Tile[]>('/api/mechanic/catalog/tiles', {
        params: { storageType: activeSt, size: 1000 },
      });
      const latest = (res.data || []).sort((a, b) => a.title.localeCompare(b.title));
      setAllTiles(prev =>
        prev.map(t => {
          const m = latest.find(x => x.materialCode === t.materialCode);
          return m ? { ...t, availableStock: m.availableStock } : t;
        }),
      );
    } catch (e) {
      console.warn('Ошибка обновления остатков', e);
    } finally {
      setIsRefreshing(false);
      setAutoTimer(REFRESH_INTERVAL);
    }
  };

  useEffect(() => setPage(0), [q, category]);

  let filtered = allTiles.filter(t => {
    const byTitle = q ? t.title.toLowerCase().includes(q.toLowerCase()) : true;
    const byCode = q ? t.materialCode.toLowerCase().includes(q.toLowerCase()) : true;
    const byCat = category ? t.categories.includes(category) : true;
    return (byTitle || byCode) && byCat;
  });

  if (sortByQtyAsc !== null) {
    filtered = filtered.sort((a, b) => (sortByQtyAsc ? a.availableStock - b.availableStock : b.availableStock - a.availableStock));
  } else {
    filtered = filtered.sort((a, b) => a.title.localeCompare(b.title));
  }

  const total = filtered.length;
  const pages = Math.max(1, Math.ceil(total / pageSize));
  const paginated = filtered.slice(page * pageSize, (page + 1) * pageSize);

  return (
    <div className="container mt-4 mechanic-catalog">
      <Row className="mb-2 align-items-center">
        <Col>
          <h4>Витрина склада</h4>
        </Col>

        <Col className="text-end d-flex align-items-center justify-content-end gap-3">
          {/* Кнопка обновления */}
          <div
            onClick={refreshStocks}
            title="Обновить остатки"
            style={{
              position: 'relative',
              width: 38,
              height: 38,
              borderRadius: '50%',
              background: isRefreshing ? '#d0ebff' : '#f8f9fa',
              border: '1px solid #ced4da',
              cursor: isRefreshing ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <RefreshIcon
              style={{
                fontSize: 22,
                color: isRefreshing ? '#0d6efd' : '#6c757d',
                transform: isRefreshing ? 'rotate(360deg)' : 'none',
                transition: 'transform 1s linear',
              }}
            />
            <svg width="38" height="38" style={{ position: 'absolute', top: 0, left: 0, transform: 'rotate(-90deg)' }}>
              <circle cx="19" cy="19" r="17" stroke="#dee2e6" strokeWidth="2" fill="none" />
              <circle
                cx="19"
                cy="19"
                r="17"
                stroke="#0d6efd"
                strokeWidth="2"
                fill="none"
                strokeDasharray={2 * Math.PI * 17}
                strokeDashoffset={(autoTimer / REFRESH_INTERVAL) * 2 * Math.PI * 17}
                strokeLinecap="round"
                style={{ transition: 'stroke-dashoffset 1s linear' }}
              />
            </svg>
          </div>

          {/* Вид */}
          <div className="btn-group me-3">
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
        </Col>
      </Row>

      {/* Склады */}
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
          <Input placeholder="Поиск по названию или коду" value={q} onChange={e => setQ(e.target.value)} />
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
          <Button size="sm" color="secondary" onClick={() => setSortByQtyAsc(prev => (prev === null ? true : !prev))}>
            Сорт. по количеству {sortByQtyAsc === null ? '' : sortByQtyAsc ? '▲' : '▼'}
          </Button>
        </Col>
      </Row>

      {/* Отображение плиток / таблицы */}
      {view === 'list' ? (
        <div className="table-responsive mb-3">
          <table className="table table-sm table-bordered align-middle">
            <thead className="table-light">
              <tr>
                <th>Склад</th>
                <th>Название товара</th>
                <th>Количество</th>
                <th>Код материала</th>
                <th>Категория</th>
              </tr>
            </thead>
            <tbody>
              {paginated.map(t => (
                <tr key={t.id} style={{ background: colorByStock(t.availableStock), cursor: 'pointer' }} onClick={() => setSelectedTile(t)}>
                  <td>{activeSt}</td>
                  <td>{t.title}</td>
                  <td>{t.availableStock}</td>
                  <td>{t.materialCode}</td>
                  <td>{t.categories.join(', ')}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div
          className="tiles-grid"
          style={{
            display: 'grid',
            gridTemplateColumns: view === 'large' ? 'repeat(5, 1fr)' : 'repeat(10, 1fr)',
            gap: 12,
          }}
        >
          {paginated.map(t => (
            <div
              key={t.id}
              className={clsx('tile')}
              style={{
                background: colorByStock(t.availableStock),
                cursor: 'pointer',
              }}
              onClick={() => setSelectedTile(t)}
            >
              <div className="tile-head">
                <div className="tile-title">{t.title}</div>
              </div>
              <div className="tile-comment text-muted small">Код: {t.materialCode}</div>
              {t.imageUrl ? (
                <img className="tile-img" src={t.imageUrl} alt="" />
              ) : (
                <div className="tile-img tile-img--placeholder">нет фото</div>
              )}
              <div className="tile-meta small text-muted">
                Остаток: <b>{t.availableStock}</b>
              </div>
            </div>
          ))}
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

      {/* Модальное окно */}
      <Modal isOpen={!!selectedTile} toggle={() => setSelectedTile(null)} size="lg" centered>
        <ModalHeader toggle={() => setSelectedTile(null)}>{selectedTile?.title}</ModalHeader>
        <ModalBody>
          {selectedTile && (
            <div className="d-flex flex-wrap gap-4 align-items-start">
              <div style={{ flex: '1 1 45%', textAlign: 'center' }}>
                {selectedTile.imageUrl ? (
                  <img
                    src={selectedTile.imageUrl}
                    alt={selectedTile.title}
                    style={{
                      maxWidth: '100%',
                      borderRadius: 8,
                      boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                    }}
                  />
                ) : (
                  <div
                    style={{
                      width: '100%',
                      height: 240,
                      background: '#f1f1f1',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderRadius: 8,
                      color: '#777',
                    }}
                  >
                    нет фото
                  </div>
                )}
              </div>
              <div style={{ flex: '1 1 50%' }}>
                <h5 className="mb-3">{selectedTile.title}</h5>
                <p>
                  <b>Код материала:</b> {selectedTile.materialCode}
                </p>
                <p className="text-muted" style={{ fontSize: 15 }}>
                  <b>Комментарий кладовщика:</b> {selectedTile.comment || <span className="text-secondary">нет данных</span>}
                </p>
              </div>
            </div>
          )}
        </ModalBody>
      </Modal>
    </div>
  );
};

export default WarehouseList;
