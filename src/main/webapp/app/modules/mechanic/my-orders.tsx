import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { format, parseISO, isSameDay } from 'date-fns';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

import { useAppSelector } from 'app/config/store';
import { AUTHORITIES } from 'app/config/constants';
import { hasAnyAuthority } from 'app/shared/auth/private-route';

// Типы данных

type OrderLine = {
  materialCode: string;
  title: string;
  qty: number;
};

type Order = {
  id: number;
  orderId: string;
  mechanicLogin: string;
  createdAt: string;
  storageType: string;
  completed: boolean;
  cancelled?: boolean;
};

const MyOrders = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [mechanicLoginFilter, setMechanicLoginFilter] = useState('');

  const [visibleOrders, setVisibleOrders] = useState<Order[]>([]);
  const [expandedOrderId, setExpandedOrderId] = useState<number | null>(null);
  const [orderLines, setOrderLines] = useState<Record<number, OrderLine[]>>({});
  const [loading, setLoading] = useState(true);

  const [search, setSearch] = useState('');
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [sortAsc, setSortAsc] = useState<boolean | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 25;

  const authorities = useAppSelector(s => s.authentication.account?.authorities || []);
  const isSeniorMechanic = hasAnyAuthority(authorities, [AUTHORITIES.SENIOR_MECHANIC]);

  useEffect(() => {
    const url = isSeniorMechanic
      ? mechanicLoginFilter.trim()
        ? `/api/mechanic-orders/all?mechanic=${encodeURIComponent(mechanicLoginFilter.trim())}`
        : '/api/mechanic-orders/all'
      : '/api/mechanic-orders/my-orders';

    setLoading(true);

    axios
      .get<Order[]>(url)
      .then(res => {
        const sorted = res.data.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
        setOrders(sorted);
        setVisibleOrders(sorted);
      })
      .catch(err => console.error('Ошибка при загрузке заказов:', err))
      .finally(() => setLoading(false));
  }, [mechanicLoginFilter, isSeniorMechanic]);

  useEffect(() => {
    let filtered = [...orders];

    if (search.trim()) {
      filtered = filtered.filter(order => order.orderId.toLowerCase().includes(search.toLowerCase()));
    }

    if (selectedDate) {
      filtered = filtered.filter(order => isSameDay(parseISO(order.createdAt), selectedDate));
    }

    if (sortAsc !== null) {
      filtered.sort((a, b) => (sortAsc ? a.createdAt.localeCompare(b.createdAt) : b.createdAt.localeCompare(a.createdAt)));
    }

    setCurrentPage(1);
    setVisibleOrders(filtered);
  }, [search, selectedDate, sortAsc, orders]);

  const toggleDetails = async (orderId: number) => {
    if (expandedOrderId === orderId) {
      setExpandedOrderId(null);
      return;
    }

    if (!orderLines[orderId]) {
      try {
        const res = await axios.get(`/api/mechanic-orders/${orderId}`);
        setOrderLines(prev => ({ ...prev, [orderId]: res.data.lines ?? [] }));
      } catch (e) {
        console.error('Ошибка загрузки деталей заявки', e);
        return;
      }
    }

    setExpandedOrderId(orderId);
  };

  const startIndex = (currentPage - 1) * itemsPerPage;
  const pagedOrders = visibleOrders.slice(startIndex, startIndex + itemsPerPage);
  const totalPages = Math.ceil(visibleOrders.length / itemsPerPage);

  return (
    <div className="container mt-4">
      <h3>{isSeniorMechanic ? 'Все заявки' : 'Мои заявки'}</h3>

      <div className="d-flex flex-wrap gap-2 mb-3 align-items-center">
        <input
          type="text"
          className="form-control w-auto"
          placeholder="Поиск по номеру заявки"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />

        {isSeniorMechanic && (
          <input
            type="text"
            className="form-control w-auto"
            placeholder="Фильтр по логину механика"
            value={mechanicLoginFilter}
            onChange={e => setMechanicLoginFilter(e.target.value)}
          />
        )}

        <DatePicker
          selected={selectedDate}
          onChange={(date: Date | null) => setSelectedDate(date)}
          className="form-control w-auto"
          placeholderText="Фильтр по дате"
          dateFormat="dd.MM.yyyy"
          isClearable
        />
      </div>

      {loading ? (
        <div>Загрузка...</div>
      ) : pagedOrders.length === 0 ? (
        <div>Нет заявок</div>
      ) : (
        <>
          {pagedOrders.map((order, idx) => (
            <div key={order.id} className="card mb-2">
              <div className="card-header d-flex justify-content-between align-items-center">
                <div>
                  <span className="me-2 text-muted">#{startIndex + idx + 1}</span>
                  <strong>Заказ:</strong> {order.orderId} · <strong>Склад:</strong> {order.storageType} · <strong>Дата:</strong>{' '}
                  {format(new Date(order.createdAt), 'dd.MM.yyyy HH:mm')}
                  {isSeniorMechanic && (
                    <>
                      {' '}
                      · <strong>Механик:</strong> {order.mechanicLogin}
                    </>
                  )}
                </div>

                <div className="d-flex align-items-center gap-2">
                  <span className={`badge ${order.cancelled ? 'bg-danger' : order.completed ? 'bg-success' : 'bg-warning'}`}>
                    {order.cancelled ? 'Удалена' : order.completed ? 'Завершено' : 'В процессе'}
                  </span>

                  <button className="btn btn-outline-primary btn-sm" onClick={() => toggleDetails(order.id)}>
                    {expandedOrderId === order.id ? 'Скрыть детали' : 'Детали'}
                  </button>
                </div>
              </div>

              {expandedOrderId === order.id && (
                <div className="card-body" style={{ animation: 'fadeIn 0.3s ease-in-out' }}>
                  {orderLines[order.id] ? (
                    <table className="table table-sm table-bordered">
                      <thead>
                        <tr>
                          <th>#</th>
                          <th>Код детали</th>
                          <th>Название</th>
                          <th>Кол-во</th>
                        </tr>
                      </thead>
                      <tbody>
                        {orderLines[order.id].map((line, i) => (
                          <tr key={i}>
                            <td>{i + 1}</td>
                            <td>{line.materialCode}</td>
                            <td>{line.title}</td>
                            <td>{line.qty}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <div>Загрузка деталей...</div>
                  )}
                </div>
              )}
            </div>
          ))}

          <div className="mt-3">
            <button className="btn btn-sm btn-outline-secondary" onClick={() => setSortAsc(sortAsc === null ? true : !sortAsc)}>
              Сортировка по дате {sortAsc === null ? '' : sortAsc ? '▲' : '▼'}
            </button>
          </div>

          <div className="mt-3 d-flex justify-content-center gap-2">
            {Array.from({ length: totalPages }, (_, i) => (
              <button
                key={i + 1}
                className={`btn btn-sm ${currentPage === i + 1 ? 'btn-primary' : 'btn-outline-primary'}`}
                onClick={() => setCurrentPage(i + 1)}
              >
                {i + 1}
              </button>
            ))}
          </div>

          <style>
            {`
              @keyframes fadeIn {
                from { opacity: 0; transform: scaleY(0.95); }
                to { opacity: 1; transform: scaleY(1); }
              }
            `}
          </style>
        </>
      )}
    </div>
  );
};

export default MyOrders;
