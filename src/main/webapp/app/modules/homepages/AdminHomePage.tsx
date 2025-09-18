import React, { useState } from 'react';
import { Box, Card, CardContent, Typography, Stack, Button } from '@mui/material';
import axios from 'axios';

const AdminHomePage = () => {
  const [loading, setLoading] = useState(false);

  const handleCleanup = async () => {
    if (!window.confirm('Удалить все заявки старше 1 месяца?')) return;
    setLoading(true);
    try {
      await axios.delete('/api/mechanic-orders/cleanup');

      alert('Старые заявки успешно удалены');
    } catch (e) {
      alert('Ошибка при удалении заявок');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom>
        Админ панель
      </Typography>

      <Stack direction="row" spacing={2} useFlexGap flexWrap="wrap">
        <Card sx={{ p: 2, borderRadius: 3, minWidth: 250 }}>
          <CardContent>
            <Typography variant="h6">Статистика пользователей</Typography>
            <Typography color="text.secondary">Тут будет статистика по ролям</Typography>
          </CardContent>
        </Card>
        <Card sx={{ p: 2, borderRadius: 3, minWidth: 250 }}>
          <CardContent>
            <Typography variant="h6">Очистка заявок</Typography>
            <Button variant="contained" color="error" onClick={handleCleanup} disabled={loading}>
              {loading ? 'Выполняется...' : 'Удалить старые заявки'}
            </Button>
          </CardContent>
        </Card>
      </Stack>
    </Box>
  );
};

export default AdminHomePage;
