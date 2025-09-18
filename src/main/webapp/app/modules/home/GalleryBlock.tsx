import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Button, Modal, ModalBody, ModalHeader, ModalFooter, Input, Label, FormGroup } from 'reactstrap';
import { hasAnyAuthority } from 'app/shared/auth/private-route';
import { AUTHORITIES } from 'app/config/constants';
import { useAppSelector } from 'app/config/store';
import './gallery-block.scss';

interface GalleryItem {
  id?: number;
  imageUrl: string;
  caption?: string;
  createdAt?: string;
  createdBy?: string;
}

const GalleryBlock = () => {
  const [gallery, setGallery] = useState<GalleryItem[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<GalleryItem | null>(null);
  const [form, setForm] = useState<GalleryItem>({ imageUrl: '', caption: '' });

  const account = useAppSelector(state => state.authentication.account);
  const isEditor = hasAnyAuthority(account.authorities, [AUTHORITIES.ADMIN, 'ROLE_SENIOR_WAREHOUSEMAN']);

  const loadGallery = async () => {
    const res = await axios.get<GalleryItem[]>('/api/gallery');
    setGallery(res.data.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || '')));
  };

  useEffect(() => {
    loadGallery();
  }, []);

  const toggleModal = () => setModalOpen(!modalOpen);

  const startEdit = (item?: GalleryItem) => {
    setEditingItem(item || null);
    setForm(item || { imageUrl: '', caption: '' });
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (form.imageUrl.length > 500) {
      alert('Ссылка на изображение слишком длинная (макс. 500 символов)');
      return;
    }

    try {
      if (editingItem?.id) {
        await axios.put(`/api/gallery/${editingItem.id}`, form);
      } else {
        await axios.post('/api/gallery', form);
      }
      toggleModal();
      loadGallery();
    } catch (error) {
      alert('Произошла ошибка при сохранении изображения. Попробуйте позже.');
      console.error('Ошибка при сохранении:', error);
    }
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Удалить это изображение?')) {
      await axios.delete(`/api/gallery/${id}`);
      loadGallery();
    }
  };

  return (
    <div className="gallery-block container mt-5">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h2 className="text-white">Галерея</h2>
        {isEditor && (
          <Button color="light" onClick={() => startEdit()}>
            ➕ Добавить изображение
          </Button>
        )}
      </div>
      <div className="gallery-grid">
        {gallery.map(item => (
          <div className="gallery-card" key={item.id}>
            <img src={item.imageUrl} alt="preview" className="gallery-img" />
            <div className="gallery-caption">{item.caption}</div>
            {item.createdBy && <div className="meta small text-muted">{item.createdBy}</div>}

            {isEditor && (
              <div className="controls mt-2">
                <Button size="sm" color="info" onClick={() => startEdit(item)}>
                  ✏️ Редактировать
                </Button>{' '}
                <Button size="sm" color="danger" onClick={() => handleDelete(item.id)}>
                  🗑 Удалить
                </Button>
              </div>
            )}
          </div>
        ))}
      </div>

      <Modal isOpen={modalOpen} toggle={toggleModal} centered size="lg">
        <ModalHeader toggle={toggleModal}>{editingItem ? 'Редактировать' : 'Новое изображение'}</ModalHeader>
        <ModalBody>
          <FormGroup>
            <Label for="image">Ссылка на изображение</Label>
            <Input
              id="image"
              value={form.imageUrl}
              onChange={e => setForm({ ...form, imageUrl: e.target.value })}
              placeholder="https://example.com/image.jpg"
            />
          </FormGroup>
          <FormGroup>
            <Label for="caption">Подпись (необязательно)</Label>
            <Input
              id="caption"
              value={form.caption}
              onChange={e => setForm({ ...form, caption: e.target.value })}
              placeholder="Введите подпись к изображению"
            />
          </FormGroup>
        </ModalBody>
        <ModalFooter>
          <Button color="secondary" onClick={toggleModal}>
            Отмена
          </Button>
          <Button color="primary" onClick={handleSave}>
            Сохранить
          </Button>
        </ModalFooter>
      </Modal>
    </div>
  );
};

export default GalleryBlock;
