import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import { format, parseISO, isSameDay } from 'date-fns';
import DatePicker from 'react-datepicker';
import Modal from 'react-bootstrap/Modal';
import Button from 'react-bootstrap/Button';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import QRCode from 'qrcode';
import 'react-datepicker/dist/react-datepicker.css';
import 'bootstrap/dist/css/bootstrap.min.css';
import '../../shared/pdf/dejavuFont';

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
  lines: OrderLine[];
};

const WarehouseOrders = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [visibleOrders, setVisibleOrders] = useState<Order[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [search, setSearch] = useState('');
  const [sortAsc, setSortAsc] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [activeTab, setActiveTab] = useState<'active' | 'archive'>('active');
  const itemsPerPage = 25;
  const printRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    axios
      .get<Order[]>('/api/mechanic-orders/warehouse/orders')
      .then(res => {
        const sorted = res.data.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
        setOrders(sorted);
      })
      .catch(err => console.error('Ошибка при загрузке заказов:', err))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    let filtered = [...orders];
    filtered = filtered.filter(order => (activeTab === 'active' ? !order.completed : order.completed));

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
  }, [orders, search, selectedDate, sortAsc, activeTab]);

  const startIndex = (currentPage - 1) * itemsPerPage;
  const pagedOrders = visibleOrders.slice(startIndex, startIndex + itemsPerPage);
  const totalPages = Math.ceil(visibleOrders.length / itemsPerPage);

  const handleDownloadPdf = async (orderId: string) => {
    const order = orders.find(o => o.orderId === orderId);
    if (!order) return;

    const doc = new jsPDF({ unit: 'pt', format: 'a4' });
    doc.setFont('DejaVuSans', 'normal');

    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const marginLeft = 50;
    const marginRight = 50;

    const logoWidth = 110;
    const logoHeight = 35;
    const qrSize = 50;
    const cellHeight = qrSize + 14;

    // === ГРАДИЕНТ ===
    const gradientHeight = 120;
    for (let y = 0; y < gradientHeight; y++) {
      const t = y / gradientHeight;
      const r = 225 + t * 25;
      const g = 235 + t * 20;
      const b = 255;
      doc.setFillColor(r, g, b);
      doc.rect(0, y, pageWidth, 1, 'F');
    }

    // === ЛОГОТИП (справа) ===
    try {
      const logo = new Image();
      logo.src = 'content/images/logo-sapport.png';
      await new Promise<void>(resolve => {
        logo.onload = () => resolve();
        logo.onerror = () => resolve();
      });
      const logoX = pageWidth - logoWidth - marginRight;
      const logoY = 25;
      doc.addImage(logo, 'PNG', logoX, logoY, logoWidth, logoHeight, '', 'FAST');
    } catch {
      console.warn('⚠️ Логотип не найден — пропускаем');
    }

    // === ЗАГОЛОВОК ===
    const headerY = 110;
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(18);
    doc.text(`Заявка на выдачу #${order.orderId}`, marginLeft, headerY);
    doc.setFontSize(12);
    doc.text(`Дата: ${format(new Date(order.createdAt), 'dd.MM.yyyy HH:mm')}`, marginLeft, headerY + 22);
    doc.text(`Механик: ${order.mechanicLogin}`, marginLeft, headerY + 40);

    // === Тонкая разделительная линия под шапкой ===
    doc.setDrawColor(210, 210, 210);
    doc.setLineWidth(0.6);
    doc.line(marginLeft, headerY + 55, pageWidth - marginRight, headerY + 55);

    // === Подготовка таблицы ===
    const rows: any[] = [];
    for (let i = 0; i < order.lines.length; i++) {
      const line = order.lines[i];
      const qrDataUrl = await QRCode.toDataURL(line.materialCode, { margin: 0 });
      rows.push([i + 1, line.materialCode, line.title, String(line.qty), { image: qrDataUrl }]);
    }

    // === Таблица ===
    autoTable(doc, {
      startY: headerY + 70,
      head: [['#', 'Код', 'Название', 'Кол-во', 'QR-код']],
      body: rows.map(r => [r[0], r[1], r[2], r[3], '']),
      styles: {
        font: 'DejaVuSans',
        fontSize: 11,
        cellPadding: 6,
        minCellHeight: cellHeight,
        valign: 'middle',
      },
      headStyles: {
        fillColor: [48, 84, 150],
        textColor: 255,
        fontStyle: 'bold',
        halign: 'center',
        minCellHeight: 22,
      },
      columnStyles: {
        0: { halign: 'center', cellWidth: 35 },
        1: { halign: 'center', cellWidth: 100 },
        2: { cellWidth: 260 },
        3: { halign: 'center', cellWidth: 60 },
        4: { halign: 'center', cellWidth: 80 }, // 👈 уменьшено, чтобы QR не упирался в край
      },
      margin: { left: marginLeft, right: marginRight }, // 👈 фикс: равные поля
      tableWidth: pageWidth - marginLeft - marginRight, // 👈 обязательная коррекция ширины
      didDrawCell(data) {
        if (data.cell.section === 'body' && data.column.index === 4) {
          const src = rows[data.row.index]?.[4]?.image;
          if (src) {
            const x = data.cell.x + (data.cell.width - qrSize) / 2;
            const y = data.cell.y + (data.cell.height - qrSize) / 2;
            doc.addImage(src, 'PNG', x, y, qrSize, qrSize);
          }
        }
      },
    });

    // === ФУТЕР ===
    doc.setFontSize(10);
    doc.setTextColor(130, 130, 130);
    doc.text('Документ сгенерирован автоматически системой SAPPort', marginLeft, pageHeight - 45);
    doc.text('© 2025 SAPPort', pageWidth - 130, pageHeight - 45);

    doc.save(`SAPPort_order_${order.orderId}.pdf`);
  };

  const markOrderAsCompleted = async (orderId: string) => {
    try {
      await axios.put(`/api/mechanic-orders/${orderId}/complete`);
      alert('Заявка отмечена как завершённая');
      setOrders(prev => prev.map(o => (o.orderId === orderId ? { ...o, completed: true } : o)));
      setSelectedOrder(null);
    } catch (e) {
      alert('Не удалось отметить заявку как завершённую.');
    }
  };

  // Быстрая печать через iframe
  const handleQuickPrint = (order: Order) => {
    const iframe = document.createElement('iframe');
    iframe.style.position = 'absolute';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    document.body.appendChild(iframe);

    const doc = iframe.contentWindow?.document;
    if (!doc) return;

    doc.open();
    doc.write(`
      <html>
        <head>
          <title>Заявка ${order.orderId}</title>
          <meta charset="UTF-8" />
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto,
                           "Helvetica Neue", Arial, "DejaVu Sans", "Noto Sans", sans-serif;
              padding: 20px;
              font-size: 14px;
            }
            h2 { margin-bottom: 10px; }
            p { margin: 0 0 12px 0; }
            table { width: 100%; border-collapse: collapse; }
            th, td { border: 1px solid #000; padding: 6px; text-align: left; }
            th { background: #f2f6ff; }
            @media print { @page { margin: 12mm; } }
          </style>
        </head>
        <body>
          <h2>Заявка #${order.orderId}</h2>
          <p><strong>Дата:</strong> ${format(new Date(order.createdAt), 'dd.MM.yyyy HH:mm')}</p>
          <p><strong>Механик:</strong> ${order.mechanicLogin}</p>
          <table>
            <thead>
              <tr>
                <th style="width:40px">#</th>
                <th>Название</th>
                <th style="width:80px">Кол-во</th>
              </tr>
            </thead>
            <tbody>
              ${order.lines
                .map(
                  (line, i) => `
                  <tr>
                    <td>${i + 1}</td>
                    <td>${line.title}</td>
                    <td>${line.qty}</td>
                  </tr>`,
                )
                .join('')}
            </tbody>
          </table>
        </body>
      </html>
    `);
    doc.close();

    iframe.contentWindow?.focus();
    iframe.contentWindow?.print();

    setTimeout(() => document.body.removeChild(iframe), 1000);
  };

  return (
    <div className="container mt-4">
      <h3>Заявки на выдачу</h3>

      <div className="btn-group mb-3">
        <button className={`btn ${activeTab === 'active' ? 'btn-primary' : 'btn-outline-primary'}`} onClick={() => setActiveTab('active')}>
          В процессе
        </button>
        <button
          className={`btn ${activeTab === 'archive' ? 'btn-primary' : 'btn-outline-primary'}`}
          onClick={() => setActiveTab('archive')}
        >
          Архив
        </button>
      </div>

      <div className="d-flex flex-wrap gap-2 mb-3 align-items-center">
        <input
          type="text"
          className="form-control w-auto"
          placeholder="Поиск по номеру заявки"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
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
            <div key={order.orderId} className="card mb-2">
              <div className="card-header d-flex justify-content-between align-items-center">
                <div>
                  <span className="me-2 text-muted">#{startIndex + idx + 1}</span>
                  <strong>Заказ:</strong> {order.orderId} · <strong>Склад:</strong> {order.storageType} · <strong>Дата:</strong>{' '}
                  {format(new Date(order.createdAt), 'dd.MM.yyyy HH:mm')}
                </div>
                <div className="d-flex align-items-center gap-2">
                  <span className={`badge ${order.completed ? 'bg-success' : 'bg-warning'}`}>
                    {order.completed ? 'Завершено' : 'В процессе'}
                  </span>
                  <button className="btn btn-outline-primary btn-sm" onClick={() => setSelectedOrder(order)}>
                    Детали
                  </button>
                </div>
              </div>
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
        </>
      )}

      <Modal show={!!selectedOrder} onHide={() => setSelectedOrder(null)} size="lg" centered>
        <Modal.Header closeButton>
          <Modal.Title>Заявка #{selectedOrder?.orderId}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedOrder && (
            <div ref={printRef}>
              <p>
                <strong>Дата:</strong> {format(new Date(selectedOrder.createdAt), 'dd.MM.yyyy HH:mm')} <br />
                <strong>Механик:</strong> {selectedOrder.mechanicLogin}
              </p>
              <table className="table table-bordered table-sm">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Код</th>
                    <th>Название</th>
                    <th>Кол-во</th>
                  </tr>
                </thead>
                <tbody>
                  {selectedOrder.lines.map((line, i) => (
                    <tr key={i}>
                      <td>{i + 1}</td>
                      <td>{line.materialCode}</td>
                      <td>{line.title}</td>
                      <td>{line.qty}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          {selectedOrder && (
            <>
              <Button variant="outline-secondary" onClick={() => handleQuickPrint(selectedOrder)}>
                🖨️ Печать
              </Button>
              <Button variant="outline-primary" onClick={() => handleDownloadPdf(selectedOrder.orderId)}>
                📄 PDF
              </Button>
              {!selectedOrder.completed && (
                <Button variant="success" onClick={() => markOrderAsCompleted(selectedOrder.orderId)}>
                  Заявка выдана
                </Button>
              )}
            </>
          )}
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default WarehouseOrders;
