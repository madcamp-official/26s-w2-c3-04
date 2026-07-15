// 최종 네컷 이미지를 실제로 만드는 canvas 합성 로직.
// univ_ver3.html의 composeVertical/composeGrid를 이식하되, AI가 생성한 프레임
// 이미지를 다루는 복잡한 cover-crop/이음새 보정 로직은 이번 통합 범위에서는
// 빼고(별도 백엔드 호출이 필요해서), 색상 배경 + 사진 + 하단 라벨(또는 대학교
// 로고+영문명)만으로 단순하고 안정적으로 합성하도록 정리했다.

export type Layout = '1x4' | '2x2';

export interface ComposeOptions {
  photos: string[]; // 선택된 4장의 dataURL (순서대로)
  layout: Layout;
  frameColor: string; // 프레임 배경색 (hex)
  title: string; // 하단에 표시할 문구 (테마 라벨 또는 대학교 영문명)
  logoDataUrl?: string | null; // 대학교 로고 (있으면 하단에 제목과 나란히 표시)
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

function roundRectPath(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function drawHeart(ctx: CanvasRenderingContext2D, cx: number, cy: number, size: number, color: string) {
  ctx.save();
  ctx.fillStyle = color;
  ctx.beginPath();
  const t = size * 0.3;
  ctx.moveTo(cx, cy + t);
  ctx.bezierCurveTo(cx, cy, cx - size / 2, cy, cx - size / 2, cy + t);
  ctx.bezierCurveTo(cx - size / 2, cy + (size + t) / 2, cx, cy + (size + t) / 2, cx, cy + size);
  ctx.bezierCurveTo(cx, cy + (size + t) / 2, cx + size / 2, cy + (size + t) / 2, cx + size / 2, cy + t);
  ctx.bezierCurveTo(cx + size / 2, cy, cx, cy, cx, cy + t);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}

// 사진을 목표 사각형에 꽉 채우면서(비율 유지, 남는 부분은 크롭) 그림 — object-fit: cover와 동일
function drawPhotoCoverFit(
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  dx: number,
  dy: number,
  dw: number,
  dh: number,
  radius = 0
) {
  const iw = img.naturalWidth || img.width;
  const ih = img.naturalHeight || img.height;
  const ir = iw / ih;
  const tr = dw / dh;
  let sx = 0, sy = 0, sw = iw, sh = ih;
  if (ir > tr) {
    sw = ih * tr;
    sx = (iw - sw) / 2;
  } else {
    sh = iw / tr;
    sy = (ih - sh) / 2;
  }
  ctx.save();
  if (radius > 0) {
    roundRectPath(ctx, dx, dy, dw, dh, radius);
    ctx.clip();
  }
  ctx.drawImage(img, sx, sy, sw, sh, dx, dy, dw, dh);
  ctx.restore();
}

interface VerticalGeom {
  photoW: number; photoH: number; border: number; pad: number; gap: number; chipW: number; chipH: number; footerH: number; W: number; H: number;
}
function getVerticalGeom(): VerticalGeom {
  const photoW = 300, photoH = 180, border = 40, pad = 20, gap = 16, footerH = 110;
  const chipW = photoW + border * 2;
  const chipH = photoH + border * 2 + gap;
  const W = chipW + pad * 2;
  const H = pad + chipH * 4 + footerH;
  return { photoW, photoH, border, pad, gap, chipW, chipH, footerH, W, H };
}

interface GridGeom {
  photoW: number; photoH: number; border: number; pad: number; gap: number; chipW: number; chipH: number; footerH: number; W: number; H: number;
}
function getGridGeom(): GridGeom {
  const photoW = 260, photoH = 195, border = 28, pad = 20, gap = 16, footerH = 90;
  const chipW = photoW + border * 2;
  const chipH = photoH + border * 2;
  const W = pad * 2 + chipW * 2 + gap;
  const H = pad * 2 + chipH * 2 + gap + footerH;
  return { photoW, photoH, border, pad, gap, chipW, chipH, footerH, W, H };
}

function drawFooter(
  ctx: CanvasRenderingContext2D,
  W: number,
  footerY: number,
  footerH: number,
  title: string,
  logoImg: HTMLImageElement | null
) {
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  const centerY = footerY + footerH / 2;

  if (logoImg) {
    // 대학교 로고 + 영문명을 나란히
    const logoSize = Math.min(footerH * 0.5, 40);
    ctx.font = `bold ${Math.max(13, Math.round(logoSize * 0.42))}px sans-serif`;
    const textWidth = ctx.measureText(title).width;
    const gap = 10;
    const totalW = logoSize + gap + textWidth;
    const startX = W / 2 - totalW / 2;
    ctx.drawImage(logoImg, startX, centerY - logoSize / 2, logoSize, logoSize);
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'left';
    ctx.fillText(title, startX + logoSize + gap, centerY + 1);
    ctx.textAlign = 'center';
  } else {
    // 하트 + 제목 + 날짜
    [-30, 0, 30].forEach((dx) => drawHeart(ctx, W / 2 + dx, footerY + footerH * 0.32, 8, '#ffffff'));
    ctx.save();
    ctx.shadowColor = 'rgba(0,0,0,0.35)';
    ctx.shadowBlur = 4;
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 26px sans-serif';
    ctx.fillText(title, W / 2, footerY + footerH * 0.6);
    ctx.font = '13px sans-serif';
    ctx.fillStyle = 'rgba(255,255,255,0.85)';
    const dateStr = new Date().toLocaleDateString('ko-KR');
    ctx.fillText(dateStr, W / 2, footerY + footerH * 0.82);
    ctx.restore();
  }
}

async function composeVertical(images: HTMLImageElement[], opts: ComposeOptions): Promise<HTMLCanvasElement> {
  const { photoW, photoH, border, pad, chipW, chipH, footerH, W, H } = getVerticalGeom();
  const canvas = document.createElement('canvas');
  const scale = 2;
  canvas.width = W * scale;
  canvas.height = H * scale;
  const ctx = canvas.getContext('2d')!;
  ctx.setTransform(scale, 0, 0, scale, 0, 0);
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

  ctx.fillStyle = opts.frameColor;
  ctx.fillRect(0, 0, W, H);

  images.forEach((img, i) => {
    const chipY = pad + i * chipH;
    const chipX = pad;
    ctx.fillStyle = '#ffffff';
    roundRectPath(ctx, chipX + border - 6, chipY + border - 6, photoW + 12, photoH + 12, 6);
    ctx.fill();
    drawPhotoCoverFit(ctx, img, chipX + border, chipY + border, photoW, photoH, 2);
  });

  const logoImg = opts.logoDataUrl ? await loadImage(opts.logoDataUrl).catch(() => null) : null;
  drawFooter(ctx, W, H - footerH, footerH, opts.title, logoImg);

  return canvas;
}

async function composeGrid(images: HTMLImageElement[], opts: ComposeOptions): Promise<HTMLCanvasElement> {
  const { photoW, photoH, border, pad, gap, chipW, chipH, footerH, W, H } = getGridGeom();
  const canvas = document.createElement('canvas');
  const scale = 2;
  canvas.width = W * scale;
  canvas.height = H * scale;
  const ctx = canvas.getContext('2d')!;
  ctx.setTransform(scale, 0, 0, scale, 0, 0);
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

  ctx.fillStyle = opts.frameColor;
  ctx.fillRect(0, 0, W, H);

  const positions = [
    [0, 0], [1, 0],
    [0, 1], [1, 1],
  ];
  images.forEach((img, i) => {
    const [col, row] = positions[i];
    const chipX = pad + col * (chipW + gap);
    const chipY = pad + row * (chipH + gap);
    ctx.fillStyle = '#ffffff';
    roundRectPath(ctx, chipX + border - 6, chipY + border - 6, photoW + 12, photoH + 12, 6);
    ctx.fill();
    drawPhotoCoverFit(ctx, img, chipX + border, chipY + border, photoW, photoH, 2);
  });

  const logoImg = opts.logoDataUrl ? await loadImage(opts.logoDataUrl).catch(() => null) : null;
  drawFooter(ctx, W, H - footerH, footerH, opts.title, logoImg);

  return canvas;
}

// 선택된 4장 + 옵션을 받아 최종 합성 이미지를 dataURL(JPEG)로 반환
export async function composeFinalImage(opts: ComposeOptions): Promise<string> {
  const images = await Promise.all(opts.photos.map((src) => loadImage(src)));
  const canvas =
    opts.layout === '1x4' ? await composeVertical(images, opts) : await composeGrid(images, opts);
  return canvas.toDataURL('image/jpeg', 0.92);
}
