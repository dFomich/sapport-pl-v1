// src/main/webapp/app/modules/homepages/SeniorWarehousemanHomePage.tsx
import React from 'react';
import { Typography, Box } from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import InventoryIcon from '@mui/icons-material/Inventory';
import AssignmentTurnedInIcon from '@mui/icons-material/AssignmentTurnedIn';
import StoreIcon from '@mui/icons-material/Store';
import BuildIcon from '@mui/icons-material/Build';
import AnnouncementIcon from '@mui/icons-material/Announcement';
import { useNavigate } from 'react-router-dom';
import PhotoLibraryIcon from '@mui/icons-material/PhotoLibrary';
import StorefrontIcon from '@mui/icons-material/Storefront';

import './homepages.scss';

const tiles = [
  { title: 'Загрузка остатков', icon: <CloudUploadIcon fontSize="large" />, to: '/inventory/upload' },
  { title: 'Остатки склада', icon: <InventoryIcon fontSize="large" />, to: '/inventory/stock' },
  { title: 'Заявки на выдачу', icon: <AssignmentTurnedInIcon fontSize="large" />, to: '/warehouse/orders' },
  { title: 'Витрина механика', icon: <StoreIcon fontSize="large" />, to: '/warehouse/catalog' },
  { title: 'Управление плитками', icon: <BuildIcon fontSize="large" />, to: '/mechanic-tile' },
  { title: 'Управление новостями', icon: <AnnouncementIcon fontSize="large" />, to: '/news-management' },
  { title: 'Управление галереей', icon: <PhotoLibraryIcon fontSize="large" />, to: '/gallery-management' },
  { title: 'Витрина', icon: <StorefrontIcon fontSize="large" />, to: '/warehouse/list' },
];

const SeniorWarehousemanHomePage = () => {
  const navigate = useNavigate();

  return (
    <Box sx={{ p: 4 }}>
      <Typography variant="h4" gutterBottom>
        Домашняя страница старшего кладовщика
      </Typography>

      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          flexWrap: 'wrap',
          gap: '24px',
          mt: 4,
        }}
      >
        {tiles.map((tile, idx) => (
          <Box
            key={idx}
            onClick={() => navigate(tile.to)}
            sx={{
              width: 260,
              height: 160,
              borderRadius: 6,
              background: 'linear-gradient(135deg, #2c2f33, #3a3f47)',
              color: 'white',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 8px 24px rgba(0,0,0,0.25)',
              cursor: 'pointer',
              opacity: 0,
              transform: 'translateY(10px)',
              animation: `fadeInUp 0.5s ease ${idx * 0.1}s forwards`, // 👈 анимация прямо здесь!
              transition: 'transform 0.3s ease, box-shadow 0.3s ease',

              '&:hover': {
                transform: 'translateY(-5px) scale(1.04)',
                boxShadow: '0 12px 36px rgba(0,0,0,0.4)',
              },
            }}
          >
            {tile.icon}
            <Typography variant="h6" mt={1}>
              {tile.title}
            </Typography>
          </Box>
        ))}
      </Box>
    </Box>
  );
};

export default SeniorWarehousemanHomePage;
