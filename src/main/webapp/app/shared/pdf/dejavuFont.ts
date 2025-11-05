import jsPDF from 'jspdf';
// @ts-expect-error: file-loader used to import font as URL
import fontUrl from '!!file-loader!../../../content/fonts/DejaVuSans.ttf';

let fontLoaded = false;
let fontBase64: string | null = null;

// Функция для предзагрузки шрифта
export const preloadDejaVuFont = async (): Promise<void> => {
  if (fontLoaded && fontBase64) {
    return; // Шрифт уже загружен
  }

  try {
    const response = await fetch(fontUrl);
    const fontBuffer = await response.arrayBuffer();
    const uint8Array = new Uint8Array(fontBuffer);
    const binaryString = Array.from(uint8Array)
      .map(byte => String.fromCharCode(byte))
      .join('');
    fontBase64 = btoa(binaryString);
    fontLoaded = true;
    console.warn('✅ DejaVu шрифт загружен');
  } catch (error) {
    console.error('❌ Ошибка загрузки шрифта DejaVu:', error);
    throw error;
  }
};

// Функция для добавления шрифта в документ
export const addDejaVuFont = (doc: jsPDF): void => {
  if (!fontLoaded || !fontBase64) {
    throw new Error('Шрифт DejaVu не загружен. Вызовите preloadDejaVuFont() перед использованием.');
  }

  doc.addFileToVFS('DejaVuSans.ttf', fontBase64);
  doc.addFont('DejaVuSans.ttf', 'DejaVuSans', 'normal');
  doc.addFont('DejaVuSans.ttf', 'DejaVuSans', 'bold');
};
