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

const REFRESH_INTERVAL = 5000; // каждые 5 секунд

const CartDialog: React.FC<Props> = ({ open, onClose, onAddMore }) => {
  const cart = useCart();
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  const [unavailable, setUnavailable] = useState<string[]>([]);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'warning' | 'info' }>({
    open: false,
    message: '',
    severity: 'info',
  });

  const { items, orderId, storageType } = cart.state;
  const totalPositions = cart.positionsCount;
  const totalQty = cart.totalQty;

  //  Проверка остатков из mechanic/catalog/tiles
  useEffect(() => {
    if (!open || !items.length || !storageType) return;

    const checkAvailability = async () => {
      try {
        const res = await axios.get(`/api/mechanic/catalog/tiles`, {
          params: { storageType, size: 1000 },
        });
        const latest = res.data || [];

        const unavailableNow: string[] = [];
        const updatedItems = items.map(it => {
          const latestItem = latest.find((x: any) => x.materialCode === it.materialCode);
          const newStock = latestItem?.availableStock ?? it.availableStock;
          if (newStock <= 0) unavailableNow.push(it.title);
          return { ...it, availableStock: newStock };
        });

        // если что-то изменилось — обновляем корзину локально
        if (JSON.stringify(items.map(i => i.availableStock)) !== JSON.stringify(updatedItems.map(i => i.availableStock))) {
          cart.state.items = updatedItems;
        }

        // уведомления
        if (unavailableNow.length && unavailableNow.join() !== unavailable.join()) {
          setUnavailable(unavailableNow);
          setSnackbar({
            open: true,
            message: `Некоторые товары больше недоступны: ${unavailableNow.join(', ')}`,
            severity: 'warning',
          });
        } else if (!unavailableNow.length && unavailable.length) {
          setUnavailable([]);
          setSnackbar({
            open: true,
            message: 'Можно продолжить заказ. Убедитесь, что нет возможности заказать товар, аналогичный отсутствующему',
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

  const closeSnackbar = () => setSnackbar({ ...snackbar, open: false });

  return (
    <>
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
              Некоторые товары больше недоступны: {unavailable.join(', ')}.
              <br />
              Удалите их, чтобы продолжить оформление заказа.
            </Alert>
          )}

          {items.length === 0 ? (
            <div className="text-muted">Корзина пуста</div>
          ) : (
            <div className="list-group">
              {items.map(it => {
                const isUnavailable = unavailable.includes(it.title);
                return (
                  <div
                    key={it.id}
                    className="list-group-item d-flex align-items-center justify-content-between"
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
                        <div className="text-muted small">Доступно: {it.availableStock}</div>
                        {isUnavailable && <div className="text-danger small fw-semibold">❌ Нет в наличии</div>}
                      </div>
                    </div>

                    <div className="d-flex align-items-center gap-2">
                      <Button color="secondary" onClick={() => cart.dec(it.id)} disabled={it.qty <= 1 || isUnavailable}>
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
                        disabled={isUnavailable}
                        style={{ width: 72, textAlign: 'center' }}
                      />
                      <Button color="secondary" onClick={() => cart.inc(it.id)} disabled={it.qty >= it.availableStock || isUnavailable}>
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

            {/* современная кнопка с иконкой и мягким эффектом */}
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
            disabled={items.length === 0 || busy || unavailable.length > 0}
            style={{
              minWidth: 180,
              fontWeight: 600,
              boxShadow: '0 4px 12px rgba(25,135,84,0.2)',
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
