// AI 인생네컷 - AI 프레임 생성 백엔드
//
// 역할: 프론트(intergration.html)가 호출하는 POST /api/generate-frame 요청을 받아서,
// Cloudflare Workers AI의 REST API(인페인팅 모델)로 그대로 전달하고, 결과 이미지를
// 프론트가 기대하는 형태({ image: base64문자열, mime })로 바꿔서 돌려준다.
//
// 중요: Cloudflare Workers AI 이미지 모델은 성공 시 "JSON이 아니라 이미지 바이너리
// 자체"를 응답 본문으로 돌려준다. 반면 실패 시에는 JSON({ success:false, errors:[...] })
// 을 돌려준다. 그래서 응답의 content-type을 보고 분기해서 처리해야 한다.

import 'dotenv/config';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();

const PORT = process.env.PORT || 8787;
const CLOUDFLARE_TIMEOUT_MS = 100_000;
const ACCOUNT_ID = process.env.CLOUDFLARE_ACCOUNT_ID;
const API_TOKEN = process.env.CLOUDFLARE_API_TOKEN;
// 이미지+마스크를 입력받는 인페인팅 모델. 다른 모델로 바꾸고 싶으면 이 값만 수정.
const MODEL = process.env.CLOUDFLARE_MODEL || '@cf/runwayml/stable-diffusion-v1-5-inpainting';
// 자유 입력 테마(한글 등)를 영어 모티프 키워드로 번역·확장할 때 쓰는 텍스트 생성 모델.
const TEXT_MODEL = process.env.CLOUDFLARE_TEXT_MODEL || '@cf/meta/llama-3.1-8b-instruct';

if (!ACCOUNT_ID || !API_TOKEN) {
  console.error('[설정 오류] .env 파일에 CLOUDFLARE_ACCOUNT_ID / CLOUDFLARE_API_TOKEN이 없습니다.');
  console.error('.env.example을 복사해서 .env를 만들고 값을 채워주세요.');
  process.exit(1);
}

// App Runner 같은 리버스 프록시 뒤에서 실제 요청 프로토콜/IP를 올바르게 인식한다.
app.set('trust proxy', 1);
app.disable('x-powered-by');

// 웹캠은 배포 환경에서 HTTPS로만 동작한다. App Runner가 TLS를 종료하므로,
// 브라우저에는 동일 출처의 카메라만 허용한다는 보안 헤더를 내려준다.
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'same-origin');
  res.setHeader('Permissions-Policy', 'camera=(self), microphone=()');
  next();
});

// AWS 상태 확인은 외부 AI를 호출하지 않고 서버 프로세스 자체만 검사한다.
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok' });
});

// 캔버스 이미지(PNG base64)와 마스크 바이트 배열까지 들어오므로 바디 용량 여유 있게
app.use(express.json({ limit: '25mb' }));

// 프론트엔드 정적 파일(html) 서빙 — server.js와 같은 폴더에 있는 html 파일들을
// 그대로 서빙한다. 이 서버를 거쳐서 열어야 fetch('/api/generate-frame')가 연결된다.
app.use(express.static(__dirname));

async function fetchCloudflare(url, options) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), CLOUDFLARE_TIMEOUT_MS);

  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timeout);
  }
}

function isValidDimension(value) {
  return Number.isInteger(value) && value >= 256 && value <= 2048;
}

app.post('/api/generate-frame', async (req, res) => {
  try {
    const {
      prompt,
      negativePrompt,
      width,
      height,
      image,   // base64 PNG 문자열 (data: 접두사 없음)
      mask,    // PNG 파일 바이트 배열
      seed,
      strength,
      guidance,
    } = req.body || {};

    if (!prompt || typeof prompt !== 'string') {
      return res.status(400).json({ error: 'prompt가 필요합니다.' });
    }
    if (prompt.length > 4000) {
      return res.status(400).json({ error: 'prompt는 4000자 이하여야 합니다.' });
    }
    if (!isValidDimension(width) || !isValidDimension(height)) {
      return res.status(400).json({ error: 'width와 height는 256~2048 사이의 정수여야 합니다.' });
    }
    if (typeof image !== 'string' || !Array.isArray(mask)) {
      return res.status(400).json({ error: 'image와 mask가 올바른 형식이어야 합니다.' });
    }

    const cfBody = {
      prompt,
      negative_prompt: negativePrompt,
      width,
      height,
      image_b64: image,
      mask,
      seed,
      strength,
      guidance,
      num_steps: 20, // 이 모델의 최대값(20)으로 고정 — 더 높은 품질을 원하면 다른 모델 사용
    };
    // undefined 필드는 그대로 보내면 일부 모델에서 검증 오류가 날 수 있어 제거
    Object.keys(cfBody).forEach((k) => cfBody[k] === undefined && delete cfBody[k]);

    const cfRes = await fetchCloudflare(
      `https://api.cloudflare.com/client/v4/accounts/${ACCOUNT_ID}/ai/run/${MODEL}`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${API_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(cfBody),
      }
    );

    const contentType = cfRes.headers.get('content-type') || '';

    // 실패 응답은 JSON으로 옴: { success: false, errors: [{ code, message }] }
    if (contentType.includes('application/json')) {
      const data = await cfRes.json();
      if (!cfRes.ok || data.success === false) {
        const detail = data.errors ? JSON.stringify(data.errors) : undefined;
        return res.status(cfRes.status || 500).json({
          error: 'Cloudflare Workers AI 호출 실패',
          detail,
        });
      }
      // 일부 모델은 성공 시에도 JSON으로 { result: { image: base64 } } 형태를 줄 수 있음
      const b64 = data.result?.image;
      if (b64) {
        return res.json({ image: b64, mime: 'image/png' });
      }
      return res.status(500).json({ error: '예상치 못한 응답 형식입니다.', detail: JSON.stringify(data) });
    }

    // 성공 응답은 이미지 바이너리 자체로 옴
    if (!cfRes.ok) {
      const text = await cfRes.text();
      return res.status(cfRes.status).json({ error: 'Cloudflare Workers AI 호출 실패', detail: text });
    }
    const arrayBuffer = await cfRes.arrayBuffer();
    const base64 = Buffer.from(arrayBuffer).toString('base64');
    return res.json({ image: base64, mime: contentType || 'image/png' });
  } catch (err) {
    console.error('[generate-frame 오류]', err);
    if (err && err.name === 'AbortError') {
      return res.status(504).json({ error: 'AI 생성 요청 시간이 초과되었습니다. 다시 시도해주세요.' });
    }
    return res.status(500).json({ error: 'AI 프레임 생성 중 서버 오류가 발생했습니다.' });
  }
});

