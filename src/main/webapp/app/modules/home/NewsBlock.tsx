import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { Button, Modal, ModalBody, ModalHeader, ModalFooter, Input, Label, FormGroup } from 'reactstrap';
import { hasAnyAuthority } from 'app/shared/auth/private-route';
import { AUTHORITIES } from 'app/config/constants';
import { useAppSelector } from 'app/config/store';
import './news-block.scss';

interface NewsItem {
  id?: number;
  title: string;
  content: string;
  imageUrl?: string;
  createdAt?: string;
  createdBy?: string;
}

const MAX_TITLE_LENGTH = 100;
const MAX_CONTENT_LENGTH = 5000;
const MAX_URL_LENGTH = 500;

const NewsBlock = () => {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<NewsItem | null>(null);
  const [form, setForm] = useState<NewsItem>({ title: '', content: '', imageUrl: '' });

  const account = useAppSelector(state => state.authentication.account);
  const isEditor = hasAnyAuthority(account.authorities, [AUTHORITIES.ADMIN, 'ROLE_SENIOR_WAREHOUSEMAN']);

  const loadNews = async () => {
    const res = await axios.get<NewsItem[]>('/api/news');
    setNews(res.data.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || '')));
  };

  useEffect(() => {
    loadNews();
  }, []);

  const toggleModal = () => setModalOpen(!modalOpen);

  const startEdit = (item?: NewsItem) => {
    setEditingItem(item || null);
    setForm(item || { title: '', content: '', imageUrl: '' });
    setModalOpen(true);
  };

  const isValidUrl = (url: string) => /^https?:\/\/.+\..+/.test(url);

  const handleSave = async () => {
    if (!form.title.trim() || !form.content.trim()) {
      alert('Пожалуйста, заполните заголовок и текст новости.');
      return;
    }

    if (form.title.length > MAX_TITLE_LENGTH) {
      alert(`Заголовок не должен превышать ${MAX_TITLE_LENGTH} символов.`);
      return;
    }

    if (form.content.length > MAX_CONTENT_LENGTH) {
      alert(`Текст новости не должен превышать ${MAX_CONTENT_LENGTH} символов.`);
      return;
    }

    if (form.imageUrl && form.imageUrl.length > MAX_URL_LENGTH) {
      alert(`Ссылка на изображение слишком длинная (макс ${MAX_URL_LENGTH} символов).`);
      return;
    }

    if (form.imageUrl && !isValidUrl(form.imageUrl)) {
      alert('Ссылка на изображение имеет некорректный формат.');
      return;
    }

    try {
      if (editingItem?.id) {
        await axios.put(`/api/news/${editingItem.id}`, form);
      } else {
        await axios.post('/api/news', form);
      }
      toggleModal();
      loadNews();
    } catch (error) {
      alert('Ошибка при сохранении. Проверьте данные и попробуйте ещё раз.');
      console.error(error);
    }
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Удалить эту новость?')) {
      await axios.delete(`/api/news/${id}`);
      loadNews();
    }
  };

  return (
    <div className="news-block container mt-5">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h2 className="text-white">Новости</h2>
        {isEditor && (
          <Button color="light" onClick={() => startEdit()}>
            ➕ Добавить новость
          </Button>
        )}
      </div>

      <div className="news-grid">
        {news.map(item => (
          <div className="news-card" key={item.id}>
            {item.imageUrl && <img src={item.imageUrl} alt="preview" className="news-img" />}
            <div className="news-content">
              <h5>{item.title}</h5>
              <p>{item.content}</p>
              <div className="meta small text-muted">
                {item.createdBy} • {new Date(item.createdAt || '').toLocaleString('ru-RU')}
              </div>
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
          </div>
        ))}
      </div>

      <Modal isOpen={modalOpen} toggle={toggleModal} centered size="lg">
        <ModalHeader toggle={toggleModal}>{editingItem ? 'Редактировать новость' : 'Новая новость'}</ModalHeader>
        <ModalBody>
          <FormGroup>
            <Label for="title">Заголовок</Label>
            <Input
              id="title"
              value={form.title}
              onChange={e => setForm({ ...form, title: e.target.value })}
              maxLength={MAX_TITLE_LENGTH}
              placeholder="Введите заголовок (макс. 100 символов)"
            />
            <div className="text-end text-muted small">
              {form.title.length} / {MAX_TITLE_LENGTH}
            </div>
          </FormGroup>

          <FormGroup>
            <Label for="content">Текст новости</Label>
            <Input
              id="content"
              type="textarea"
              rows={6}
              value={form.content}
              onChange={e => setForm({ ...form, content: e.target.value })}
              maxLength={MAX_CONTENT_LENGTH}
              placeholder="Введите текст (макс. 5000 символов)"
            />
            <div className="text-end text-muted small">
              {form.content.length} / {MAX_CONTENT_LENGTH}
            </div>
          </FormGroup>

          <FormGroup>
            <Label for="image">Ссылка на изображение (необязательно)</Label>
            <Input
              id="image"
              value={form.imageUrl}
              onChange={e => setForm({ ...form, imageUrl: e.target.value })}
              placeholder="https://example.com/image.jpg"
              maxLength={MAX_URL_LENGTH}
            />
            <div className="text-end text-muted small">
              {form.imageUrl.length} / {MAX_URL_LENGTH}
            </div>
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

export default NewsBlock;
