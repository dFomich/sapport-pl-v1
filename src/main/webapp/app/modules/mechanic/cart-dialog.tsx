import React from 'react';
import { Modal, ModalHeader, ModalBody, ModalFooter, Button, Input } from 'reactstrap';
import { useNavigate } from 'react-router-dom';
import { useCart } from './cart-context';

type Props = {
  open: boolean;
  onClose: () => void;
  onAddMore: () => void;
};

const CartDialog: React.FC<Props> = ({ open, onClose, onAddMore }) => {
  const cart = useCart();
  const navigate = useNavigate();
  const [busy, setBusy] = React.useState(false);

  const { items, orderId, storageType } = cart.state;
  const totalPositions = cart.positionsCount;
  const totalQty = cart.totalQty;

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
        const msg = e?.detail || e?.message || 'Не удалось подтвердить заказ. Проверьте корректность позиций и остатки.';

        alert(msg);
      },
    );
  };

  return (
    <Modal isOpen={open} toggle={onClose} size="lg" backdrop="static">
      <ModalHeader toggle={onClose}>
        Корзина
        <small className="ms-3 text-muted">
          Заказ: <b>{orderId || '—'}</b> · Склад: <b>{storageType || '—'}</b> · Позиции: {totalPositions} · Всего шт.: {totalQty}
        </small>
      </ModalHeader>

      <ModalBody>
        {items.length === 0 ? (
          <div className="text-muted">Корзина пуста</div>
        ) : (
          <div className="list-group">
            {items.map(it => (
              <div key={it.id} className="list-group-item d-flex align-items-center justify-content-between">
                <div className="d-flex align-items-center gap-3">
                  {it.imageUrl ? (
                    <img src={it.imageUrl} alt="" style={{ width: 64, height: 48, objectFit: 'cover', borderRadius: 6 }} />
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
                  </div>
                </div>

                <div className="d-flex align-items-center gap-2">
                  <Button color="secondary" onClick={() => cart.dec(it.id)} disabled={it.qty <= 1}>
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
                    style={{ width: 72, textAlign: 'center' }}
                  />
                  <Button color="secondary" onClick={() => cart.inc(it.id)} disabled={it.qty >= it.availableStock}>
                    +
                  </Button>
                  <Button color="danger" onClick={() => cart.remove(it.id)}>
                    Удалить
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </ModalBody>

      <ModalFooter className="d-flex justify-content-between">
        <div className="d-flex gap-2">
          <Button
            color="light"
            onClick={() => {
              cart.reset(); // «Начать сначала»
              onClose();
            }}
          >
            Начать сначала
          </Button>
          <Button color="link" onClick={onAddMore}>
            Добавить товар
          </Button>
        </div>
        <Button color="success" onClick={confirm} disabled={items.length === 0 || busy}>
          {busy ? 'Отправка…' : 'Подтвердить заказ'}
        </Button>
      </ModalFooter>
    </Modal>
  );
};

export default CartDialog;