// 자유 입력 테마(예: "숲에서 찍은거")를 인페인팅 프롬프트에 바로 꽂아 넣으면, CLIP
// 텍스트 인코더가 한글을 사실상 이해하지 못해 아무 효과가 없다. 그래서 이 라우트가
// 먼저 텍스트 생성 모델로 (1) 영어로 번역하고 (2) 그 장면을 표현하는 구체적인 영어
// 모티프 몇 개로 확장한 뒤, 프론트가 그 결과를 프롬프트에 꽂아 넣는다.
app.post('/api/theme-keywords', async (req, res) => {
  try {
    const { text } = req.body || {};
    if (!text || !String(text).trim()) {
      return res.status(400).json({ error: 'text가 필요합니다.' });
    }
    if (String(text).length > 300) {
      return res.status(400).json({ error: 'text는 300자 이하여야 합니다.' });
    }

    const systemPrompt =
      'You convert a short theme/scene description, possibly written in Korean or any other ' +
      'language, into concrete visual motifs for a minimalist flat 2D vector illustration frame ' +
      'border. First understand the meaning (translate internally if needed), then output ONLY ' +
      '3 to 5 short English noun phrases separated by commas, each describing one distinct small ' +
      'object or symbol that represents the scene (example: input "forest" -> "a small pine tree, ' +
      'a leaf, a wooden log, a mushroom"). Each phrase must start with "a" or "a small" and be under ' +
      '5 words. Do not use the word "tiny". Do not add explanations, quotes, numbering, or any text ' +
      'other than the comma-separated list.';

    const cfRes = await fetchCloudflare(
      `https://api.cloudflare.com/client/v4/accounts/${ACCOUNT_ID}/ai/run/${TEXT_MODEL}`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${API_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: String(text).trim() },
          ],
          max_tokens: 80,
        }),
      }
    );

    const data = await cfRes.json();
    if (!cfRes.ok || data.success === false) {
      const detail = data.errors ? JSON.stringify(data.errors) : undefined;
      return res.status(cfRes.status || 500).json({ error: '테마 분석 실패', detail });
    }

    const raw = (data.result && (data.result.response || data.result.result)) || '';
    const keywords = String(raw).trim().replace(/^["']|["']$/g, '');
    if (!keywords) {
      return res.status(502).json({ error: '테마 분석 응답이 비어 있습니다.', detail: JSON.stringify(data) });
    }
    return res.json({ keywords });
  } catch (err) {
    console.error('[theme-keywords 오류]', err);
    if (err && err.name === 'AbortError') {
      return res.status(504).json({ error: '테마 분석 요청 시간이 초과되었습니다. 다시 시도해주세요.' });
    }
    return res.status(500).json({ error: '테마 분석 중 서버 오류가 발생했습니다.' });
  }
});

// API 요청 오류는 정적 HTML 응답이 아니라 JSON으로 통일한다.
app.use('/api', (req, res) => {
  res.status(404).json({ error: '존재하지 않는 API입니다.' });
});

app.use((err, req, res, next) => {
  if (err && err.type === 'entity.too.large') {
    return res.status(413).json({ error: '요청 이미지가 너무 큽니다. 최대 요청 크기는 25MB입니다.' });
  }
  console.error('[요청 처리 오류]', err);
  return res.status(500).json({ error: '요청 처리 중 서버 오류가 발생했습니다.' });
});

const server = app.listen(PORT, () => {
  console.log(`서버 실행 중: http://localhost:${PORT}`);
  console.log(`-> http://localhost:${PORT}/index.html 또는 http://localhost:${PORT}/public_index.html 로 열어야 AI 프레임 생성이 동작합니다.`);
  console.log(`   (파일을 더블클릭해서 file://로 열면 /api/generate-frame 호출이 실패합니다.)`);
});

function shutdown(signal) {
  console.log(`${signal} 수신: 새 요청을 중단하고 서버를 종료합니다.`);
  server.close(() => process.exit(0));
  setTimeout(() => process.exit(1), 10_000).unref();
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
