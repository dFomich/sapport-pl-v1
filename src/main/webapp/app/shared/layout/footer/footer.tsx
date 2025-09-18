import React from 'react';
import { Box, Container, Typography } from '@mui/material';

const Footer = () => {
  return (
    <Box
      component="footer"
      sx={{
        mt: 'auto',
        py: 2, // 🔹 меньше высота (было больше)
        background: 'linear-gradient(90deg, #2c3138 0%, #3a3f47 100%)',
        color: '#ccc',
      }}
    >
      <Container maxWidth="lg" sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        {/* Логотип слева */}
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <img src="content/images/logo-sapport.png" alt="logo" style={{ height: 24, marginRight: 8 }} />
        </Box>

        {/* Текст по центру */}
        <Typography variant="body2" sx={{ textAlign: 'center', flexGrow: 1, color: '#bbb' }}>
          © 2025 SAPPort. Все права защищены.
        </Typography>
      </Container>
    </Box>
  );
};

export default Footer;
