import jsPDF from 'jspdf';
// @ts-expect-error: file-loader used to import font as URL
import fontUrl from '!!file-loader!../../../content/fonts/DejaVuSans.ttf';

let fontLoaded = false;
let fontBase64: string | null = null;
let loadingPromise: Promise<void> | null = null;

// Функция для предзагрузки шрифта
export const preloadDejaVuFont = async (): Promise<void> => {
  // Если уже загружается, возвращаем существующий промис
  if (loadingPromise) {
    return loadingPromise;
  }

  // Если уже загружен, сразу возвращаемся
  if (fontLoaded && fontBase64) {
    console.warn('✅ DejaVu шрифт уже загружен');
    return Promise.resolve();
  }

  loadingPromise = (async () => {
    try {
      console.warn('🔄 Начинаем загрузку шрифта DejaVu...');
      const response = await fetch(fontUrl);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const fontBuffer = await response.arrayBuffer();
      const uint8Array = new Uint8Array(fontBuffer);
      const binaryString = Array.from(uint8Array)
        .map(byte => String.fromCharCode(byte))
        .join('');
      fontBase64 = btoa(binaryString);
      fontLoaded = true;
      console.warn('✅ DejaVu шрифт успешно загружен');
    } catch (error) {
      console.error('❌ Ошибка загрузки шрифта DejaVu:', error);
      fontLoaded = false;
      fontBase64 = null;
      loadingPromise = null;
      throw error;
    }
  })();

  return loadingPromise;
};

// Функция для добавления шрифта в документ
export const addDejaVuFont = (doc: jsPDF): void => {
  if (!fontLoaded || !fontBase64) {
    throw new Error('Шрифт DejaVu не загружен. Вызовите preloadDejaVuFont() перед использованием.');
  }

  try {
    doc.addFileToVFS('DejaVuSans.ttf', fontBase64);
    doc.addFont('DejaVuSans.ttf', 'DejaVuSans', 'normal');
    doc.addFont('DejaVuSans.ttf', 'DejaVuSans', 'bold');
    console.warn('✅ Шрифт DejaVu добавлен в документ');
  } catch (error) {
    console.error('❌ Ошибка добавления шрифта в документ:', error);
    throw error;
  }
};

// Проверка, загружен ли шрифт
export const isFontLoaded = (): boolean => {
  return fontLoaded && fontBase64 !== null;
};
