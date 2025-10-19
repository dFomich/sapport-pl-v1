import React, { useEffect, useRef, useState } from 'react';
import axios from 'axios';
import { Button, Col, Input, Modal, ModalBody, ModalHeader, Row, Spinner } from 'reactstrap';
import clsx from 'clsx';
import RefreshIcon from '@mui/icons-material/Refresh';

import { useCart } from './cart-context';
import StartOrderDialog from './start-order-dialog';
import CartDialog from './cart-dialog';
import TractorButton from './tractor-button';

import './mechanic-catalog.scss';

type Tile = {
  id: number;
  title: string;
  comment?: string;
  imageUrl?: string;
  materialCode: string;
  availableStock: number;
  categories: string[];
  minStockAlert?: number;
};

const pageSize = 30;
const REFRESH_INTERVAL = 30;

const colorByStock = (qty: number, minAlert?: number) => {
  if (qty <= 0) return { bg: '#ffe5e5', border: '#ff6b6b' }; // красный
  if (minAlert && qty <= minAlert) return { bg: '#fff8e1', border: '#ffa94d' }; // жёлтый
  return { bg: '#e3faec', border: '#51cf66' }; // зелёный
};

const flyToCart = (fromEl: HTMLElement, toEl: HTMLElement) => {
  const rect1 = fromEl.getBoundingClientRect();
  const rect2 = toEl.getBoundingClientRect();

  const clone = fromEl.cloneNode(true) as HTMLElement;
  clone.style.position = 'fixed';
  clone.style.left = `${rect1.left}px`;
  clone.style.top = `${rect1.top}px`;
  clone.style.width = `${rect1.width}px`;
  clone.style.height = `${rect1.height}px`;
  clone.style.zIndex = '9999';
  clone.style.transition = 'transform 500ms cubic-bezier(0.34, 1.56, 0.64, 1), opacity 500ms ease';
  clone.style.willChange = 'transform, opacity';
  clone.style.pointerEvents = 'none';
  document.body.appendChild(clone);

  // Частицы эффекта
  for (let i = 0; i < 5; i++) {
    const particle = document.createElement('div');
    particle.style.position = 'fixed';
    particle.style.left = `${rect1.left + rect1.width / 2}px`;
    particle.style.top = `${rect1.top + rect1.height / 2}px`;
    particle.style.width = '8px';
    particle.style.height = '8px';
    particle.style.borderRadius = '50%';
    particle.style.background = '#4dabf7';
    particle.style.zIndex = '9998';
    particle.style.transition = 'all 400ms ease-out';
    particle.style.opacity = '1';
    document.body.appendChild(particle);

    const angle = (Math.PI * 2 * i) / 5;
    const distance = 40 + Math.random() * 20;
    requestAnimationFrame(() => {
      particle.style.transform = `translate(${Math.cos(angle) * distance}px, ${Math.sin(angle) * distance}px)`;
      particle.style.opacity = '0';
    });

    setTimeout(() => particle.remove(), 420);
  }

  const dx = rect2.left - rect1.left;
  const dy = rect2.top - rect1.top;
  const scale = Math.max(0.2, Math.min(0.6, rect2.width / Math.max(1, rect1.width)));

  requestAnimationFrame(() => {
    clone.style.transform = `translate(${dx}px, ${dy}px) scale(${scale})`;
    clone.style.opacity = '0.4';
  });

  setTimeout(() => clone.remove(), 520);
};

