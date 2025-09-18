import React, { useEffect, useState } from 'react';
import { Box, Card, CardContent, Chip, Container, Stack, Typography, Button, Dialog, DialogTitle, DialogContent } from '@mui/material';
import axios from 'axios';

interface NewsItem {
  id: number;
  title: string;
  content: string;
  imageUrl?: string;
  createdAt?: string;
}

const NewsSection = () => {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [selected, setSelected] = useState<NewsItem | null>(null);

  const loadNews = async () => {
    try {
      const res = await axios.get<NewsItem[]>('/api/news');
      const sorted = res.data.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));
      setNews(sorted.slice(0, 3)); // показываем только 3 свежие новости
    } catch (e) {
      console.error('Ошибка при загрузке новостей', e);
    }
  };

  useEffect(() => {
    loadNews();
  }, []);

  const shortText = (full: string) => {
    return full.length > 100 ? full.slice(0, 100) + '...' : full;
  };

  return (
    <Container maxWidth="lg" sx={{ mb: 8 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
        <Typography variant="h5" fontWeight={800} sx={{ color: '#2f3542' }}>
          Новости
        </Typography>
        <Chip label="Актуальное" size="small" />
      </Stack>

      <Stack direction="row" spacing={3} useFlexGap flexWrap="wrap">
        {news.map(item => (
          <Box key={item.id} sx={{ width: { xs: '100%', md: 'calc(33.333% - 24px)' } }}>
            <Card
              sx={{
                height: '100%',
                borderRadius: 3,
                background: 'linear-gradient(135deg, #2f3542 0%, #3a3f47 100%)',
                color: 'white',
                boxShadow: '0 8px 30px rgba(0,0,0,.4)',
                transition: 'all 0.3s ease-in-out',
                '&:hover': {
                  transform: 'translateY(-5px)',
                  boxShadow: '0 12px 40px rgba(0,0,0,0.5)',
                },
              }}
            >
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  {item.title}
                </Typography>
                <Typography sx={{ color: 'rgba(255,255,255,0.7)', mb: 1.5 }}>{shortText(item.content)}</Typography>
                <Button
                  size="small"
                  variant="outlined"
                  sx={{ borderColor: 'rgba(255,255,255,0.4)', color: 'white' }}
                  onClick={() => setSelected(item)}
                >
                  Подробнее
                </Button>
              </CardContent>
            </Card>
          </Box>
        ))}
      </Stack>

      {/* Модальное окно с развёрнутой новостью */}
      <Dialog open={!!selected} onClose={() => setSelected(null)} maxWidth="sm" fullWidth>
        <DialogTitle>{selected?.title}</DialogTitle>
        <DialogContent>
          {selected?.imageUrl && (
            <Box component="img" src={selected.imageUrl} alt={selected.title} sx={{ width: '100%', mb: 2, borderRadius: 2 }} />
          )}
          <Typography>{selected?.content}</Typography>
        </DialogContent>
      </Dialog>
    </Container>
  );
};

export default NewsSection;
