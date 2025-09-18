import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Button, Col, Row, Table, Spinner } from 'reactstrap';
import { useAppSelector } from 'app/config/store';

const InventoryUpload = () => {
  const [file, setFile] = useState<File | null>(null);
  const [report, setReport] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [uploads, setUploads] = useState<any[]>([]);
  const [page, setPage] = useState(0);
  const [total, setTotal] = useState<number>(0);
  const [wipeBeforeImport, setWipeBeforeImport] = useState(false);
  const [loading, setLoading] = useState(false); // 🔹 новое состояние

  const account = useAppSelector(state => state.authentication.account);

  const loadUploads = async (p = 0) => {
    const res = await axios.get(`/api/inventory/uploads`, { params: { page: p, size: 10, sort: 'uploadedAt,desc' } });
    const content = res.data;
    const totalCount = Number(res.headers['x-total-count'] || 0);
    setUploads(content);
    setTotal(totalCount);
    setPage(p);
  };

  useEffect(() => {
    loadUploads(0).catch(e => setError(e?.response?.data?.title || 'Failed to load history'));
  }, []);

  const onUpload = async () => {
    setReport(null);
    setError(null);

    if (!file) {
      setError('Выберите .xlsx файл');
      return;
    }

    const fd = new FormData();
    fd.append('file', file);

    try {
      setLoading(true); // 🔹 показываем, что началась загрузка
      const res = await axios.post(`/api/inventory/import?wipe=${wipeBeforeImport}`, fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setReport(res.data);
      await loadUploads(0);
      setFile(null);
      (document.getElementById('file-input') as HTMLInputElement).value = '';
    } catch (e: any) {
      setError(e?.response?.data?.title || e?.message || 'Ошибка загрузки');
    } finally {
      setLoading(false); // 🔹 в любом случае снимаем флаг
    }
  };

  return (
    <div className="container mt-4">
      <Row>
        <Col md="5">
          <h4>Загрузка остатков (.xlsx)</h4>
          <input
            id="file-input"
            type="file"
            accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            onChange={e => setFile(e.target.files?.[0] || null)}
            className="form-control mb-2"
          />

          {/* 🔹 Чекбокс очистки */}
          <div className="form-check mb-2">
            <input
              type="checkbox"
              className="form-check-input"
              id="wipeBeforeImport"
              checked={wipeBeforeImport}
              onChange={e => setWipeBeforeImport(e.target.checked)}
            />
            <label className="form-check-label" htmlFor="wipeBeforeImport">
              Перезаписать данные
            </label>
          </div>

          {/* 🔹 Кнопка с индикатором загрузки */}
          <Button color="primary" onClick={onUpload} className="me-2" disabled={loading}>
            {loading ? (
              <>
                <Spinner size="sm" className="me-2" />
                Загрузка...
              </>
            ) : (
              'Загрузить'
            )}
          </Button>

          {error && <div className="text-danger mt-2">{error}</div>}
          {report && (
            <div className="alert alert-success mt-3">
              <div>
                <strong>Файл:</strong> {report.originalFilename}
              </div>
              <div>
                <strong>Обработано строк:</strong> {report.totalRows}
              </div>
              <div>
                <strong>Добавлено позиций:</strong> {report.addedCount}
              </div>
              <div>
                <strong>Обновлено позиций:</strong> {report.updatedCount}
              </div>
              <div>
                <strong>Склады в файле:</strong> {(report.storageTypesFound || []).join(', ')}
              </div>
            </div>
          )}
        </Col>

        {/* Правая колонка: история загрузок */}
        <Col md="7">
          <h4>История загрузок</h4>
          <Table bordered size="sm">
            <thead>
              <tr>
                <th>#</th>
                <th>Пользователь</th>
                <th>Файл</th>
                <th>Добавлено/Обновлено</th>
                <th>Время</th>
              </tr>
            </thead>
            <tbody>
              {uploads.map((u, i) => (
                <tr key={u.id}>
                  <td>{page * 10 + i + 1}</td>
                  <td>{u.uploadedBy}</td>
                  <td>{u.originalFilename}</td>
                  <td>
                    {u.addedCount}/{u.updatedCount}
                  </td>
                  <td>{new Date(u.uploadedAt).toLocaleString()}</td>
                </tr>
              ))}
              {uploads.length === 0 && (
                <tr>
                  <td colSpan={5} className="text-center text-muted">
                    Пока пусто
                  </td>
                </tr>
              )}
            </tbody>
          </Table>
          {/* простая пагинация */}
          <div className="d-flex justify-content-between">
            <Button disabled={page === 0} onClick={() => loadUploads(page - 1)}>
              Назад
            </Button>
            <div>Всего: {total}</div>
            <Button disabled={(page + 1) * 10 >= total} onClick={() => loadUploads(page + 1)}>
              Вперёд
            </Button>
          </div>
          <div className="mt-3">
            <small>
              Вы вошли как: <b>{account.login}</b>
            </small>
          </div>
        </Col>
      </Row>
    </div>
  );
};

export default InventoryUpload;
