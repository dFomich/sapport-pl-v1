import React from 'react';
import { Typography, ButtonBase } from '@mui/material';
import InventoryIcon from '@mui/icons-material/Inventory';
import ListAltIcon from '@mui/icons-material/ListAlt';
import { useNavigate } from 'react-router-dom';

import './homepages.scss';

const tiles = [
  { title: 'Витрина', icon: <InventoryIcon fontSize="large" />, to: '/mechanic/catalog' },
  { title: 'Все заявки', icon: <ListAltIcon fontSize="large" />, to: '/mechanic/my-orders' },
];

const SeniorMechanicHomePage = () => {
  const navigate = useNavigate();

  return (
    <div style={{ padding: '2rem' }}>
      <Typography variant="h4" gutterBottom>
        Домашняя страница старшего механика
      </Typography>
      <div style={{ display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: '24px', marginTop: '24px' }}>
        {tiles.map((tile, idx) => (
          <ButtonBase
            key={idx}
            onClick={() => navigate(tile.to)}
            className={`fade-in fade-in-delay-${idx + 1}`}
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
              transition: 'transform 0.3s ease, box-shadow 0.3s ease',
              '&:hover': {
                transform: 'translateY(-4px) scale(1.03)',
                boxShadow: '0 12px 32px rgba(0,0,0,0.35)',
              },
            }}
          >
            {tile.icon}
            <Typography variant="h6" mt={1}>
              {tile.title}
            </Typography>
          </ButtonBase>
        ))}
      </div>
    </div>
  );
};

export default SeniorMechanicHomePage;
