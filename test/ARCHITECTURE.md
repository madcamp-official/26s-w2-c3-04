# 배포 구조와 변경 경계

## 기준 파일

- 배포 프론트엔드: `public_index.html`
- 백엔드: `server.js`
- AWS App Runner 설정: `apprunner.yaml`
- 로컬 환경변수 예시: `.env.example`

`index.html`은 기존 구현을 보존한 레거시 파일입니다. 서버의 `/`와 `/index.html`은
파일명과 관계없이 항상 `public_index.html`을 제공합니다.

## 전체 흐름

```text
브라우저(public_index.html)
  ├─ MediaPipe 손동작 인식
  ├─ 웹캠 촬영·사진 선택
  ├─ 프레임 베이스 이미지·마스크 생성
  ├─ POST /api/theme-keywords
  └─ POST /api/generate-frame
             ↓
AWS App Runner(server.js)
  ├─ 정적 페이지 제공
  ├─ 요청 검증·타임아웃·오류 처리
  └─ 서버에 보관한 Cloudflare 인증값으로 외부 API 호출
             ↓
Cloudflare Workers AI
  ├─ 자유 테마를 영어 모티프로 변환
  └─ 인페인팅 프레임 이미지 생성
```

사진, 동작 인식 결과, 생성 이미지는 DB나 서버 파일에 영구 저장하지 않습니다.
최종 합성과 다운로드는 브라우저에서 수행합니다.

## 프론트엔드만 수정하면 되는 작업

다음 변경은 `public_index.html`만 수정하면 됩니다.

- 생성 프롬프트와 negative prompt 문구 조정
- 테마 프리셋, 색상, 입력 UI 변경
- MediaPipe 손동작 판정 기준 개선
- 인식할 포즈 추가·삭제
- 촬영 카운트다운과 사진 선택 흐름 변경
- 캔버스 합성 및 다운로드 디자인 변경

아래 API 약속을 유지하면 `server.js`, AWS App Runner, IAM, Secrets Manager를 다시
구성할 필요가 없습니다. 코드를 push하고 App Runner에서 새 버전만 배포하면 됩니다.

## 유지할 API 약속

### `POST /api/theme-keywords`

요청:

```json
{ "text": "숲속에서 찍은 느낌" }
```

성공 응답:

```json
{ "keywords": "a small pine tree, a leaf, a mushroom" }
```

### `POST /api/generate-frame`

요청 필드:

```text
prompt, negativePrompt, width, height, image, mask,
seed, strength, guidance
```

필수 형식:

- `prompt`: 1~4000자의 문자열
- `width`, `height`: 256~2048 사이의 정수
- `image`: Base64 PNG 문자열
- `mask`: PNG 바이트 배열
- 전체 JSON 요청: 25MB 이하

성공 응답:

```json
{ "image": "Base64 이미지", "mime": "image/png" }
```

### `GET /health`

AWS 상태 확인용이며 프론트엔드 기능과 독립적입니다.

```json
{ "status": "ok" }
```

## 백엔드 또는 배포 설정을 다시 검토해야 하는 경우

다음 변경은 프론트엔드 수정만으로 끝나지 않을 수 있습니다.

- API 요청 필드나 응답 형식을 변경할 때
- Cloudflare 모델 또는 다른 AI 제공자로 교체할 때
- 요청을 25MB보다 크게 보내야 할 때
- AI 요청이 100초보다 오래 걸릴 때
- 새 npm 패키지나 별도 서버 프로세스를 추가할 때
- 로그인, 사용자별 호출 제한, DB, S3 저장 기능을 추가할 때
- 프론트엔드와 백엔드를 서로 다른 도메인으로 분리할 때

이 경우에만 `server.js`, 환경변수, IAM 또는 `apprunner.yaml`을 함께 검토합니다.
