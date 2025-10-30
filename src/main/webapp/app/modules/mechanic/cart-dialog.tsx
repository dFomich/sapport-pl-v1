import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Modal, ModalHeader, ModalBody, ModalFooter, Button, Input, Alert } from 'reactstrap';
import Snackbar from '@mui/material/Snackbar';
import MuiAlert from '@mui/material/Alert';
import { useNavigate } from 'react-router-dom';
import { useCart } from './cart-context';

type Props = {
  open: boolean;
  onClose: () => void;
  onAddMore: () => void;
};

const REFRESH_INTERVAL = 1000; // каждую секунду

const CartDialog: React.FC<Props> = ({ open, onClose, onAddMore }) => {
  const cart = useCart();
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  const [unavailable, setUnavailable] = useState<string[]>([]);
  const [exceeded, setExceeded] = useState<number[]>([]); // ID товаров с превышением
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'warning' | 'info' }>({
    open: false,
    message: '',
    severity: 'info',
  });

  const { items, orderId, storageType } = cart.state;
  const totalPositions = cart.positionsCount;
  const totalQty = cart.totalQty;

  // Проверка остатков из mechanic/catalog/tiles
  useEffect(() => {
    if (!open || !items.length || !storageType) return;

    const checkAvailability = async () => {
      try {
        const res = await axios.get(`/api/mechanic/catalog/tiles`, {
          params: { storageType, size: 1000 },
        });
        const latest = res.data || [];

        const unavailableNow: string[] = [];
        const exceededNow: number[] = [];
        const updatedItems = items.map(it => {
          const latestItem = latest.find((x: any) => x.materialCode === it.materialCode);
          const newStock = latestItem?.availableStock ?? it.availableStock;

          // Проверка на полное отсутствие
          if (newStock <= 0) {
            unavailableNow.push(it.title);
          }
          // Проверка на превышение количества
          else if (it.qty > newStock) {
            exceededNow.push(it.id);
          }

          return { ...it, availableStock: newStock };
        });

        // Обновляем корзину локально если что-то изменилось
        if (JSON.stringify(items.map(i => i.availableStock)) !== JSON.stringify(updatedItems.map(i => i.availableStock))) {
          cart.state.items = updatedItems;
        }

        // Уведомления о полном отсутствии товара
        if (unavailableNow.length && unavailableNow.join() !== unavailable.join()) {
          setUnavailable(unavailableNow);
          setSnackbar({
            open: true,
            message: `Некоторые товары больше недоступны: ${unavailableNow.join(', ')}`,
            severity: 'warning',
          });
        } else if (!unavailableNow.length && unavailable.length) {
          setUnavailable([]);
        }

        // Уведомления о превышении количества
        if (exceededNow.length && JSON.stringify(exceededNow) !== JSON.stringify(exceeded)) {
          setExceeded(exceededNow);
          setSnackbar({
            open: true,
            message: 'Количество некоторых товаров превышает доступное. Скорректируйте заказ.',
            severity: 'warning',
          });
        } else if (!exceededNow.length && exceeded.length) {
          setExceeded([]);
          setSnackbar({
            open: true,
            message: 'Можно продолжить заказ.',
            severity: 'success',
          });
        }
      } catch (e) {
        console.warn('Ошибка при обновлении остатков', e);
      }
    };

    checkAvailability();
    const timer = setInterval(checkAvailability, REFRESH_INTERVAL);
    return () => clearInterval(timer);
  }, [open, items, storageType]);

  const confirm = async () => {
    setBusy(true);
    await cart.confirmOrder(
      data => {
        setBusy(false);
        onClose();
        navigate('/mechanic/order-success', { state: { order: data } });
      },
      e => {
        setBusy(false);
        const msg =
          e?.detail ||
          e?.message ||
          (e?.errorKey === 'not_enough'
            ? 'Некоторые товары больше недоступны. Удалите их из корзины и попробуйте снова.'
            : 'Не удалось подтвердить заказ. Проверьте остатки и повторите.');
        setSnackbar({ open: true, message: msg, severity: 'warning' });
      },
    );
  };

  const fixExceeded = (itemId: number) => {
    const item = items.find(it => it.id === itemId);
    if (item) {
      cart.setQty(itemId, item.availableStock);
    }
  };

  const closeSnackbar = () => setSnackbar({ ...snackbar, open: false });

  const hasProblems = unavailable.length > 0 || exceeded.length > 0;

  return (
    <>
      <style>{`
        @keyframes blink-red {
          0%, 100% { background-color: #fff6f6; }
          50% { background-color: #ffe0e0; }
        }
        
        .exceeded-item {
          animation: blink-red 1s ease-in-out infinite;
          border: 2px solid #ff4444 !important;
        }
        
        .fix-button {
          background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
          color: white;
          border: none;
          padding: 0.25rem 0.75rem;
          border-radius: 6px;
          font-size: 0.875rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
        }
        
        .fix-button:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(239, 68, 68, 0.3);
        }
      `}</style>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={closeSnackbar}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <MuiAlert onClose={closeSnackbar} severity={snackbar.severity} variant="filled" elevation={6}>
          {snackbar.message}
        </MuiAlert>
      </Snackbar>

      <Modal isOpen={open} toggle={onClose} size="lg" backdrop="static">
        <ModalHeader toggle={onClose}>
          Корзина
          <small className="ms-3 text-muted">
            Заказ: <b>{orderId || '—'}</b> · Склад: <b>{storageType || '—'}</b> · Позиции: {totalPositions} · Всего шт.: {totalQty}
          </small>
        </ModalHeader>

        <ModalBody>
          {unavailable.length > 0 && (
            <Alert color="warning" fade={true}>
              ❌ Некоторые товары больше недоступны: <strong>{unavailable.join(', ')}</strong>
              <br />
              Удалите их, чтобы продолжить оформление заказа.
            </Alert>
          )}

          {exceeded.length > 0 && (
            <Alert color="danger" fade={true}>
              ⚠️ Количество некоторых товаров превышает доступное!
              <br />
              Нажмите кнопку <b>“Исправить”</b> или измените количество вручную.
            </Alert>
          )}

          {items.length === 0 ? (
            <div className="text-muted">Корзина пуста</div>
          ) : (
            <div className="list-group">
              {items.map(it => {
                const isUnavailable = unavailable.includes(it.title);
                const isExceeded = exceeded.includes(it.id);
                const hasIssue = isUnavailable || isExceeded;

                return (
                  <div
                    key={it.id}
                    className={`list-group-item d-flex align-items-center justify-content-between ${isExceeded ? 'exceeded-item' : ''}`}
                    style={{
                      opacity: isUnavailable ? 0.5 : 1,
                      backgroundColor: isUnavailable ? '#fff6f6' : 'inherit',
                      transition: 'all 0.3s ease',
                    }}
                  >
                    <div className="d-flex align-items-center gap-3">
                      {it.imageUrl ? (
                        <img
                          src={it.imageUrl}
                          alt=""
                          style={{
                            width: 64,
                            height: 48,
                            objectFit: 'cover',
                            borderRadius: 6,
                            filter: isUnavailable ? 'grayscale(100%)' : 'none',
                          }}
                        />
                      ) : (
                        <div
                          style={{
                            width: 64,
                            height: 48,
                            borderRadius: 6,
                            background: '#f1f1f1',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#999',
                            fontSize: 12,
                          }}
                        >
                          нет фото
                        </div>
                      )}
                      <div>
                        <div className="fw-semibold">{it.title}</div>
                        <div className="text-muted small">
                          Доступно: <strong>{it.availableStock}</strong>
                          {isExceeded && (
                            <span className="text-danger ms-2">
                              (Заказано: <strong>{it.qty}</strong>)
                            </span>
                          )}
                        </div>
                        {isUnavailable && <div className="text-danger small fw-semibold">❌ Нет в наличии</div>}
                        {isExceeded && <div className="text-danger small fw-semibold">⚠️ Превышает доступное количество</div>}
                      </div>
                    </div>

                    <div className="d-flex align-items-center gap-2">
                      {isExceeded && (
                        <button className="fix-button" onClick={() => fixExceeded(it.id)} title={`Исправить на ${it.availableStock} шт.`}>
                          Исправить
                        </button>
                      )}
                      <Button color="secondary" onClick={() => cart.dec(it.id)} disabled={it.qty <= 1 || hasIssue}>
                        −
                      </Button>
                      <Input
                        type="number"
                        min={1}
                        max={it.availableStock}
                        value={it.qty}
                        onChange={e => {
                          const v = Math.max(1, Math.min(it.availableStock, Number(e.target.value) || 1));
                          cart.setQty(it.id, v);
                        }}
                        disabled={hasIssue}
                        style={{
                          width: 72,
                          textAlign: 'center',
                          borderColor: isExceeded ? '#ff4444' : undefined,
                        }}
                      />
                      <Button color="secondary" onClick={() => cart.inc(it.id)} disabled={it.qty >= it.availableStock || hasIssue}>
                        +
                      </Button>
                      <Button color="danger" onClick={() => cart.remove(it.id)}>
                        Удалить
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </ModalBody>

        <ModalFooter
          className="d-flex justify-content-between align-items-center flex-wrap gap-2"
          style={{ borderTop: '1px solid #e5e5e5' }}
        >
          <div className="d-flex align-items-center gap-2 flex-wrap">
            <Button
              color="light"
              onClick={() => {
                cart.reset();
                onClose();
              }}
            >
              Начать сначала
            </Button>

            <Button
              color="primary"
              outline
              onClick={onAddMore}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                fontWeight: 500,
                borderRadius: 8,
                transition: 'all 0.2s ease',
              }}
            >
              <i className="bi bi-plus-circle" style={{ fontSize: 18 }}></i>
              Добавить товар
            </Button>
          </div>

          <Button
            color="success"
            onClick={confirm}
            disabled={items.length === 0 || busy || hasProblems}
            style={{
              minWidth: 180,
              fontWeight: 600,
              boxShadow: hasProblems ? 'none' : '0 4px 12px rgba(25,135,84,0.2)',
              opacity: hasProblems ? 0.5 : 1,
            }}
          >
            {busy ? 'Отправка…' : 'Подтвердить заказ'}
          </Button>
        </ModalFooter>
      </Modal>
    </>
  );
};

export default CartDialog;
