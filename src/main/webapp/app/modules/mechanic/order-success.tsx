import React, { useMemo, useState } from 'react';
import { Button, Table } from 'reactstrap';
import { useLocation, useNavigate } from 'react-router';

type OrderLine = {
  materialCode: string;
  title: string;
  qty: number;
  imageUrl?: string;
};

type OrderDto = {
  id?: number | string;
  orderName: string;
  storageType: string;
  mechanicLogin: string;
  createdAt: string;
  lines: OrderLine[];
};

const OrderSuccess: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [showBarcodes, setShowBarcodes] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [highlightedCodes, setHighlightedCodes] = useState<string[]>([]);

  const order: OrderDto | null = location.state?.order ?? null;
  const lines = useMemo(() => order?.lines ?? [], [order]);

  const copy = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedCode(code);
    } catch {
      // ignore
    }
  };

  const copyAll = async () => {
    try {
      const allCodes = lines.map(l => `${l.materialCode}\t\t\t${l.qty}`);
      await navigator.clipboard.writeText(allCodes.join('\n'));
      setHighlightedCodes(lines.map(l => l.materialCode));
      setTimeout(() => setHighlightedCodes([]), 1500); // Подсветка на 1.5 сек
    } catch {
      // ignore
    }
  };

  if (!order) {
    return (
      <div className="container mt-4">
        <h4>Заказ создан</h4>
        <div className="text-muted">Не удалось отобразить детали заказа.</div>
        <Button className="mt-3" color="primary" onClick={() => navigate('/mechanic/catalog')}>
          На витрину
        </Button>
      </div>
    );
  }

  const formattedDate = new Date(order.createdAt).toLocaleString('ru-RU');

  return (
    <div className="container mt-4">
      <h4>
        Заказ на тягач\прицеп: <b>{order.orderName}</b>
      </h4>
      <div className="text-muted mb-3">
        Механик: <b>{order.mechanicLogin}</b> · Склад: <b>{order.storageType}</b> · Дата: <b>{formattedDate}</b>
      </div>

      <div className="d-flex justify-content-between align-items-center mb-2">
        <div className="fw-bold">Состав заказа</div>
      </div>

      <Table responsive hover bordered>
        <thead>
          <tr>
            <th style={{ width: 60 }}>#</th>
            <th>Код детали</th>
            <th>Название</th>
            <th style={{ width: 120 }}>Кол-во</th>
          </tr>
        </thead>
        <tbody>
          {lines.map((l, idx) => {
            const isHighlighted = highlightedCodes.includes(l.materialCode);
            const isCopied = copiedCode === l.materialCode;

            return (
              <tr key={l.materialCode + idx}>
                <td>{idx + 1}</td>
                <td>
                  <div className="d-flex align-items-center gap-2">
                    <code
                      style={{
                        fontSize: '1.25rem',
                        color: isCopied || isHighlighted ? '#28a745' : '#dc3545',
                        transition: 'color 0.3s ease',
                      }}
                    >
                      {l.materialCode}
                    </code>
                    <Button size="sm" color="link" onClick={() => copy(l.materialCode)} title="Скопировать" style={{ padding: 0 }}>
                      {isCopied ? '✅' : '📋'}
                    </Button>
                  </div>
                </td>
                <td>{l.title}</td>
                <td>{l.qty}</td>
              </tr>
            );
          })}
        </tbody>
      </Table>

      <div className="d-flex gap-2 mb-3">
        <Button color="primary" onClick={copyAll}>
          Скопировать всё
        </Button>
        <Button color="primary" onClick={() => navigate('/mechanic/catalog')}>
          Вернуться на витрину
        </Button>
      </div>
    </div>
  );
};

export default OrderSuccess;
