import React, { useEffect, useMemo, useState } from 'react';
import axios from 'axios';
import { Button, Col, Input, Row, Table } from 'reactstrap';
import { useSearchParams } from 'react-router-dom';

type Item = {
  id: number;
  storageType: string;
  material: string;
  materialDescription: string;
  availableStock: number;
  updatedAt: string;
};

const pageSize = 25;

const InventoryStock = () => {
  const [tabs, setTabs] = useState<string[]>([]);
  const [active, setActive] = useState<string>('');
  const [rows, setRows] = useState<Item[]>([]);
  const [material, setMaterial] = useState('');
  const [name, setName] = useState('');
  const [page, setPage] = useState(0);
  const [total, setTotal] = useState(0);
  const [sort, setSort] = useState<{ field: string; dir: 'asc' | 'desc' }>({ field: 'material', dir: 'asc' });
  const [loading, setLoading] = useState(false);
  const [params, setParams] = useSearchParams();

  // загрузить список складов для вкладок
  useEffect(() => {
    axios.get<string[]>('/api/inventory/storage-types').then(r => {
      setTabs(r.data || []);
      const fromUrl = params.get('st');
      const initial = fromUrl && r.data.includes(fromUrl) ? fromUrl : r.data[0] || '';
      setActive(initial);
    });
  }, []);

  // загрузить данные таблицы
  const load = async (p = 0, st = active, m = material, d = name, s = sort) => {
    if (!st) return;
    setLoading(true);
    const res = await axios.get<Item[]>('/api/inventory/current', {
      params: {
        storageType: st,
        material: m || undefined,
        name: d || undefined,
        page: p,
        size: pageSize,
        sort: `${s.field},${s.dir}`,
      },
    });
    setRows(res.data);
    setTotal(Number(res.headers['x-total-count'] || 0));
    setPage(p);
    setParams({ st, p: String(p) }, { replace: true });
    setLoading(false);
  };

  // реакция на смену склада
  useEffect(() => {
    if (active) load(0, active);
  }, [active]);

  // дебаунс при вводе
  useEffect(() => {
    const t = setTimeout(() => load(0), 300);
    return () => clearTimeout(t);
  }, [material, name, sort.field, sort.dir]);

  const toggleSort = (field: string) => {
    setSort(s => (s.field === field ? { field, dir: s.dir === 'asc' ? 'desc' : 'asc' } : { field, dir: 'asc' }));
  };

  return (
    <div className="container mt-4">
      <Row>
        <Col>
          <h4>Остатки склада</h4>
          {/* вкладки */}
          <div className="mb-3">
            {tabs.map(t => (
              <Button key={t} color={t === active ? 'primary' : 'secondary'} className="me-2 mb-2" onClick={() => setActive(t)}>
                {t}
              </Button>
            ))}
          </div>

          {/* фильтры */}
          <Row className="g-2 mb-2">
            <Col md="4">
              <Input placeholder="Search by material code" value={material} onChange={e => setMaterial(e.target.value)} />
            </Col>
            <Col md="6">
              <Input placeholder="Search by name" value={name} onChange={e => setName(e.target.value)} />
            </Col>
            <Col md="2" className="text-end">
              <div className="mt-2">Всего: {total}</div>
            </Col>
          </Row>

          {/* таблица */}
          <Table bordered hover responsive size="sm">
            <thead>
              <tr>
                <th style={{ cursor: 'pointer' }} onClick={() => toggleSort('material')}>
                  Material {sort.field === 'material' ? (sort.dir === 'asc' ? '▲' : '▼') : ''}
                </th>
                <th style={{ cursor: 'pointer' }} onClick={() => toggleSort('materialDescription')}>
                  Material Description {sort.field === 'materialDescription' ? (sort.dir === 'asc' ? '▲' : '▼') : ''}
                </th>
                <th style={{ cursor: 'pointer' }} onClick={() => toggleSort('availableStock')}>
                  Available Stock {sort.field === 'availableStock' ? (sort.dir === 'asc' ? '▲' : '▼') : ''}
                </th>
                <th style={{ cursor: 'pointer' }} onClick={() => toggleSort('storageType')}>
                  Storage Type {sort.field === 'storageType' ? (sort.dir === 'asc' ? '▲' : '▼') : ''}
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map(r => (
                <tr key={r.id}>
                  <td>{r.material}</td>
                  <td>{r.materialDescription}</td>
                  <td>{r.availableStock}</td>
                  <td>{r.storageType}</td>
                </tr>
              ))}
              {rows.length === 0 && (
                <tr>
                  <td colSpan={4} className="text-center text-muted">
                    {loading ? 'Загрузка...' : 'Нет данных'}
                  </td>
                </tr>
              )}
            </tbody>
          </Table>

          {/* пагинация */}
          <div className="d-flex justify-content-between">
            <Button disabled={page === 0} onClick={() => load(page - 1)}>
              Назад
            </Button>
            <div>
              Стр. {page + 1} / {Math.max(1, Math.ceil(total / pageSize))}
            </div>
            <Button disabled={(page + 1) * pageSize >= total} onClick={() => load(page + 1)}>
              Вперёд
            </Button>
          </div>
        </Col>
      </Row>
    </div>
  );
};

export default InventoryStock;
