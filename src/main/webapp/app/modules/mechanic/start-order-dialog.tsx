import React, { useState } from 'react';
import { Button, Modal, ModalBody, ModalFooter, ModalHeader, Input, FormFeedback } from 'reactstrap';

type Props = {
  open: boolean;
  onClose: () => void;
  onStart: (orderNo: string) => void;
};

const StartOrderDialog: React.FC<Props> = ({ open, onClose, onStart }) => {
  const [orderNo, setOrderNo] = useState('');
  const valid = orderNo.trim().length > 0;

  return (
    <Modal isOpen={open} toggle={onClose} centered>
      <ModalHeader toggle={onClose}>Начать создание заказа</ModalHeader>
      <ModalBody>
        <label className="form-label">Название заказа (обычно номер машины)</label>
        <Input
          value={orderNo}
          onChange={e => setOrderNo(e.target.value)}
          placeholder="Например: Тягач А123ВС"
          invalid={!valid && orderNo.length > 0}
        />
        <FormFeedback>Введите название заказа.</FormFeedback>
      </ModalBody>
      <ModalFooter>
        <Button color="secondary" onClick={onClose}>
          Отмена
        </Button>
        <Button color="primary" disabled={!valid} onClick={() => onStart(orderNo.trim())}>
          Начать
        </Button>
      </ModalFooter>
    </Modal>
  );
};

export default StartOrderDialog;
