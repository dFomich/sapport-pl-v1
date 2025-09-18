import React, { useEffect, useState } from 'react';
import { useCart } from './cart-context';
import './tractor-button.scss';

type Props = {
  onClick: () => void;
};

const TractorButton: React.FC<Props> = ({ onClick }) => {
  const cart = useCart();
  const positions = cart.state.items.length;

  const [animate, setAnimate] = useState(false);
  const [ripples, setRipples] = useState<{ x: number; y: number; id: number }[]>([]);

  useEffect(() => {
    if (positions > 0) {
      setAnimate(true);
      const t = setTimeout(() => setAnimate(false), 600);
      return () => clearTimeout(t);
    }
  }, [positions]);

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const size = rect.width;
    const x = e.clientX - rect.left - size / 2;
    const y = e.clientY - rect.top - size / 2;
    const newRipple = { x, y, id: Date.now() };

    setRipples(prev => [...prev, newRipple]);
    setTimeout(() => {
      setRipples(prev => prev.filter(r => r.id !== newRipple.id));
    }, 600);

    onClick();
  };

  return (
    <button onClick={handleClick} className={`modern-cart-btn ${animate ? 'bump' : ''}`} title="Открыть корзину">
      <div className="cart-icon" />
      {positions > 0 && <span className="cart-badge">{positions}</span>}

      {ripples.map(r => (
        <span key={r.id} className="ripple" style={{ left: r.x, top: r.y }} />
      ))}
    </button>
  );
};

export default TractorButton;
