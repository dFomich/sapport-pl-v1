import jsPDF from 'jspdf';

// @ts-expect-error: file-loader used to import font as URL
import fontUrl from '!!file-loader!../../../content/fonts/DejaVuSans.ttf';

(async () => {
  const response = await fetch(fontUrl);
  const fontBuffer = await response.arrayBuffer();
  const uint8Array = new Uint8Array(fontBuffer);
  const binaryString = Array.from(uint8Array)
    .map(byte => String.fromCharCode(byte))
    .join('');
  const base64Font = btoa(binaryString);

  jsPDF.API.events.push([
    'addFonts',
    function () {
      // 👇 добавляем два стиля: normal и bold
      this.addFileToVFS('DejaVuSans.ttf', base64Font);
      this.addFont('DejaVuSans.ttf', 'DejaVuSans', 'normal');
      this.addFont('DejaVuSans.ttf', 'DejaVuSans', 'bold');
    },
  ]);
})();
