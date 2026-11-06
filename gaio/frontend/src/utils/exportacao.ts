type Valor = string | number | null | undefined;

const celula = (valor: Valor) => {
  if (valor === null || valor === undefined) return '';
  const texto = typeof valor === 'number' ? valor.toLocaleString('pt-BR', { useGrouping: false, maximumFractionDigits: 4 }) : valor;
  return /[";\n]/.test(texto) ? `"${texto.replace(/"/g, '""')}"` : texto;
};

const baixar = (blob: Blob, nomeArquivo: string) => {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = nomeArquivo;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
};

// CSV com ";" e BOM: e o formato que o Excel em portugues abre direto, com acentos e decimais com virgula.
export const montarCsv = (colunas: string[], linhas: Valor[][]) =>
  '\uFEFF' + [colunas, ...linhas].map((linha) => linha.map(celula).join(';')).join('\r\n');

export const baixarCsv = (nomeArquivo: string, colunas: string[], linhas: Valor[][]) =>
  baixar(new Blob([montarCsv(colunas, linhas)], { type: 'text/csv;charset=utf-8' }), nomeArquivo);

// Converte o SVG do grafico em PNG (fundo branco), sem depender de servico externo.
export const baixarPng = async (container: HTMLElement, nomeArquivo: string) => {
  const svg = container.querySelector('svg.recharts-surface') ?? container.querySelector('svg');
  if (!svg) return;
  const { width, height } = svg.getBoundingClientRect();
  const copia = svg.cloneNode(true) as SVGSVGElement;
  copia.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
  copia.setAttribute('width', String(width));
  copia.setAttribute('height', String(height));
  copia.style.fontFamily = getComputedStyle(document.body).fontFamily;

  const imagem = new Image();
  const svgUrl = URL.createObjectURL(new Blob([new XMLSerializer().serializeToString(copia)], { type: 'image/svg+xml;charset=utf-8' }));
  await new Promise<void>((resolve, reject) => {
    imagem.onload = () => resolve();
    imagem.onerror = () => reject(new Error('Não foi possível gerar a imagem do gráfico.'));
    imagem.src = svgUrl;
  });

  const escala = 2;
  const canvas = document.createElement('canvas');
  canvas.width = width * escala;
  canvas.height = height * escala;
  const contexto = canvas.getContext('2d');
  if (!contexto) return;
  contexto.fillStyle = '#ffffff';
  contexto.fillRect(0, 0, canvas.width, canvas.height);
  contexto.scale(escala, escala);
  contexto.drawImage(imagem, 0, 0, width, height);
  URL.revokeObjectURL(svgUrl);

  const png = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/png'));
  if (png) baixar(png, nomeArquivo);
};

// O PDF sai da impressao do navegador ("Salvar como PDF"); o CSS de impressao esconde menu e botoes.
export const imprimirComoPdf = () => window.print();

export const dataDoArquivo = () => new Date().toISOString().slice(0, 10);
