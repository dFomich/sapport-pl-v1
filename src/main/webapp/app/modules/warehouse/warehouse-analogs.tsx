import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Button, Col, Modal, ModalBody, ModalHeader, Row, Spinner, Table, Input, FormGroup, Label } from 'reactstrap';
import { hasAnyAuthority } from 'app/shared/auth/private-route';
import { AUTHORITIES } from 'app/config/constants';
import { useAppSelector } from 'app/config/store';
import '../mechanic/mechanic-catalog.scss';

type GroupItem = {
  id: number;
  name: string;
  description?: string;
  codesCount: number;
  totalStock: number;
};

type GroupDetails = {
  id: number;
  name: string;
  description?: string;
  totalStock: number;
  codes: {
    materialCode: string;
    title?: string;
    totalStock: number;
    perStorage: { storageType: string; availableStock: number }[];
  }[];
};

const WarehouseAnalogs: React.FC = () => {
  const [groups, setGroups] = useState<GroupItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<GroupDetails | null>(null);
  const [q, setQ] = useState('');
  const [creating, setCreating] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [newCodes, setNewCodes] = useState<string[]>([]);
  const [newCode, setNewCode] = useState('');

  const account = useAppSelector(state => state.authentication.account);
  const isSeniorWarehouseman = hasAnyAuthority(account.authorities, [AUTHORITIES.SENIOR_WAREHOUSEMAN]);

  // === Загрузка групп ===
  const loadGroups = async () => {
    setLoading(true);
    try {
      const res = await axios.get<GroupItem[]>('/api/product-groups');
      setGroups(res.data);
    } catch (e) {
      console.error('Ошибка при загрузке групп', e);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadGroups();
  }, []);

  const filtered = groups.filter(g => g.name.toLowerCase().includes(q.toLowerCase()));

  // === Загрузка деталки ===
  const openDetails = async (id: number) => {
    try {
      const res = await axios.get<GroupDetails>(`/api/product-groups/${id}`);
      setSelected(res.data);
    } catch (e) {
      console.error('Ошибка при загрузке деталей группы', e);
    }
  };

  // === Удалить код из группы ===
  const removeCode = async (groupId: number, code: string) => {
    if (!window.confirm(`Удалить код ${code} из группы?`)) return;
    try {
      await axios.delete(`/api/product-groups/${groupId}/codes/${code}`);
      await openDetails(groupId);
    } catch (e) {
      console.error('Ошибка удаления кода', e);
    }
  };

  // === Добавить код ===
  const addCode = async (groupId: number) => {
    if (!newCode.trim()) return;
    try {
      await axios.post(`/api/product-groups/${groupId}/codes`, [newCode.trim()]);
      setNewCode('');
      await openDetails(groupId);
    } catch (e) {
      console.error('Ошибка добавления кода', e);
    }
  };

  // === Создание новой группы ===
  const createGroup = async () => {
    if (!newName.trim()) return;
    try {
      const res = await axios.post('/api/product-groups', {
        name: newName.trim(),
        description: newDesc.trim(),
      });
      const groupId = res.data.id;
      if (newCodes.length > 0) {
        await axios.post(`/api/product-groups/${groupId}/codes`, newCodes);
      }
      setCreating(false);
      setNewName('');
      setNewDesc('');
      setNewCodes([]);
      await loadGroups();
    } catch (e) {
      console.error('Ошибка при создании группы', e);
    }
  };

  const addTempCode = () => {
    if (newCode.trim()) {
      setNewCodes([...newCodes, newCode.trim()]);
      setNewCode('');
    }
  };

  const removeTempCode = (code: string) => {
    setNewCodes(newCodes.filter(c => c !== code));
  };

  return (
    <div className="container mt-4 mechanic-catalog">
      <Row className="align-items-center mb-4">
        <Col>
          <h3 style={{ fontWeight: 700, color: '#212529', marginBottom: '4px' }}>Каталог аналогов</h3>
          <p style={{ fontSize: '0.95rem', color: '#6c757d', marginBottom: 0 }}>Просмотр и редактирование групп взаимозаменяемых товаров</p>
        </Col>
        <Col md="4">
          <Input
            placeholder="🔍 Поиск по названию группы"
            value={q}
            onChange={e => setQ(e.target.value)}
            style={{
              borderRadius: '8px',
              borderColor: '#dee2e6',
              paddingLeft: '12px',
            }}
          />
        </Col>
        {isSeniorWarehouseman && (
          <Col md="auto">
            <Button className="modern-btn add-btn" onClick={() => setCreating(true)}>
              <span className="icon">➕</span> Новая группа
            </Button>
          </Col>
        )}
      </Row>

      {loading ? (
        <div style={{ textAlign: 'center', paddingTop: '60px', paddingBottom: '60px' }}>
          <Spinner color="primary" style={{ width: '40px', height: '40px' }} />
        </div>
      ) : (
        <Table bordered hover responsive style={{ borderRadius: '8px', overflow: 'hidden' }}>
          <thead style={{ backgroundColor: '#f8f9fa', borderBottom: '2px solid #dee2e6' }}>
            <tr>
              <th style={{ fontWeight: 700, color: '#495057', padding: '14px 12px' }}>Название группы</th>
              <th style={{ fontWeight: 700, color: '#495057', padding: '14px 12px' }}>Описание</th>
              <th style={{ fontWeight: 700, color: '#495057', padding: '14px 12px', textAlign: 'center' }}>Кодов</th>
              <th style={{ fontWeight: 700, color: '#495057', padding: '14px 12px', textAlign: 'center' }}>Всего на складах</th>
              <th style={{ fontWeight: 700, color: '#495057', padding: '14px 12px', textAlign: 'center', width: 140 }}>Действие</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 && (
              <tr>
                <td colSpan={5} style={{ textAlign: 'center', color: '#adb5bd', padding: '40px 12px' }}>
                  Группы не найдены
                </td>
              </tr>
            )}
            {filtered.map(g => (
              <tr
                key={g.id}
                style={{
                  backgroundColor: '#fff',
                  borderBottom: '1px solid #dee2e6',
                  transition: 'background-color 0.15s ease',
                  cursor: 'default',
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.backgroundColor = '#f8faff';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.backgroundColor = '#fff';
                }}
              >
                <td style={{ padding: '14px 12px', fontWeight: 500, color: '#212529' }}>{g.name}</td>
                <td style={{ padding: '14px 12px', color: '#6c757d' }}>{g.description || '-'}</td>
                <td style={{ padding: '14px 12px', textAlign: 'center', color: '#495057', fontWeight: 500 }}>{g.codesCount}</td>
                <td style={{ padding: '14px 12px', textAlign: 'center', color: '#495057', fontWeight: 500 }}>{g.totalStock}</td>
                <td style={{ padding: '14px 12px', textAlign: 'center' }}>
                  <Button className="modern-btn view-btn" size="sm" onClick={() => openDetails(g.id)}>
                    <span className="icon">🔍</span> Просмотр
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}

      {/* 🟩 Детали группы */}
      <Modal isOpen={!!selected} toggle={() => setSelected(null)} size="lg" centered>
        <ModalHeader
          toggle={() => setSelected(null)}
          style={{
            borderBottom: '2px solid #f0f0f0',
            paddingBottom: '16px',
            fontSize: '1.25rem',
            fontWeight: 700,
            color: '#212529',
          }}
        >
          {selected?.name}
        </ModalHeader>
        <ModalBody style={{ paddingTop: '24px', paddingBottom: '24px' }}>
          {selected && (
            <>
              <div
                style={{
                  fontSize: '1rem',
                  fontWeight: 600,
                  marginBottom: '20px',
                  color: '#212529',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                <span style={{ fontSize: '1.2rem' }}>📦</span>
                Всего на складах: <span style={{ color: '#0d6efd', fontSize: '1.1rem' }}>{selected.totalStock}</span>
              </div>

              {isSeniorWarehouseman && (
                <div
                  style={{
                    display: 'flex',
                    gap: '10px',
                    marginBottom: '24px',
                    padding: '14px',
                    backgroundColor: '#f8f9fa',
                    borderRadius: '8px',
                    alignItems: 'center',
                  }}
                >
                  <Input
                    placeholder="Введите код материала..."
                    value={newCode}
                    onChange={e => setNewCode(e.target.value)}
                    style={{
                      borderRadius: '6px',
                      borderColor: '#dee2e6',
                      flex: 1,
                    }}
                  />
                  <Button className="modern-btn add-btn" onClick={() => addCode(selected.id)} disabled={!newCode.trim()}>
                    <span className="icon">➕</span> Добавить
                  </Button>
                </div>
              )}

              {selected.codes.map(code => (
                <div
                  key={code.materialCode}
                  style={{
                    marginBottom: '18px',
                    padding: '16px',
                    borderRadius: '8px',
                    backgroundColor: '#f8f9fa',
                    border: '1px solid #dee2e6',
                    transition: 'all 0.2s ease-in-out',
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.backgroundColor = '#eef6ff';
                    e.currentTarget.style.borderColor = '#b8daff';
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.backgroundColor = '#f8f9fa';
                    e.currentTarget.style.borderColor = '#dee2e6';
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                      marginBottom: '14px',
                      flexWrap: 'wrap',
                      gap: '8px',
                    }}
                  >
                    <div style={{ flex: 1, minWidth: '200px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                        <span style={{ fontWeight: 600, color: '#495057' }}>Код:</span>
                        <span style={{ fontWeight: 700, color: '#0d6efd', fontSize: '1rem' }}>{code.materialCode}</span>
                        <span style={{ color: '#6c757d', fontSize: '0.9rem' }}>•</span>
                        <span style={{ color: '#212529', fontWeight: 600 }}>Остаток: {code.totalStock}</span>
                      </div>
                      {code.title && (
                        <div style={{ marginTop: '6px', color: '#6c757d', fontStyle: 'italic', fontSize: '0.9rem' }}>{code.title}</div>
                      )}
                    </div>
                    {isSeniorWarehouseman && (
                      <Button
                        size="sm"
                        className="modern-btn remove-btn"
                        onClick={() => removeCode(selected.id, code.materialCode)}
                        style={{ minWidth: '36px', padding: '6px' }}
                      >
                        ✕
                      </Button>
                    )}
                  </div>

                  <Table bordered size="sm" style={{ marginBottom: 0, marginTop: '12px' }}>
                    <thead style={{ backgroundColor: '#f0f0f0' }}>
                      <tr>
                        <th style={{ fontWeight: 600, color: '#495057', padding: '10px 12px', fontSize: '0.9rem' }}>Склад</th>
                        <th style={{ fontWeight: 600, color: '#495057', padding: '10px 12px', fontSize: '0.9rem' }}>Остаток</th>
                      </tr>
                    </thead>
                    <tbody>
                      {code.perStorage.map(s => (
                        <tr key={s.storageType} style={{ backgroundColor: '#fff' }}>
                          <td style={{ padding: '10px 12px', color: '#212529', fontSize: '0.9rem' }}>{s.storageType}</td>
                          <td style={{ padding: '10px 12px', color: '#212529', fontSize: '0.9rem', fontWeight: 500 }}>
                            {s.availableStock}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </div>
              ))}
            </>
          )}
        </ModalBody>
      </Modal>

      {/* 🟨 Создание новой группы */}
      <Modal isOpen={creating} toggle={() => setCreating(false)} centered>
        <ModalHeader
          toggle={() => setCreating(false)}
          style={{
            borderBottom: '2px solid #f0f0f0',
            paddingBottom: '16px',
            fontSize: '1.1rem',
            fontWeight: 700,
            color: '#212529',
          }}
        >
          Новая группа аналогов
        </ModalHeader>
        <ModalBody style={{ paddingTop: '24px', paddingBottom: '24px' }}>
          <FormGroup style={{ marginBottom: '18px' }}>
            <Label style={{ fontWeight: 600, marginBottom: '8px', color: '#212529' }}>Название</Label>
            <Input
              value={newName}
              onChange={e => setNewName(e.target.value)}
              placeholder="Введите название группы"
              style={{ borderRadius: '6px', borderColor: '#dee2e6' }}
            />
          </FormGroup>

          <FormGroup style={{ marginBottom: '18px' }}>
            <Label style={{ fontWeight: 600, marginBottom: '8px', color: '#212529' }}>Описание</Label>
            <Input
              value={newDesc}
              onChange={e => setNewDesc(e.target.value)}
              placeholder="Описание (необязательно)"
              style={{ borderRadius: '6px', borderColor: '#dee2e6' }}
            />
          </FormGroup>

          <FormGroup style={{ marginBottom: '18px' }}>
            <Label style={{ fontWeight: 600, marginBottom: '10px', color: '#212529' }}>Коды материалов</Label>
            <div style={{ display: 'flex', gap: '10px', marginBottom: '12px' }}>
              <Input
                placeholder="Введите код"
                value={newCode}
                onChange={e => setNewCode(e.target.value)}
                style={{ borderRadius: '6px', borderColor: '#dee2e6', flex: 1 }}
              />
              <Button color="primary" onClick={addTempCode} className="modern-btn add-btn" style={{ minWidth: '44px' }}>
                ➕
              </Button>
            </div>

            {newCodes.length > 0 && (
              <div
                style={{
                  backgroundColor: '#f8f9fa',
                  borderRadius: '6px',
                  padding: '10px',
                  border: '1px solid #dee2e6',
                }}
              >
                {newCodes.map(code => (
                  <div
                    key={code}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      paddingBottom: '8px',
                      marginBottom: '8px',
                      borderBottom: '1px solid #e9ecef',
                    }}
                  >
                    <span style={{ color: '#212529', fontWeight: 500 }}>{code}</span>
                    <Button
                      color="link"
                      size="sm"
                      onClick={() => removeTempCode(code)}
                      style={{
                        padding: '2px 6px',
                        color: '#dc3545',
                        textDecoration: 'none',
                        transition: 'transform 0.15s ease',
                        cursor: 'pointer',
                      }}
                      onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.2)')}
                      onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}
                    >
                      ✕
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </FormGroup>

          <div style={{ textAlign: 'right', marginTop: '24px' }}>
            <Button className="modern-btn add-btn" onClick={createGroup} disabled={!newName.trim()}>
              ✅ Создать группу
            </Button>
          </div>
        </ModalBody>
      </Modal>
    </div>
  );
};

export default WarehouseAnalogs;
