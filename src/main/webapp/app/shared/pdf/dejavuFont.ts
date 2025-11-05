import jsPDF from 'jspdf';
import { dejaVuSansBase64 } from './dejavuFontBase64';

let fontRegistered = false;

// Функция для предзагрузки шрифта
export const preloadDejaVuFont = async (): Promise<void> => {
  if (fontRegistered) {
    console.warn('✅ DejaVu шрифт уже зарегистрирован');
    return Promise.resolve();
  }

  try {
    console.warn('🔄 Регистрируем шрифт DejaVu...');
    // Проверяем, что Base64 не пустой
    if (!dejaVuSansBase64 || dejaVuSansBase64.length < 1000) {
      throw new Error('Base64 шрифта не загружен или повреждён');
    }
    fontRegistered = true;
    console.warn(`✅ DejaVu шрифт зарегистрирован (${dejaVuSansBase64.length} символов)`);
  } catch (error) {
    console.error('❌ Ошибка регистрации шрифта DejaVu:', error);
    fontRegistered = false;
    throw error;
  }
};

// Функция для добавления шрифта в документ
export const addDejaVuFont = (doc: jsPDF): void => {
  if (!fontRegistered) {
    console.warn('⚠️ Шрифт не зарегистрирован, регистрируем сейчас...');
    fontRegistered = true;
  }

  try {
    console.warn('📄 Добавляем шрифт в PDF документ...');
    doc.addFileToVFS('DejaVuSans.ttf', dejaVuSansBase64);
    doc.addFont('DejaVuSans.ttf', 'DejaVuSans', 'normal');
    doc.addFont('DejaVuSans.ttf', 'DejaVuSans', 'bold');
    console.warn('✅ Шрифт DejaVu добавлен в документ');
  } catch (error) {
    console.error('❌ Ошибка добавления шрифта в документ:', error);
    throw error;
  }
};

// Проверка, зарегистрирован ли шрифт
export const isFontLoaded = (): boolean => {
  return fontRegistered;
};
