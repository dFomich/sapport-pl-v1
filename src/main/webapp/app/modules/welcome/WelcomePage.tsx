// src/main/webapp/app/modules/welcome/WelcomePage.tsx
import * as React from 'react';
import { Box, Container, Stack, Typography, Button, Card, CardContent } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import NewsSection from './NewsSection';
import GallerySection from './GallerySection';
import './welcome.scss';

export default function WelcomePage() {
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
      {/* HERO */}
      <Container maxWidth="sm" sx={{ mb: 8 }}>
        <Card
          className="fade-in fade-in-delay-1"
          sx={{
            p: 3,
            borderRadius: 4,
            background: 'linear-gradient(135deg, #2f3542 0%, #3a3f47 100%)',
            color: 'white',
            boxShadow: '0 20px 60px rgba(0,0,0,.4)',
          }}
        >
          <CardContent>
            <Stack spacing={3} alignItems="center" textAlign="center">
              <Box component="img" src="content/images/logo-sapport.png" alt="SAPPort" sx={{ width: 140, opacity: 0.9 }} />
              <Typography variant="h3" fontWeight={800}>
                Добро пожаловать
              </Typography>
              <Typography sx={{ color: 'rgba(255,255,255,0.7)' }}>
                Начните работу, чтобы перейти к рабочим панелям по вашей роли.
              </Typography>
              <Button component={RouterLink} to="/login" className="primary-btn">
                Начать работу
              </Button>
            </Stack>
          </CardContent>
        </Card>
      </Container>

      {/* News */}
      <div className="fade-in fade-in-delay-2">
        <NewsSection />
      </div>

      {/* Gallery */}
      <div className="fade-in fade-in-delay-3">
        <GallerySection />
      </div>
    </Box>
  );
}
