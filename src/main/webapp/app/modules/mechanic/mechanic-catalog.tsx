import React, { useEffect, useRef, useState } from 'react';
import axios from 'axios';
import { Button, Col, Input, Row, Spinner } from 'reactstrap';
import clsx from 'clsx';

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
};

const pageSize = 30;

const colorByStock = (qty: number) => {
  if (qty <= 0) return '#ffe5e5';
  if (qty >= 20) return '#e6ffe6';
  return '#fff9e6';
};

// полёт к иконке корзины (для анимации)
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
  clone.style.transition = 'transform 500ms ease, opacity 500ms ease';
  clone.style.willChange = 'transform, opacity';
  clone.style.pointerEvents = 'none';
  document.body.appendChild(clone);

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

  const [storages, setStorages] = useState<string[]>([]);
  const [activeSt, setActiveSt] = useState<string>('');

  const [categories, setCategories] = useState<string[]>([]);
  const [category, setCategory] = useState<string>('');

  const [q, setQ] = useState('');
  const [tiles, setTiles] = useState<Tile[]>([]);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(false);

  const [view, setView] = useState<'large' | 'medium' | 'list'>('medium');

  const [startDlg, setStartDlg] = useState(false);
  const [cartDlg, setCartDlg] = useState(false);

  const cartButtonRef = useRef<HTMLButtonElement | null>(null);

  // режим заказа
  const isOrdering = Boolean(cart.state.orderId);

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

  // загрузка всех плиток (без серверной пагинации)
  const load = async (st = activeSt) => {
    if (!st) return;
    setLoading(true);
    const res = await axios.get<Tile[]>('/api/mechanic/catalog/tiles', {
      params: { storageType: st, sort: 'title,asc' },
    });
    setTiles(res.data || []);
    setPage(0);
    setLoading(false);
  };

  useEffect(() => {
    if (activeSt) load(activeSt);
  }, [activeSt]);

  // фильтрация и пагинация на клиенте
  const filtered = tiles.filter(t => {
    const matchesQuery = q ? t.title.toLowerCase().includes(q.toLowerCase()) : true;
    const matchesCategory = category ? t.categories.includes(category) : true;
    return matchesQuery && matchesCategory;
  });

  const total = filtered.length;
  const pages = Math.max(1, Math.ceil(total / pageSize));
  const paginated = filtered.slice(page * pageSize, (page + 1) * pageSize);

  // уже в корзине
  const inCartQty = (tileId: number) => cart.state.items.find(i => i.id === tileId)?.qty ?? 0;

  // добавление в корзину + анимация
  const handleAdd = (t: Tile, sourceEl?: HTMLElement | null) => {
    if (cart.state.storageType && cart.state.storageType !== activeSt) {
      alert(`В заказ уже добавлены позиции склада ${cart.state.storageType}. Один заказ — один склад.`);
      return;
    }

    const already = inCartQty(t.id);
    if (already >= t.availableStock) return;

    cart.addItem(
      {
        id: t.id,
        title: t.title,
        materialCode: t.materialCode,
        imageUrl: t.imageUrl,
        availableStock: t.availableStock,
      },
      activeSt,
    );

    if (already === 0) {
      const dst = cartButtonRef.current as HTMLElement | null;
      if (sourceEl && dst) flyToCart(sourceEl, dst);
    }
  };

  return (
    <div className="container mt-4 mechanic-catalog">
      <Row className="mb-2 align-items-center">
        <Col>
          <h4>Витрина механика</h4>
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
          <Button color="primary" onClick={() => setStartDlg(true)} disabled={isOrdering}>
            Приступить к созданию заказа
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
          <Input
            placeholder="Поиск по названию"
            value={q}
            onChange={e => {
              setQ(e.target.value);
              setPage(0); // 👈 при изменении строки поиска сбрасываем страницу на первую
            }}
          />
        </Col>
        <Col md="4">
          <select
            className="form-select"
            value={category}
            onChange={e => {
              setCategory(e.target.value);
              setPage(0); // 👈 при смене категории сразу переходим на первую страницу
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
          {loading ? <Spinner size="sm" /> : <span>Всего: {total}</span>}
        </Col>
      </Row>

      {/* Плитки / список */}
      {view !== 'list' ? (
        <div
          className="tiles-grid"
          style={{ display: 'grid', gridTemplateColumns: view === 'large' ? 'repeat(5, 1fr)' : 'repeat(10, 1fr)', gap: 12 }}
        >
          {paginated.map(t => {
            const already = inCartQty(t.id);
            const leftToAdd = Math.max(0, t.availableStock - already);
            const disabled = leftToAdd <= 0;

            return (
              <div
                key={t.id}
                className={clsx('tile', { 'tile--selected': already > 0 })}
                style={{ background: colorByStock(t.availableStock) }}
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
                    {already > 0 && <span className="text-muted ms-2 small">в корзине: {already}</span>}
                  </div>
                </div>

                {isOrdering && (
                  <button
                    className={clsx('tile-add', { disabled })}
                    disabled={disabled}
                    onClick={(e: React.MouseEvent<HTMLElement>) => {
                      const card = e.currentTarget.closest('.tile');
                      const img = card?.querySelector('.tile-img') ?? null;
                      handleAdd(t, (img ?? card) as HTMLElement | null);
                    }}
                    title={disabled ? 'Нет в наличии' : 'Добавить в заказ'}
                  >
                    +
                  </button>
                )}
              </div>
            );
          })}
          {paginated.length === 0 && !loading && <div className="text-muted">Нет данных</div>}
        </div>
      ) : (
        <div className="list-group">
          {paginated.map(t => {
            const already = inCartQty(t.id);
            const leftToAdd = Math.max(0, t.availableStock - already);
            const disabled = leftToAdd <= 0;

            return (
              <div
                key={t.id}
                className={clsx('list-group-item d-flex justify-content-between align-items-center', {
                  'opacity-75': t.availableStock <= 0,
                })}
                style={{ background: colorByStock(t.availableStock) }}
              >
                <div>
                  <div className="fw-bold">{t.title}</div>
                  {t.comment && <div className="small text-muted">{t.comment}</div>}
                  <div className="small text-muted">
                    Склад: {activeSt} · Остаток: {t.availableStock}
                    {already > 0 && <span className="ms-2">в корзине: {already}</span>}
                  </div>
                </div>

                {isOrdering && (
                  <Button
                    color="success"
                    disabled={disabled}
                    onClick={(e: React.MouseEvent<HTMLElement>) => {
                      const row = e.currentTarget.closest('.list-group-item');
                      handleAdd(t, row as HTMLElement | null);
                    }}
                    title={disabled ? 'Нет в наличии' : 'Добавить в заказ'}
                  >
                    +
                  </Button>
                )}
              </div>
            );
          })}
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

      {/* Диалоги */}
      <StartOrderDialog
        open={startDlg}
        onClose={() => setStartDlg(false)}
        onStart={(orderNo: string) => {
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
  );
};

export default MechanicCatalog;