const MechanicCatalog: React.FC = () => {
  const cart = useCart();
  const cartButtonRef = useRef<HTMLButtonElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [storages, setStorages] = useState<string[]>([]);
  const [activeSt, setActiveSt] = useState<string>('');
  const [categories, setCategories] = useState<string[]>([]);
  const [category, setCategory] = useState('');
  const [q, setQ] = useState('');
  const [allTiles, setAllTiles] = useState<Tile[]>([]);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(false);
  const [view, setView] = useState<'large' | 'medium' | 'list'>('medium');
  const [startDlg, setStartDlg] = useState(false);
  const [cartDlg, setCartDlg] = useState(false);
  const [autoTimer, setAutoTimer] = useState(REFRESH_INTERVAL);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedTile, setSelectedTile] = useState<Tile | null>(null);

  const isOrdering = Boolean(cart.state.orderId);

  // Анимированный фон
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = document.body.scrollHeight;
    };

    resize();
    window.addEventListener('resize', resize);

    interface Shape {
      x: number;
      y: number;
      size: number;
      speedX: number;
      speedY: number;
      rotation: number;
      rotationSpeed: number;
      opacity: number;
      type: number;
    }

    const shapes: Shape[] = [];
    for (let i = 0; i < 15; i++) {
      shapes.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        size: Math.random() * 50 + 30,
        speedX: (Math.random() - 0.5) * 0.2,
        speedY: (Math.random() - 0.5) * 0.2,
        rotation: Math.random() * Math.PI * 2,
        rotationSpeed: (Math.random() - 0.5) * 0.005,
        opacity: Math.random() * 0.15 + 0.1,
        type: Math.floor(Math.random() * 3),
      });
    }

    const drawShape = (shape: Shape) => {
      ctx.save();
      ctx.translate(shape.x, shape.y);
      ctx.rotate(shape.rotation);

      ctx.strokeStyle = `rgba(30, 144, 255, ${shape.opacity})`;
      ctx.lineWidth = 2;
      ctx.fillStyle = `rgba(120, 190, 255, ${shape.opacity * 0.3})`;

      switch (shape.type) {
        case 0:
          ctx.beginPath();
          ctx.arc(0, 0, shape.size / 2, 0, Math.PI * 2);
          ctx.stroke();
          ctx.fill();
          break;
        case 1:
          ctx.beginPath();
          ctx.rect(-shape.size / 2, -shape.size / 2, shape.size, shape.size);
          ctx.stroke();
          ctx.fill();
          break;
        case 2:
          ctx.beginPath();
          ctx.moveTo(0, -shape.size / 2);
          ctx.lineTo(shape.size / 2, shape.size / 2);
          ctx.lineTo(-shape.size / 2, shape.size / 2);
          ctx.closePath();
          ctx.stroke();
          ctx.fill();
          break;
        default:
          ctx.beginPath();
          ctx.arc(0, 0, shape.size / 2, 0, Math.PI * 2);
          ctx.stroke();
          ctx.fill();
          break;
      }

      ctx.restore();
    };

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      shapes.forEach(shape => {
        shape.x += shape.speedX;
        shape.y += shape.speedY;
        shape.rotation += shape.rotationSpeed;

        if (shape.x < -shape.size) shape.x = canvas.width + shape.size;
        if (shape.x > canvas.width + shape.size) shape.x = -shape.size;
        if (shape.y < -shape.size) shape.y = canvas.height + shape.size;
        if (shape.y > canvas.height + shape.size) shape.y = -shape.size;

        drawShape(shape);
      });

      requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener('resize', resize);
    };
  }, []);

  // Складов
  useEffect(() => {
    axios.get<string[]>('/api/inventory/storage-types').then(r => {
      const list = r.data || [];
      setStorages(list);
      if (list.length && !activeSt) setActiveSt(list[0]);
    });
  }, []);

  // Категорий
  useEffect(() => {
    if (!activeSt) return;
    axios.get<string[]>('/api/mechanic/catalog/categories', { params: { storageType: activeSt } }).then(r => setCategories(r.data || []));
  }, [activeSt]);

  // Первичная загрузка витрины
  const loadTiles = async (st = activeSt) => {
    if (!st) return;
    setLoading(true);
    try {
      const res = await axios.get<Tile[]>('/api/mechanic/catalog/tiles', {
        params: { storageType: st, sort: 'title,asc', size: 1000 },
      });
      const sorted = (res.data || []).sort((a, b) => a.title.localeCompare(b.title));

      // Дебаг: выводим первую плитку чтобы посмотреть структуру
      if (sorted.length > 0) {
        console.warn('Пример плитки с бэкенда (debug):', sorted[0]);
      }

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

  // Автообновление
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

  useEffect(() => {
    setPage(0);
  }, [q, category]);

  const filtered = allTiles
    .filter(t => {
      const byTitle = q ? t.title.toLowerCase().includes(q.toLowerCase()) : true;
      const byCat = category ? t.categories.includes(category) : true;
      return byTitle && byCat;
    })
    .sort((a, b) => a.title.localeCompare(b.title));

  const total = filtered.length;
  const pages = Math.max(1, Math.ceil(total / pageSize));
  const paginated = filtered.slice(page * pageSize, (page + 1) * pageSize);

  const inCartQty = (tileId: number) => cart.state.items.find(i => i.id === tileId)?.qty ?? 0;

  const handleAdd = (t: Tile, sourceEl?: HTMLElement | null) => {
    if (cart.state.storageType && cart.state.storageType !== activeSt) {
      alert(`В заказ уже добавлены позиции склада ${cart.state.storageType}. Один заказ — один склад.`);
      return;
    }
    const already = inCartQty(t.id);
    if (already >= t.availableStock) return;
    cart.addItem({ ...t }, activeSt);
    if (already === 0) {
      const dst = cartButtonRef.current as HTMLElement | null;
      if (sourceEl && dst) flyToCart(sourceEl, dst);
    }
  };

  return (
    <div style={{ position: 'relative', minHeight: '100vh' }}>
      <style>
        {`
          @keyframes shimmer {
            0% {
              background-position: 0% 50%;
            }
            50% {
              background-position: 100% 50%;
            }
            100% {
              background-position: 0% 50%;
            }
          }
          
          .shimmer-button {
            background: linear-gradient(135deg, #51cf66 0%, #37b24d 50%, #2b8a3e 100%) !important;
            background-size: 200% 200% !important;
            animation: shimmer 3s ease-in-out infinite !important;
          }
          
          .shimmer-button:hover:not(:disabled) {
            background: linear-gradient(135deg, #69db7c 0%, #51cf66 50%, #37b24d 100%) !important;
            transform: translateY(-2px);
            box-shadow: 0 6px 16px rgba(55,178,77,0.5) !important;
          }
          
          .shimmer-button:disabled {
            opacity: 0.6;
            cursor: not-allowed;
            animation: none !important;
          }
        `}
      </style>
      {/* Анимированный фон */}
      <canvas
        ref={canvasRef}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          zIndex: 0,
          background: 'linear-gradient(135deg, #f0f8ff 0%, #e8f4fd 50%, #f5faff 100%)',
        }}
      />

      {/* Контент */}
      <div className="container mt-4 mechanic-catalog" style={{ position: 'relative', zIndex: 1 }}>
        <Row className="mb-2 align-items-center">
          <Col>
            <h4 style={{ fontWeight: 700, color: '#2f3542' }}>Витрина механика</h4>
          </Col>

          <Col className="text-end d-flex align-items-center justify-content-end gap-3">
            {/* Refresh */}
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

            <Button
              className="shimmer-button"
              style={{
                background: 'linear-gradient(135deg, #51cf66 0%, #37b24d 100%)',
                backgroundSize: '200% 200%',
                animation: 'shimmer 3s ease-in-out infinite',
                border: 'none',
                boxShadow: '0 4px 12px rgba(55,178,77,0.4)',
                fontWeight: 600,
                color: 'white',
              }}
              onClick={() => setStartDlg(true)}
              disabled={isOrdering}
            >
              Приступить к созданию заказа
            </Button>
          </Col>
        </Row>

        {/* Склады */}
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

        {/* Фильтры */}
        <Row className="g-2 align-items-center mb-3">
          <Col md="6">
            <Input
              placeholder="Поиск по названию"
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
          <Col md="2" className="text-end">
            {loading ? (
              <Spinner size="sm" />
            ) : (
              <span style={{ fontWeight: 600, color: '#495057' }}>
                Всего: <span style={{ color: '#228be6' }}>{total}</span>
              </span>
            )}
          </Col>
        </Row>

        {/* Режимы */}
        {view === 'list' ? (
          <div className="table-responsive mb-3">
            <table className="table table-sm table-bordered align-middle">
              <thead className="table-light">
                <tr>
                  <th>Склад</th>
                  <th>Название товара</th>
                  <th>Количество</th>
                  <th>Комментарий кладовщика</th>
                  <th>Категория</th>
                  <th style={{ width: '6%' }}>Действие</th>
                </tr>
              </thead>
              <tbody>
                {paginated.map(t => {
                  const stockInfo = colorByStock(t.availableStock, t.minStockAlert);
                  return (
                    <tr
                      key={t.id}
                      className={clsx({
                        'row-alert': t.minStockAlert && t.availableStock <= t.minStockAlert && t.availableStock > 0,
                        'row-empty': t.availableStock <= 0,
                      })}
                      style={{
                        background: stockInfo.bg,
                        transition: 'background-color 0.2s ease, transform 0.2s ease, box-shadow 0.2s ease',
                        cursor: !isOrdering ? 'pointer' : 'default',
                        borderLeft: `4px solid ${stockInfo.border}`,
                      }}
                      onClick={() => {
                        if (!isOrdering) setSelectedTile(t);
                      }}
                      onMouseEnter={e => {
                        const el = e.currentTarget as HTMLElement;
                        el.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)';
                        el.style.transform = 'translateY(-2px)';
                      }}
                      onMouseLeave={e => {
                        const el = e.currentTarget as HTMLElement;
                        el.style.boxShadow = 'none';
                        el.style.transform = 'none';
                      }}
                    >
                      <td>{activeSt}</td>
                      <td className="fw-semibold">{t.title}</td>
                      <td>{t.availableStock}</td>
                      <td>{t.comment || ''}</td>
                      <td>{t.categories.join(', ')}</td>
                      <td>
                        {isOrdering && (
                          <Button
                            size="sm"
                            style={{
                              background: 'linear-gradient(135deg, #51cf66 0%, #37b24d 100%)',
                              border: 'none',
                            }}
                            onClick={e => {
                              e.stopPropagation();
                              handleAdd(t);
                            }}
                          >
                            +
                          </Button>
                        )}
                      </td>
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
              const already = inCartQty(t.id);
              const leftToAdd = Math.max(0, t.availableStock - already);
              const disabled = leftToAdd <= 0;
              const stockInfo = colorByStock(t.availableStock, t.minStockAlert);

              return (
                <div
                  key={t.id}
                  className={clsx('tile', { 'tile--selected': already > 0 })}
                  style={{
                    background: `linear-gradient(135deg, ${stockInfo.bg} 0%, rgba(255,255,255,0.9) 100%) !important`,
                    cursor: !isOrdering ? 'pointer' : 'default',
                    borderRadius: 12,
                    border: `2px solid ${stockInfo.border}`,
                    boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
                    transition: 'all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
                    position: 'relative',
                    overflow: 'hidden',
                    padding: '6px',
                  }}
                  onClick={() => {
                    if (!isOrdering) setSelectedTile(t);
                  }}
                  onMouseEnter={e => {
                    const el = e.currentTarget as HTMLElement;
                    el.style.transform = 'translateY(-4px) scale(1.02)';
                    el.style.boxShadow = '0 8px 20px rgba(0,0,0,0.15)';
                    // Сохраняем оригинальный фон при hover
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
                  {t.comment && (
                    <div className="tile-comment text-muted" style={{ fontSize: 9, lineHeight: 1.2 }}>
                      {t.comment}
                    </div>
                  )}
                  {t.imageUrl ? (
                    <img
                      className="tile-img"
                      src={t.imageUrl}
                      alt=""
                      style={{
                        borderRadius: 6,
                        transition: 'transform 0.3s',
                      }}
                    />
                  ) : (
                    <div className="tile-img tile-img--placeholder" style={{ borderRadius: 6, background: '#f1f3f5', fontSize: 10 }}>
                      нет фото
                    </div>
                  )}
                  <div className="tile-meta" style={{ fontWeight: 600, color: '#495057', fontSize: 11 }}>
                    Остаток: <span style={{ color: stockInfo.border, fontSize: 13 }}>{t.availableStock}</span>
                  </div>

                  {isOrdering && (
                    <button
                      className={clsx('tile-add', { disabled })}
                      disabled={disabled}
                      style={{
                        position: 'absolute',
                        inset: 0,
                        display: 'grid',
                        placeItems: 'center',
                        background: disabled ? 'rgba(200, 200, 200, 0.7)' : 'rgba(81, 207, 102, 0.2)',
                        border: 'none',
                        borderRadius: 12,
                        fontWeight: 700,
                        fontSize: 48,
                        color: disabled ? '#999' : '#2b8a3e',
                        boxShadow: 'none',
                        transition: 'all 0.2s',
                        cursor: disabled ? 'not-allowed' : 'pointer',
                        opacity: 0,
                        pointerEvents: 'none',
                      }}
                      onClick={e => {
                        e.stopPropagation();
                        const card = e.currentTarget.closest('.tile');
                        const img = card?.querySelector('.tile-img') ?? null;
                        handleAdd(t, (img ?? card) as HTMLElement);
                      }}
                      onMouseEnter={e => {
                        if (!disabled) {
                          (e.currentTarget as HTMLElement).style.background = 'rgba(81, 207, 102, 0.35)';
                          (e.currentTarget as HTMLElement).style.fontSize = '56px';
                        }
                      }}
                      onMouseLeave={e => {
                        if (!disabled) {
                          (e.currentTarget as HTMLElement).style.background = 'rgba(81, 207, 102, 0.2)';
                          (e.currentTarget as HTMLElement).style.fontSize = '48px';
                        }
                      }}
                    >
                      +
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Пагинация */}
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

        {/* Модалка */}
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
                        borderRadius: 12,
                        boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
                      }}
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
                  <p className="text-muted" style={{ fontSize: 15, lineHeight: 1.6 }}>
                    <b>Описание:</b>{' '}
                    {selectedTile.comment || (
                      <span className="text-secondary" style={{ fontStyle: 'italic' }}>
                        нет описания
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

        {/* Диалоги заказа */}
        <StartOrderDialog
          open={startDlg}
          onClose={() => setStartDlg(false)}
          onStart={orderNo => {
            cart.setOrderId(orderNo);
            setStartDlg(false);
            setCartDlg(true);
          }}
        />

        <CartDialog open={cartDlg} onClose={() => setCartDlg(false)} onAddMore={() => setCartDlg(false)} />

        {isOrdering && (
          <div style={{ position: 'fixed', right: 24, bottom: 24 }}>
            <button
              ref={cartButtonRef}
              type="button"
              style={{ position: 'absolute', visibility: 'hidden', pointerEvents: 'none' }}
              aria-hidden="true"
            />
            <TractorButton onClick={() => setCartDlg(true)} />
          </div>
        )}
      </div>
    </div>
  );
};

export default MechanicCatalog;
