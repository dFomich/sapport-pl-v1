import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Button, Col, Input, Modal, ModalBody, ModalHeader, Row, Spinner } from 'reactstrap';
import clsx from 'clsx';
import RefreshIcon from '@mui/icons-material/Refresh';
import AnimatedBackground from '../../shared/components/AnimatedBackground';
import '../mechanic/mechanic-catalog.scss';

type Tile = {
  id: number;
  title: string;
  materialCode: string;
  comment?: string;
  imageUrl?: string;
  availableStock: number;
  categories: string[];
  minStockAlert?: number;
};

const pageSize = 30;
const REFRESH_INTERVAL = 30;

const colorByStock = (qty: number, minAlert?: number) => {
  if (qty <= 0) return { bg: '#ffe5e5', border: '#ff6b6b' };
  if (minAlert && qty <= minAlert) return { bg: '#fff8e1', border: '#ffa94d' };
  return { bg: '#e3faec', border: '#51cf66' };
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

  useEffect(() => {
    axios.get<string[]>('/api/inventory/storage-types').then(r => {
      const list = r.data || [];
      setStorages(list);
      if (list.length && !activeSt) setActiveSt(list[0]);
    });
  }, []);

  useEffect(() => {
    if (!activeSt) return;
    axios.get<string[]>('/api/mechanic/catalog/categories', { params: { storageType: activeSt } }).then(r => setCategories(r.data || []));
  }, [activeSt]);

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
    <div style={{ position: 'relative', minHeight: '100vh' }}>
      <AnimatedBackground />
      <div className="container mt-4 mechanic-catalog" style={{ position: 'relative', zIndex: 1 }}>
        <Row className="mb-2 align-items-center">
          <Col>
            <h4 style={{ fontWeight: 700, color: '#2f3542' }}>Витрина склада</h4>
          </Col>
          <Col className="text-end d-flex align-items-center justify-content-end gap-3">
            <div
              onClick={refreshStocks}
              title="Обновить остатки"
              style={{
                position: 'relative',
                width: 40,
                height: 40,
                borderRadius: '50%',
                background: isRefreshing ? '#d0ebff' : 'rgba(255,255,255,0.9)',
                border: '2px solid rgba(30,144,255,0.3)',
                cursor: isRefreshing ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.3s',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
              }}
            >
              <RefreshIcon
                style={{
                  fontSize: 20,
                  color: isRefreshing ? '#0d6efd' : '#6c757d',
                  transform: isRefreshing ? 'rotate(360deg)' : 'none',
                  transition: 'transform 1s linear',
                }}
              />
              <svg width="40" height="40" style={{ position: 'absolute', top: 0, left: 0, transform: 'rotate(-90deg)' }}>
                <circle cx="20" cy="20" r="17" stroke="rgba(30,144,255,0.2)" strokeWidth="2" fill="none" />
                <circle
                  cx="20"
                  cy="20"
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
            <div className="btn-group me-3">
              <Button
                style={{
                  background: view === 'large' ? '#0d6efd' : 'rgba(255,255,255,0.9)',
                  border: '1px solid rgba(30,144,255,0.3)',
                  color: view === 'large' ? 'white' : '#495057',
                }}
                onClick={() => setView('large')}
              >
                Крупно
              </Button>
              <Button
                style={{
                  background: view === 'medium' ? '#0d6efd' : 'rgba(255,255,255,0.9)',
                  border: '1px solid rgba(30,144,255,0.3)',
                  color: view === 'medium' ? 'white' : '#495057',
                }}
                onClick={() => setView('medium')}
              >
                Средне
              </Button>
              <Button
                style={{
                  background: view === 'list' ? '#0d6efd' : 'rgba(255,255,255,0.9)',
                  border: '1px solid rgba(30,144,255,0.3)',
                  color: view === 'list' ? 'white' : '#495057',
                }}
                onClick={() => setView('list')}
              >
                Список
              </Button>
            </div>
          </Col>
        </Row>
        <div className="mb-3">
          {storages.map(s => (
            <Button
              key={s}
              style={{
                background: s === activeSt ? 'linear-gradient(135deg, #4dabf7 0%, #228be6 100%)' : 'rgba(255,255,255,0.9)',
                border: `2px solid ${s === activeSt ? '#228be6' : 'rgba(30,144,255,0.2)'}`,
                color: s === activeSt ? 'white' : '#495057',
                marginRight: 8,
                marginBottom: 8,
                fontWeight: s === activeSt ? 600 : 400,
                boxShadow: s === activeSt ? '0 4px 12px rgba(34,139,230,0.25)' : '0 2px 4px rgba(0,0,0,0.05)',
              }}
              onClick={() => setActiveSt(s)}
            >
              {s}
            </Button>
          ))}
        </div>
        <Row className="g-2 align-items-center mb-3">
          <Col md="5">
            <Input
              placeholder="Поиск по названию или коду"
              value={q}
              onChange={e => setQ(e.target.value)}
              style={{
                background: 'rgba(255,255,255,0.9)',
                border: '2px solid rgba(30,144,255,0.2)',
                borderRadius: 8,
              }}
            />
          </Col>
          <Col md="4">
            <select
              className="form-select"
              value={category}
              onChange={e => setCategory(e.target.value)}
              style={{
                background: 'rgba(255,255,255,0.9)',
                border: '2px solid rgba(30,144,255,0.2)',
                borderRadius: 8,
              }}
            >
              <option value="">Все категории</option>
              {categories.map(c => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </Col>
          <Col md="3" className="d-flex gap-2">
            <Button
              size="sm"
              style={{
                background: 'rgba(255,255,255,0.9)',
                border: '2px solid rgba(30,144,255,0.2)',
                color: '#495057',
              }}
              onClick={() => setSortByQtyAsc(prev => (prev === null ? true : !prev))}
            >
              Сорт. по количеству {sortByQtyAsc === null ? '' : sortByQtyAsc ? '▲' : '▼'}
            </Button>
            {loading ? (
              <Spinner size="sm" />
            ) : (
              <span style={{ fontWeight: 600, color: '#495057', lineHeight: '31px' }}>
                Всего: <span style={{ color: '#228be6' }}>{total}</span>
              </span>
            )}
          </Col>
        </Row>
        {view === 'list' ? (
          <div className="table-responsive mb-3">
            <table className="table table-sm table-bordered align-middle">
              <thead className="table-light">
                <tr>
                  <th>Склад</th>
                  <th>Название товара</th>
                  <th>Код материала</th>
                  <th>Количество</th>
                  <th>Категория</th>
                </tr>
              </thead>
              <tbody>
                {paginated.map(t => {
                  const stockInfo = colorByStock(t.availableStock, t.minStockAlert);
                  const isLow = t.minStockAlert && t.availableStock <= t.minStockAlert && t.availableStock > 0;
                  return (
                    <tr
                      key={t.id}
                      className={clsx({ 'row-alert': isLow })}
                      style={{
                        background: stockInfo.bg,
                        transition: 'all 0.2s ease',
                        cursor: 'pointer',
                        borderLeft: `4px solid ${stockInfo.border}`,
                      }}
                      onClick={() => setSelectedTile(t)}
                      onMouseEnter={e => {
                        (e.currentTarget as HTMLElement).style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)';
                        (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)';
                      }}
                      onMouseLeave={e => {
                        (e.currentTarget as HTMLElement).style.boxShadow = 'none';
                        (e.currentTarget as HTMLElement).style.transform = 'none';
                      }}
                    >
                      <td>{activeSt}</td>
                      <td className="fw-semibold">{t.title}</td>
                      <td>{t.materialCode}</td>
                      <td>{t.availableStock}</td>
                      <td>{t.categories.join(', ')}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div
            className="tiles-grid"
            style={{
              display: 'grid',
              gridTemplateColumns: view === 'large' ? 'repeat(5, 1fr)' : 'repeat(10, 1fr)',
              gap: 16,
            }}
          >
            {paginated.map(t => {
              const stockInfo = colorByStock(t.availableStock, t.minStockAlert);
              const isLow = t.minStockAlert && t.availableStock <= t.minStockAlert && t.availableStock > 0;
              return (
                <div
                  key={t.id}
                  className={clsx('tile', { 'tile--alert': isLow })}
                  style={{
                    background: `linear-gradient(135deg, ${stockInfo.bg} 0%, rgba(255,255,255,0.9) 100%) !important`,
                    cursor: 'pointer',
                    borderRadius: 12,
                    border: `2px solid ${stockInfo.border}`,
                    boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                    transition: 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
                    position: 'relative',
                    overflow: 'hidden',
                    padding: '6px',
                  }}
                  onClick={() => setSelectedTile(t)}
                  onMouseEnter={e => {
                    const el = e.currentTarget as HTMLElement;
                    el.style.transform = 'translateY(-4px) scale(1.02)';
                    el.style.boxShadow = '0 8px 20px rgba(0,0,0,0.15)';
                    el.style.background = `linear-gradient(135deg, ${stockInfo.bg} 0%, rgba(255,255,255,0.9) 100%)`;
                  }}
                  onMouseLeave={e => {
                    const el = e.currentTarget as HTMLElement;
                    el.style.transform = 'none';
                    el.style.boxShadow = '0 2px 8px rgba(0,0,0,0.08)';
                    el.style.background = `linear-gradient(135deg, ${stockInfo.bg} 0%, rgba(255,255,255,0.9) 100%)`;
                  }}
                >
                  <div className="tile-head">
                    <div className="tile-title" style={{ fontWeight: 600, color: '#2f3542', fontSize: 12, lineHeight: 1.3 }}>
                      {t.title}
                    </div>
                  </div>
                  <div className="tile-comment text-muted" style={{ fontSize: 9, lineHeight: 1.2 }}>
                    Код: {t.materialCode}
                  </div>
                  {t.imageUrl ? (
                    <img className="tile-img" src={t.imageUrl} alt="" style={{ borderRadius: 6, transition: 'transform 0.3s' }} />
                  ) : (
                    <div className="tile-img tile-img--placeholder" style={{ borderRadius: 6, background: '#f1f3f5', fontSize: 10 }}>
                      нет фото
                    </div>
                  )}
                  <div className="tile-meta" style={{ fontWeight: 600, color: '#495057', fontSize: 11 }}>
                    Остаток: <span style={{ color: stockInfo.border, fontSize: 13 }}>{t.availableStock}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
        <Row className="mt-3">
          <Col className="d-flex justify-content-between">
            <Button
              disabled={page === 0}
              onClick={() => setPage(p => p - 1)}
              style={{
                background: page === 0 ? '#e9ecef' : 'rgba(255,255,255,0.9)',
                border: '2px solid rgba(30,144,255,0.2)',
                color: page === 0 ? '#adb5bd' : '#495057',
              }}
            >
              Назад
            </Button>
            <div style={{ fontWeight: 600, color: '#495057' }}>
              Стр. <span style={{ color: '#228be6' }}>{page + 1}</span> / {pages}
            </div>
            <Button
              disabled={page + 1 >= pages}
              onClick={() => setPage(p => p + 1)}
              style={{
                background: page + 1 >= pages ? '#e9ecef' : 'rgba(255,255,255,0.9)',
                border: '2px solid rgba(30,144,255,0.2)',
                color: page + 1 >= pages ? '#adb5bd' : '#495057',
              }}
            >
              Вперёд
            </Button>
          </Col>
        </Row>
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
                      style={{ maxWidth: '100%', borderRadius: 12, boxShadow: '0 4px 16px rgba(0,0,0,0.12)' }}
                    />
                  ) : (
                    <div
                      style={{
                        width: '100%',
                        height: 240,
                        background: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderRadius: 12,
                        color: '#adb5bd',
                        fontWeight: 600,
                      }}
                    >
                      нет фото
                    </div>
                  )}
                </div>
                <div style={{ flex: '1 1 50%' }}>
                  <h5 className="mb-3" style={{ fontWeight: 700, color: '#2f3542' }}>
                    {selectedTile.title}
                  </h5>
                  <p style={{ fontSize: 15, marginBottom: 8 }}>
                    <b>Код материала:</b> {selectedTile.materialCode}
                  </p>
                  <p className="text-muted" style={{ fontSize: 15, lineHeight: 1.6 }}>
                    <b>Комментарий:</b>{' '}
                    {selectedTile.comment || (
                      <span className="text-secondary" style={{ fontStyle: 'italic' }}>
                        нет комментария
                      </span>
                    )}
                  </p>
                  <div
                    style={{
                      marginTop: 20,
                      padding: 16,
                      background: colorByStock(selectedTile.availableStock, selectedTile.minStockAlert).bg,
                      border: `2px solid ${colorByStock(selectedTile.availableStock, selectedTile.minStockAlert).border}`,
                      borderRadius: 8,
                    }}
                  >
                    <div style={{ fontWeight: 600, marginBottom: 8 }}>
                      Остаток:{' '}
                      <span style={{ fontSize: 18, color: colorByStock(selectedTile.availableStock, selectedTile.minStockAlert).border }}>
                        {selectedTile.availableStock}
                      </span>
                    </div>
                    {selectedTile.categories.length > 0 && (
                      <div style={{ fontSize: 13, color: '#6c757d', marginTop: 4 }}>
                        Категории: <b>{selectedTile.categories.join(', ')}</b>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </ModalBody>
        </Modal>
      </div>
    </div>
  );
};

export default WarehouseList;
