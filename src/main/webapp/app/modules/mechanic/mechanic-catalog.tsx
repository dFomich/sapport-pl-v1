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
  const [category, setCategory] = useState('');
  const [q, setQ] = useState('');
  const [tiles, setTiles] = useState<Tile[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(false);
  const [view, setView] = useState<'large' | 'medium' | 'list'>('medium');
  const [startDlg, setStartDlg] = useState(false);
  const [cartDlg, setCartDlg] = useState(false);
  const cartButtonRef = useRef<HTMLButtonElement | null>(null);
  const isOrdering = Boolean(cart.state.orderId);

  useEffect(() => {
    axios.get<string[]>('/api/inventory/storage-types').then(r => {
      const list = r.data || [];
      setStorages(list);
      if (list.length && !activeSt) setActiveSt(list[0]);
    });
  }, []);

  useEffect(() => {
    if (!activeSt) return;
    axios
      .get<string[]>('/api/mechanic/catalog/categories', {
        params: { storageType: activeSt },
      })
      .then(r => setCategories(r.data || []));
  }, [activeSt]);

  const load = async (p = 0, st = activeSt, qStr = q, cat = category) => {
    if (!st) return;
    setLoading(true);
    try {
      const res = await axios.get<Tile[]>('/api/mechanic/catalog/tiles', {
        params: {
          storageType: st,
          q: qStr || undefined,
          category: cat || undefined,
          page: p,
          size: pageSize,
          sort: 'title,asc',
        },
      });
      setTiles(res.data);
      setTotal(Number(res.headers['x-total-count'] || 0));
      setPage(p);
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (activeSt) load(0, activeSt);
  }, [activeSt]);

  useEffect(() => {
    const t = setTimeout(() => load(0), 300);
    return () => clearTimeout(t);
  }, [q, category]);

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
            Приступить к заказу
          </Button>
        </Col>
      </Row>

      <div className="mb-3">
        {storages.map(s => (
          <Button key={s} color={s === activeSt ? 'primary' : 'secondary'} className="me-2 mb-2" onClick={() => setActiveSt(s)}>
            {s}
          </Button>
        ))}
      </div>

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

      <div
        className="tiles-grid"
        style={{ display: 'grid', gridTemplateColumns: view === 'large' ? 'repeat(5, 1fr)' : 'repeat(10, 1fr)', gap: 12 }}
      >
        {tiles.map(t => {
          const already = inCartQty(t.id);
          const leftToAdd = Math.max(0, t.availableStock - already);
          const disabled = leftToAdd <= 0;

          return (
            <div
              key={t.id}
              className={clsx('tile', { 'tile--selected': already > 0 })}
              style={{ background: colorByStock(t.availableStock) }}
            >
              <div className="tile-head">
                <div className="tile-title">{t.title}</div>
              </div>
              {t.comment && <div className="tile-comment text-muted small">{t.comment}</div>}
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
                  onClick={e => {
                    const card = e.currentTarget.closest('.tile');
                    const img = card?.querySelector('.tile-img') ?? null;
                    handleAdd(t, (img ?? card) as HTMLElement);
                  }}
                >
                  +
                </button>
              )}
            </div>
          );
        })}
        {tiles.length === 0 && !loading && <div className="text-muted">Нет данных</div>}
      </div>

      <Row className="mt-3">
        <Col className="d-flex justify-content-between">
          <Button disabled={page === 0} onClick={() => load(page - 1)}>
            Назад
          </Button>
          <div>
            Стр. {page + 1} / {Math.max(1, Math.ceil(total / pageSize))}
          </div>
          <Button disabled={(page + 1) * pageSize >= total} onClick={() => load(page + 1)}>
            Вперёд
          </Button>
        </Col>
      </Row>

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
  );
};

export default MechanicCatalog;
