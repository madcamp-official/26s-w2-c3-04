# AI 인생네컷 (ai4cut)

`ai-four-cut (4).html`의 손동작(제스처) 인식 촬영과 `4cut_demo`의 프롬프트 기반 AI 프레임 생성을 합친 버전입니다.

## 흐름

1. 카메라 + MediaPipe HandLandmarker로 손동작을 인식해 8장(제스처 4종 x 2회)을 자동 촬영
2. 8장 중 마음에 드는 4장을 선택하고, 레이아웃(세로 1x4 / 2x2)을 고름
3. (선택) 프롬프트를 입력해 Cloudflare Workers AI로 프레임(테두리) 생성
4. "4컷 완성하기"로 선택한 사진 + (있다면) 생성된 프레임을 합성, 다운로드

## 실행

AI 프레임 생성 기능은 Cloudflare Workers AI를 프록시하는 로컬 서버가 필요합니다.

```bash
cd ai4cut
export CF_ACCOUNT_ID="your_cloudflare_account_id"
export CF_API_TOKEN="your_cloudflare_api_token"
python3 server.py 8000
```

브라우저에서 `http://localhost:8000`을 엽니다.

AI 프레임 생성 없이 촬영/선택/기본 합성만 쓰고 싶다면 서버 없이 `index.html`을 직접 열어도 되지만, 카메라 접근에는 `https://` 또는 `localhost` 환경이 필요합니다.

실제 인증값은 소스 코드나 커밋에 넣지 마세요. 이미 노출된 토큰은 Cloudflare에서 폐기하고 새 토큰을 발급하는 것이 안전합니다.
