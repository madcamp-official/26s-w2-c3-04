# AI 인생네컷 백엔드

Node.js와 Express로 정적 프론트엔드를 제공하고 Cloudflare Workers AI를 대신
호출하는 무상태 백엔드입니다. DB와 서버 파일 저장소를 사용하지 않습니다.

## 1. 준비물
- Node.js 22 이상 (AWS App Runner 배포 런타임과 동일한 버전 권장)
- Cloudflare 계정 ID, Workers AI 권한이 있는 API 토큰 (이미 갖고 계신 값)

## 2. 설치
이 폴더(`test`)를 터미널에서 열고:

```bash
npm install
```

## 3. 환경변수 설정
`.env.example` 파일을 복사해서 `.env` 파일을 만들고, 안에 있는 값을 실제 계정 ID / API 토큰으로 채워주세요.

```bash
cp .env.example .env
```

그 다음 `.env` 파일을 열어서:
```
CLOUDFLARE_ACCOUNT_ID=실제_계정ID
CLOUDFLARE_API_TOKEN=실제_API_토큰
```

## 4. 서버 실행

```bash
npm start
```

터미널에 `서버 실행 중: http://localhost:8787` 이 뜨면 성공입니다.

서버 상태만 확인하려면 다음 주소를 사용합니다.

```text
GET http://localhost:8787/health
```

## 5. 접속
**⚠️ 중요: HTML 파일을 더블클릭해서 직접 열면 안 됩니다.** 반드시 브라우저에서 아래 주소로 접속하세요:

```
http://localhost:8787/index.html
```

파일을 `file://`로 직접 열면 `fetch('/api/generate-frame')`가 이 서버로 연결되지 않아서 다시 "Failed to fetch" 에러가 납니다. 위 주소로 접속해야 프론트엔드와 백엔드가 같은 서버(localhost:8787)에서 동작해서 정상적으로 통신합니다.

## 문제가 생기면
- **"CLOUDFLARE_ACCOUNT_ID / CLOUDFLARE_API_TOKEN이 없습니다" 에러로 서버가 안 켜짐**: `.env` 파일을 안 만들었거나 값이 비어있는 경우입니다. 3번 단계를 다시 확인해주세요.
- **"AI 프레임 생성 서버에 연결할 수 없습니다"**: 서버(`npm start`)가 꺼져있거나, HTML을 `http://localhost:8787/...`가 아닌 다른 방식(더블클릭 등)으로 열었을 가능성이 높습니다.
- **"Cloudflare Workers AI 호출 실패"**: 서버는 잘 켜졌고 요청도 잘 갔지만, Cloudflare 쪽에서 거부한 경우입니다. 에러 메시지의 detail에 Cloudflare가 보낸 구체적인 사유(토큰 권한 부족, 계정 ID 오타 등)가 담겨 있으니 확인해주세요.

## AWS App Runner 배포 인계

이 폴더에는 App Runner 소스 배포 설정인 `apprunner.yaml`이 포함되어 있습니다.
실제 AWS 리소스 생성 전 준비사항과 콘솔 입력값은 `AWS_DEPLOY.md`를 확인하세요.
