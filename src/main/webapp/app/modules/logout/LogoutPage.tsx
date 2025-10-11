import React from 'react';
import { Box, Container, Stack, Typography, Button, Card, CardContent } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import './logout.scss';

export default function LogoutPage() {
  const patternSvg =
    "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='160' height='160' viewBox='0 0 100 100'><g fill='none' stroke='rgba(255,255,255,0.05)' stroke-width='1'><path d='M0 50 L50 0 L100 50 L50 100 Z'/></g></svg>\")";

  return (
    <Box
      sx={{
        minHeight: '100vh',
        backgroundImage: `
          linear-gradient(180deg, #e9ecef 0%, #f8f9fa 100%),
          ${patternSvg}
        `,
        backgroundSize: `auto, 160px 160px`,
        backgroundAttachment: 'fixed',
        pt: 8,
        pb: 10,
      }}
    >
      <Container maxWidth="sm" sx={{ mb: 8 }}>
        <Card
          className="fade-in fade-in-delay-1"
          sx={{
            p: 4,
            borderRadius: 4,
            background: 'linear-gradient(135deg, #2f3542 0%, #3a3f47 100%)',
            color: 'white',
            boxShadow: '0 20px 60px rgba(0,0,0,.4)',
          }}
        >
          <CardContent>
            <Stack spacing={3} alignItems="center" textAlign="center">
              <Box component="img" src="content/images/logo-sapport.png" alt="SAPPort" sx={{ width: 140, opacity: 0.9 }} />
              <Typography variant="h4" fontWeight={700}>
                Спасибо за использование системы SAPPort
              </Typography>
              <Typography sx={{ color: 'rgba(255,255,255,0.7)', fontSize: 16 }}>Мы будем рады видеть вас снова.</Typography>
              <Stack direction="row" spacing={2} mt={3}>
                <Button component={RouterLink} to="/login" className="primary-btn">
                  Вернуться к работе
                </Button>
                <Button component={RouterLink} to="/" variant="outlined" sx={{ color: '#fff', borderColor: '#fff' }}>
                  Стартовая страница
                </Button>
              </Stack>
            </Stack>
          </CardContent>
        </Card>
      </Container>
    </Box>
  );
}
