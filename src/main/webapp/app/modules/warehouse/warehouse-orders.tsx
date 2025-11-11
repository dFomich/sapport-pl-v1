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
import './warehouse-orders.scss';
import 'app/shared/pdf/dejavuFont';
import { preloadDejaVuFont, addDejaVuFont, isFontLoaded } from 'app/shared/pdf/dejavuFont';

type OrderLine = {
  materialCode: string;
  title: string;
  qty: number;
  originalQty?: number;
  removed?: boolean;
};

type Order = {
  id: number;
  orderId: string;
  mechanicLogin: string;
  createdAt: string;
  storageType: string;
  completed: boolean;
  cancelled?: boolean;
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
  const [editMode, setEditMode] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [refreshProgress, setRefreshProgress] = useState(0);
  const itemsPerPage = 25;
  const printRef = useRef<HTMLDivElement>(null);
  const [exportFrom, setExportFrom] = useState<Date | null>(null);
  const [exportTo, setExportTo] = useState<Date | null>(null);
  const [showExportPanel, setShowExportPanel] = useState(false);
  const [searchMaterial, setSearchMaterial] = useState('');

  useEffect(() => {
    fetchOrders();

    preloadDejaVuFont().catch(err => {
      console.error('Не удалось загрузить шрифт DejaVu:', err);
    });

    // Автоматическое обновление каждые 30 секунд
    const refreshInterval = setInterval(() => {
      fetchOrders();
    }, 30000);

    // Прогресс-бар для визуализации времени до следующего обновления
    const progressInterval = setInterval(() => {
      setRefreshProgress(prev => {
        const newProgress = prev + 100 / 300; // 30 секунд = 300 интервалов по 100мс
        if (newProgress >= 100) {
          return 0; // Сброс после достижения 100%
        }
        return newProgress;
      });
    }, 100);

    return () => {
      clearInterval(refreshInterval);
      clearInterval(progressInterval);
    };
  }, []);

  const fetchOrders = () => {
    if (isRefreshing) return;

    setIsRefreshing(true);
    setRefreshProgress(0);

    axios
      .get<Order[]>('/api/mechanic-orders/warehouse/orders')
      .then(res => {
        const sorted = res.data.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
        setOrders(sorted);
      })
      .catch(err => console.error('Ошибка при загрузке заказов:', err))
      .finally(() => {
        setLoading(false);
        setTimeout(() => {
          setIsRefreshing(false);
        }, 500); // Небольшая задержка для плавности
      });
  };

  useEffect(() => {
    let filtered = [...orders];

    // фильтр по вкладке
    filtered = filtered.filter(order => (activeTab === 'active' ? !order.completed : order.completed));

    // фильтр по номеру заявки
    if (search.trim()) {
      filtered = filtered.filter(order => order.orderId.toLowerCase().includes(search.toLowerCase()));
    }

    // фильтр по коду детали (по всем строкам)
    if (searchMaterial.trim()) {
      filtered = filtered.filter(order => order.lines.some(line => line.materialCode.toLowerCase().includes(searchMaterial.toLowerCase())));
    }

    // фильтр по дате
    if (selectedDate) {
      filtered = filtered.filter(order => isSameDay(parseISO(order.createdAt), selectedDate));
    }

    // сортировка
    if (sortAsc !== null) {
      filtered.sort((a, b) => (sortAsc ? a.createdAt.localeCompare(b.createdAt) : b.createdAt.localeCompare(a.createdAt)));
    }

    setCurrentPage(1);
    setVisibleOrders(filtered);
  }, [orders, search, searchMaterial, selectedDate, sortAsc, activeTab]);

  // 🔹 Сброс фильтров при переключении вкладки
  useEffect(() => {
    setSearch('');
    setSearchMaterial('');
    setSelectedDate(null);
  }, [activeTab]);

  const startIndex = (currentPage - 1) * itemsPerPage;
  const pagedOrders = visibleOrders.slice(startIndex, startIndex + itemsPerPage);
  const totalPages = Math.ceil(visibleOrders.length / itemsPerPage);

  const handleDownloadPdf = async (orderId: string) => {
    const order = orders.find(o => o.orderId === orderId);
    if (!order) return;

    try {
      if (!isFontLoaded()) {
        console.warn('⏳ Шрифт ещё не загружен, ждём...');
        await preloadDejaVuFont();
      }

      const doc = new jsPDF({ unit: 'pt', format: 'a4' });

      addDejaVuFont(doc);
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

      // === ЛОГОТИП ===
      try {
        const logo = new Image();
        logo.src = 'content/images/logo-sapport.png';
        await new Promise<void>(resolve => {
          logo.onload = () => resolve();
          logo.onerror = () => resolve();
        });
        const logoX = marginLeft;
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

      // === Разделительная линия ===
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
          4: { halign: 'center', cellWidth: 80 },
        },
        margin: { left: marginLeft, right: marginRight },
        tableWidth: pageWidth - marginLeft - marginRight,
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
    } catch (error) {
      console.error('Ошибка генерации PDF:', error);
      alert('Не удалось создать PDF. Проверьте консоль для деталей.');
    }
  };

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

  const markOrderAsCompleted = async (orderId: string) => {
    try {
      await axios.put(`/api/mechanic-orders/${orderId}/complete`);
      setOrders(prev => prev.map(o => (o.orderId === orderId ? { ...o, completed: true } : o)));
      setSelectedOrder(null);
    } catch (e) {
      alert('Не удалось отметить заявку как завершённую.');
    }
  };

  const saveEditedOrder = async () => {
    if (!selectedOrder) return;
    try {
      await axios.put(`/api/mechanic-orders/${selectedOrder.orderId}/lines`, selectedOrder.lines);
      setOrders(prev => prev.map(o => (o.orderId === selectedOrder.orderId ? selectedOrder : o)));
      setEditMode(false);
    } catch (e) {
      alert('Ошибка при сохранении изменений');
    }
  };

  const deleteEntireOrder = async () => {
    if (!selectedOrder) return;
    if (!window.confirm('Удалить всю заявку?')) return;
    try {
      await axios.put(`/api/mechanic-orders/${selectedOrder.orderId}/cancel`);
      setOrders(prev => prev.map(o => (o.orderId === selectedOrder.orderId ? { ...o, completed: true, cancelled: true } : o)));
      setSelectedOrder(null);
    } catch {
      alert('Ошибка при удалении заявки');
    }
  };

  // ✅ ДОБАВЛЕНО: Экспорт заявок в Excel
  const handleExportExcel = async () => {
    if (!exportFrom || !exportTo) {
      alert('Выберите период для экспорта');
      return;
    }

    const fromIso = exportFrom.toISOString();
    const toIso = exportTo.toISOString();

    try {
      const response = await axios.get('/api/mechanic-orders/export', {
        params: { from: fromIso, to: toIso },
        responseType: 'blob',
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      const fileName = `заявки_${format(exportFrom, 'dd.MM.yyyy')}_${format(exportTo, 'dd.MM.yyyy')}.xlsx`;
      link.setAttribute('download', fileName);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Ошибка экспорта:', err);
      alert('Не удалось выполнить экспорт заявок');
    }
  };

  return (
    <div className="warehouse-orders container mt-4">
      <style>{`
        .modern-modal .modal-content {
          border-radius: 8px;
          border: none;
          box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
          background: linear-gradient(135deg, #2d3748 0%, #1a202c 100%);
        }
        
        .modern-modal .modal-header {
          background: linear-gradient(135deg, #3d4f66 0%, #2d3e50 100%);
          color: white;
          border: none;
          padding: 1.25rem 1.5rem;
          border-bottom: 1px solid #4a5568;
        }
        
        .modern-modal .modal-title {
          font-weight: 600;
          font-size: 1.25rem;
        }
        
        .modern-modal .btn-close {
          filter: brightness(0) invert(1);
          opacity: 0.7;
        }
        
        .modern-modal .btn-close:hover {
          opacity: 1;
        }
        
        .modern-modal .modal-body {
          padding: 1.5rem;
          background: linear-gradient(135deg, #2d3748 0%, #1a202c 100%);
        }
        
        .modern-modal .modal-footer {
          border: none !important;
          padding: 1rem 1.5rem !important;
          background: linear-gradient(135deg, #2d3748 0%, #1a202c 100%) !important;
          border-top: 1px solid #4a5568 !important;
          display: flex !important;
          justify-content: space-between !important;
          align-items: center !important;
          flex-direction: row !important;
        }
        
        .modal-footer-left {
          display: flex !important;
          gap: 0.5rem !important;
          align-items: center !important;
          flex-shrink: 0 !important;
        }
        
        .modal-footer-right {
          display: flex !important;
          gap: 0.5rem !important;
          align-items: center !important;
          margin-left: auto !important;
        }
        
        .info-card {
          background: linear-gradient(135deg, #374151 0%, #2d3748 100%);
          border-radius: 6px;
          padding: 1rem;
          margin-bottom: 1rem;
          color: #e5e7eb;
          border: 1px solid #4a5568;
        }
        
        .info-card strong {
          color: #60a5fa;
          font-weight: 600;
        }
        
        .info-card p {
          margin-bottom: 0.5rem;
        }
        
        .info-card p:last-child {
          margin-bottom: 0;
        }
        
        .modern-table {
          background: linear-gradient(135deg, #374151 0%, #2d3748 100%);
          border-radius: 6px;
          overflow: hidden;
          border: 1px solid #4a5568;
        }
        
        .modern-table thead {
          background: linear-gradient(135deg, #3d4f66 0%, #2d3e50 100%);
          color: white;
        }
        
        .modern-table thead th {
          border: none;
          padding: 0.875rem 1rem;
          font-weight: 600;
          text-transform: uppercase;
          font-size: 0.75rem;
          letter-spacing: 0.5px;
        }
        
        .modern-table tbody tr {
          transition: background-color 0.15s ease;
          color: #e5e7eb;
        }
        
        .modern-table tbody tr:hover {
          background: #3d4f66;
        }
        
        .modern-table tbody td {
          padding: 0.875rem 1rem;
          vertical-align: middle;
          border-bottom: 1px solid #4a5568;
        }
        
        .modern-table tbody tr:last-child td {
          border-bottom: none;
        }
        
        .btn-system {
          border-radius: 6px;
          padding: 0.5rem 1rem;
          font-weight: 500;
          border: none;
          transition: all 0.2s ease;
          font-size: 0.875rem;
        }
        
        .btn-system:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
        }
        
        .btn-system:active {
          transform: translateY(0);
        }
        
        .btn-icon {
          width: 40px !important;
          height: 40px !important;
          min-width: 40px !important;
          border-radius: 6px !important;
          padding: 0 !important;
          margin: 0 !important;
          border: none !important;
          transition: all 0.2s ease !important;
          font-size: 1.25rem !important;
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
          position: relative !important;
          cursor: pointer !important;
        }
        
        .btn-icon:hover {
          transform: translateY(-2px) !important;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3) !important;
        }
        
        .btn-icon:active {
          transform: translateY(0) !important;
        }
        
        .btn-icon::after {
          content: attr(data-tooltip) !important;
          position: absolute !important;
          bottom: 110% !important;
          left: 50% !important;
          transform: translateX(-50%) !important;
          background: rgba(0, 0, 0, 0.9) !important;
          color: white !important;
          padding: 0.375rem 0.75rem !important;
          border-radius: 4px !important;
          font-size: 0.75rem !important;
          white-space: nowrap !important;
          opacity: 0 !important;
          pointer-events: none !important;
          transition: opacity 0.2s ease !important;
          z-index: 9999 !important;
        }
        
        .btn-icon:hover::after {
          opacity: 1 !important;
        }
        
        .btn-print {
          background: #6b7280;
          color: white;
        }
        
        .btn-print:hover {
          background: #4b5563;
        }
        
        .btn-pdf {
          background: #3b82f6;
          color: white;
        }
        
        .btn-pdf:hover {
          background: #2563eb;
        }
        
        .btn-edit {
          background: #6b7280;
          color: white;
        }
        
        .btn-edit:hover {
          background: #4b5563;
        }
        
        .btn-complete {
          background: #10b981;
          color: white;
        }
        
        .btn-complete:hover {
          background: #059669;
        }
        
        .btn-save {
          background: #10b981;
          color: white;
        }
        
        .btn-save:hover {
          background: #059669;
        }
        
        .btn-cancel-edit {
          background: #6b7280;
          color: white;
        }
        
        .btn-cancel-edit:hover {
          background: #4b5563;
        }
        
        .btn-delete {
          background: #ef4444;
          color: white;
        }
        
        .btn-delete:hover {
          background: #dc2626;
        }
        
        .btn-remove-line {
          background: #ef4444;
          color: white;
          border: none;
          border-radius: 4px;
          padding: 0.25rem 0.75rem;
          font-size: 0.8rem;
          transition: all 0.2s ease;
          font-weight: 500;
        }
        
        .btn-remove-line:hover {
          background: #dc2626;
          transform: scale(1.05);
        }
        
        .deleted-row {
          background: #7f1d1d !important;
          opacity: 0.7;
        }
        
        .deleted-row td {
          text-decoration: line-through;
          color: #fca5a5 !important;
        }
        
        .qty-input {
          border-radius: 4px;
          border: 1px solid #4a5568;
          padding: 0.375rem 0.5rem;
          transition: border-color 0.2s ease;
          background: #1f2937;
          color: #e5e7eb;
          font-size: 0.875rem;
        }
        
        .qty-input:focus {
          border-color: #3b82f6;
          outline: none;
          box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.2);
        }
        
        .refresh-btn {
          position: fixed !important;
          bottom: 2rem;
          right: 2rem;
          width: 64px;
          height: 64px;
          border-radius: 50%;
          background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
          color: white;
          border: none;
          box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4);
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.75rem;
          z-index: 1000;
        }
        
        .refresh-btn::after {
          content: '';
          position: absolute;
          top: -6px;
          left: -6px;
          width: calc(100% + 12px);
          height: calc(100% + 12px);
          border-radius: 50%;
          border: 3px solid transparent;
          transition: all 0.1s linear;
        }
        
        .refresh-btn:not(.refreshing)::after {
          border-top-color: #60a5fa;
          border-right-color: #60a5fa;
          transform: rotate(calc(var(--progress, 0) * 3.6deg));
        }
        
        .refresh-btn:hover {
          background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
          transform: translateY(-2px) scale(1.05);
          box-shadow: 0 6px 20px rgba(59, 130, 246, 0.6);
        }
        
        .refresh-btn:active {
          transform: translateY(0) scale(1);
        }
        
        .refresh-btn.refreshing::after {
          animation: spin 1s linear infinite;
        }
        
        .refresh-btn.near-refresh {
          animation: pulse-intense 0.5s ease-in-out infinite;
        }
        
        .refresh-btn.near-refresh::after {
          border-top-color: #fbbf24;
          border-right-color: #fbbf24;
          border-bottom-color: #fbbf24;
          border-left-color: #fbbf24;
        }
        
        @keyframes spin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
        
        @keyframes pulse {
          0%, 100% {
            transform: scale(1);
          }
          50% {
            transform: scale(1.05);
          }
        }
        
        @keyframes pulse-intense {
          0%, 100% {
            transform: scale(1);
            box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4);
          }
          25% {
            transform: scale(1.08);
            box-shadow: 0 6px 18px rgba(251, 191, 36, 0.5);
          }
          50% {
            transform: scale(1.12);
            box-shadow: 0 8px 24px rgba(251, 191, 36, 0.7);
          }
          75% {
            transform: scale(1.08);
            box-shadow: 0 6px 18px rgba(251, 191, 36, 0.5);
          }
        }
        
        @keyframes spin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
        
        @keyframes modalFadeIn {
          from {
            opacity: 0;
            transform: scale(0.95);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
        
        .modern-modal .modal-content {
          animation: modalFadeIn 0.2s ease;
        }
        .btn-export-toggle {
  background: none !important;
  border: none !important;
  color: #555 !important;
  font-size: 1.4rem !important;
  cursor: pointer !important;
  transition: transform 0.2s ease, color 0.2s ease;
  margin-left: auto !important;
}

.btn-export-toggle:hover {
  color: #198754 !important;
  transform: rotate(180deg);
}

.btn-export-toggle::after {
  content: attr(data-tooltip);
  position: absolute;
  bottom: 130%;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(0, 0, 0, 0.8);
  color: white;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.75rem;
  white-space: nowrap;
  opacity: 0;
  pointer-events: none;
  transition: opacity 0.2s ease;
}

.btn-export-toggle:hover::after {
  opacity: 1;
}

.datepicker-popper {
  z-index: 3000 !important;
}
.react-datepicker-popper {
  z-index: 3000 !important;
}


/* Плавное раскрытие панели экспорта */
.export-controls.show {
  opacity: 1;
  max-height: 180px;
  transform: translateY(0);
}


.export-controls {
  opacity: 0;
  max-height: 0;
  overflow: hidden;
  transform: translateY(-10px);
  transition: all 0.4s ease;
  will-change: opacity, max-height, transform;
}




      `}</style>

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
      <div className="d-flex flex-wrap gap-2 mb-3 align-items-center justify-content-between">
        <div className="d-flex gap-2 align-items-center">
          <input
            type="text"
            className="form-control w-auto"
            placeholder="Поиск по номеру заявки"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          <input
            type="text"
            className="form-control w-auto"
            placeholder="Поиск по коду детали"
            value={searchMaterial}
            onChange={e => setSearchMaterial(e.target.value)}
          />
          <DatePicker
            selected={selectedDate}
            onChange={setSelectedDate}
            className="form-control w-auto"
            placeholderText="Фильтр по дате"
            dateFormat="dd.MM.yyyy"
            isClearable
          />
        </div>

        {/* Кнопка-иконка экспорта */}
        <button
          className="btn-icon btn-export-toggle"
          onClick={() => setShowExportPanel(!showExportPanel)}
          data-tooltip="Дополнительные функции"
        >
          ⬇️
        </button>
      </div>
      {
        <div className={`export-controls mt-2 p-3 border rounded bg-light ${showExportPanel ? 'show' : ''}`}>
          <div className="d-flex flex-wrap gap-2 align-items-center">
            <label className="me-2">Период:</label>
            <DatePicker
              selected={exportFrom}
              onChange={setExportFrom}
              className="form-control form-control-sm"
              placeholderText="С даты"
              dateFormat="dd.MM.yyyy"
              popperPlacement="bottom-start"
              popperClassName="datepicker-popper"
              portalId="root"
            />

            <DatePicker
              selected={exportTo}
              onChange={setExportTo}
              className="form-control form-control-sm"
              placeholderText="По дату"
              dateFormat="dd.MM.yyyy"
              popperPlacement="bottom-start"
              popperClassName="datepicker-popper"
              portalId="root"
            />

            <button className="btn btn-success btn-sm" onClick={handleExportExcel} disabled={!exportFrom || !exportTo}>
              Скачать Excel
            </button>
          </div>
        </div>
      }

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
                  <span className={`badge ${order.cancelled ? 'bg-danger' : order.completed ? 'bg-success' : 'bg-warning'}`}>
                    {order.cancelled ? 'Удалена' : order.completed ? 'Завершено' : 'В процессе'}
                  </span>
                  <button className="btn btn-outline-primary btn-sm" onClick={() => setSelectedOrder(order)}>
                    Детали
                  </button>
                </div>
              </div>
            </div>
          ))}

          {totalPages > 1 && (
            <div className="pagination-container">
              <button
                className="pagination-btn pagination-arrow"
                onClick={() => setCurrentPage(1)}
                disabled={currentPage === 1}
                title="Первая страница"
              >
                ⟪
              </button>
              <button
                className="pagination-btn pagination-arrow"
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                title="Предыдущая"
              >
                ‹
              </button>

              <div className="pagination-numbers">
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter(page => {
                    if (page === 1 || page === totalPages) return true;
                    if (Math.abs(page - currentPage) <= 1) return true;
                    return false;
                  })
                  .map((page, idx, arr) => {
                    const showDots = idx > 0 && page - arr[idx - 1] > 1;
                    return (
                      <React.Fragment key={page}>
                        {showDots && <span className="pagination-dots">···</span>}
                        <button
                          className={`pagination-btn pagination-number ${currentPage === page ? 'active' : ''}`}
                          onClick={() => setCurrentPage(page)}
                        >
                          {page}
                        </button>
                      </React.Fragment>
                    );
                  })}
              </div>

              <button
                className="pagination-btn pagination-arrow"
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                title="Следующая"
              >
                ›
              </button>
              <button
                className="pagination-btn pagination-arrow"
                onClick={() => setCurrentPage(totalPages)}
                disabled={currentPage === totalPages}
                title="Последняя страница"
              >
                ⟫
              </button>

              <div className="pagination-info">
                <span>{visibleOrders.length} заявок</span>
                <span className="pagination-separator">·</span>
                <span>
                  Страница {currentPage} из {totalPages}
                </span>
              </div>
            </div>
          )}
        </>
      )}
      <Modal
        show={!!selectedOrder}
        onHide={() => {
          setSelectedOrder(null);
          setEditMode(false);
        }}
        size="lg"
        centered
        className="modern-modal"
      >
        <Modal.Header closeButton>
          <Modal.Title>Заявка #{selectedOrder?.orderId}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedOrder && (
            <div>
              <div className="info-card">
                <p>
                  <strong>Дата:</strong> {format(new Date(selectedOrder.createdAt), 'dd.MM.yyyy HH:mm')}
                </p>
                <p>
                  <strong>Механик:</strong> {selectedOrder.mechanicLogin}
                </p>
              </div>
              <table className="table modern-table mb-0">
                <thead>
                  <tr>
                    <th style={{ width: '50px' }}>#</th>
                    <th>Код</th>
                    <th>Название</th>
                    <th style={{ width: '100px' }}>Кол-во</th>
                    {editMode && <th style={{ width: '100px' }}>Действие</th>}
                  </tr>
                </thead>
                <tbody>
                  {selectedOrder.lines.map((line, i) => (
                    <tr key={i} className={line.qty === 0 ? 'deleted-row' : ''}>
                      <td>{i + 1}</td>
                      <td>{line.materialCode}</td>
                      <td>{line.title}</td>
                      <td>
                        {editMode && line.qty > 0 ? (
                          <input
                            type="number"
                            className="form-control form-control-sm qty-input"
                            value={line.qty}
                            min={1}
                            max={line.originalQty || line.qty}
                            onChange={e => {
                              const maxQty = line.originalQty || line.qty;
                              const newQty = Math.max(1, Math.min(maxQty, Number(e.target.value)));
                              setSelectedOrder(prev =>
                                prev
                                  ? {
                                      ...prev,
                                      lines: prev.lines.map((l, j) => (j === i ? { ...l, qty: newQty, originalQty: maxQty } : l)),
                                    }
                                  : null,
                              );
                            }}
                          />
                        ) : line.qty === 0 && line.originalQty !== undefined ? (
                          <s>{line.originalQty}</s>
                        ) : (
                          line.qty
                        )}
                      </td>

                      {editMode && (
                        <td>
                          {line.qty > 0 && (
                            <button
                              className="btn-remove-line"
                              title="Удалить позицию"
                              onClick={() => {
                                setSelectedOrder(prev =>
                                  prev
                                    ? {
                                        ...prev,
                                        lines: prev.lines.map((l, j) => (j === i ? { ...l, originalQty: l.qty, qty: 0 } : l)),
                                      }
                                    : null,
                                );
                              }}
                            >
                              Удалить
                            </button>
                          )}
                        </td>
                      )}
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
              <div className="modal-footer-left">
                <button className="btn-icon btn-print" onClick={() => handleQuickPrint(selectedOrder)} data-tooltip="Печать">
                  🖨️
                </button>
                <button className="btn-icon btn-pdf" onClick={() => handleDownloadPdf(selectedOrder.orderId)} data-tooltip="Скачать PDF">
                  📄
                </button>
              </div>
              <div className="modal-footer-right">
                {!editMode && !selectedOrder.completed && (
                  <>
                    <button className="btn-system btn-edit" onClick={() => setEditMode(true)}>
                      Редактировать
                    </button>
                    <button className="btn-system btn-complete" onClick={() => markOrderAsCompleted(selectedOrder.orderId)}>
                      Заявка выдана
                    </button>
                  </>
                )}
                {editMode && (
                  <>
                    <button className="btn-system btn-cancel-edit" onClick={() => setEditMode(false)}>
                      Отменить редактирование
                    </button>
                    <button className="btn-system btn-save" onClick={saveEditedOrder}>
                      Сохранить
                    </button>
                    <button className="btn-system btn-delete" onClick={deleteEntireOrder}>
                      Удалить заявку
                    </button>
                  </>
                )}
              </div>
            </>
          )}
        </Modal.Footer>
      </Modal>
      <button
        className={`refresh-btn ${isRefreshing ? 'refreshing' : ''} ${refreshProgress > 80 ? 'near-refresh' : ''}`}
        onClick={() => fetchOrders()}
        title={`Обновить данные (автообновление каждые 30 сек)\nПрогресс: ${Math.round(refreshProgress)}%`}
        disabled={isRefreshing}
        style={{ '--progress': refreshProgress } as React.CSSProperties}
      >
        ↻
      </button>
    </div>
  );
};

export default WarehouseOrders;
