# AWS App Runner 배포 인계 문서

이 문서는 코드를 AWS에 올리기 직전까지 준비된 내용을 설명합니다. 저장소에는
AWS 계정 정보나 실제 Cloudflare 토큰이 포함되어 있지 않습니다.

## 준비된 구성

- Node.js 22 App Runner 런타임 설정: `apprunner.yaml`
- 빌드 명령: `npm ci --omit=dev`
- 실행 명령: `npm start`
- 서비스 포트: `8080` (`PORT`는 App Runner가 자동 주입)
- 상태 확인 경로: `GET /health`
- Cloudflare 요청 제한 시간: 100초
- 요청 본문 최대 크기: 25MB
- DB 및 영구 파일 저장: 사용하지 않음
- 유일한 프론트엔드 진입점: `public_index.html`

## AWS에서 친구가 진행할 작업

1. 이 브랜치를 GitHub 원격 저장소에 push합니다.
2. AWS App Runner에서 **Create service**를 선택합니다.
3. Source는 **Source code repository**, Provider는 **GitHub**를 선택합니다.
4. 이 저장소와 배포 브랜치를 연결합니다.
5. Source directory를 `/test`로 지정합니다.
6. Configuration source는 **Use a configuration file**을 선택합니다.
7. Health check path를 `/health`로 지정합니다.
8. Cloudflare 인증값은 AWS Secrets Manager 또는 SSM Parameter Store에 저장합니다.
9. App Runner instance role에 해당 secret을 읽을 최소 권한을 부여합니다.
10. 아래 이름으로 App Runner 런타임 환경변수에 secret ARN을 연결합니다.

```text
CLOUDFLARE_ACCOUNT_ID
CLOUDFLARE_API_TOKEN
```

모델을 바꿀 때만 아래 일반 환경변수를 추가합니다. 생략하면 코드의 기본값을 씁니다.

```text
CLOUDFLARE_MODEL
CLOUDFLARE_TEXT_MODEL
```

`PORT`는 App Runner 예약 변수이므로 콘솔에서 직접 추가하지 않습니다.

## 배포 후 확인 순서

1. App Runner가 제공한 HTTPS 주소의 `/health`에서 `{"status":"ok"}`를 확인합니다.
2. App Runner가 제공한 HTTPS 주소의 `/`를 열고 `public_index.html` 통합 화면인지 확인합니다.
3. 브라우저 카메라 권한을 허용하고 사진 촬영을 확인합니다.
4. 자유 테마 분석과 AI 프레임 생성을 각각 한 번씩 확인합니다.
5. App Runner 로그에 토큰이나 이미지 본문이 출력되지 않는지 확인합니다.
6. AWS Budgets에서 비용 알림을 설정합니다.

## 배포 전에 알아둘 제한

- App Runner의 전체 HTTP 요청 제한 시간은 120초이며, 이 서버는 외부 AI 호출을
  100초에서 중단합니다.
- 이미지는 Base64 JSON으로 전달되므로 요청이 큽니다. 25MB를 넘으면 서버가
  `413` 오류를 반환합니다.
- 서버는 무상태입니다. 배포 인스턴스가 교체되어도 보존해야 할 데이터를 로컬
  파일에 저장하면 안 됩니다.
- 공개 URL을 장기간 운영한다면 분산 환경에서도 동작하는 호출 횟수 제한을 별도로
  추가해야 합니다. 현재 준비 범위는 팀 프로젝트 시연용입니다.

## 로컬 최종 점검

```bash
cd test
cp .env.example .env
# .env에 실제 Cloudflare 값을 입력
npm ci
npm start
```

`.env`는 `.gitignore`에 포함되어 있으므로 커밋하지 않습니다.

## 이후 기능 수정 시 배포 구조 유지

- 프롬프트, 테마 UI, 동작 인식, 촬영 및 합성 로직은 `public_index.html`에서 수정합니다.
- 위 프론트엔드 수정은 API 요청 형식을 유지하는 한 `server.js`, `apprunner.yaml`,
  Secrets Manager, IAM 설정을 변경할 필요가 없습니다.
- App Runner 자동 배포를 켰다면 이 브랜치에 push한 뒤 새 버전이 자동 배포됩니다.
- API 요청/응답 형식, 환경변수, npm 의존성, 요청 크기 또는 제한 시간을 바꿀 때만
  백엔드나 배포 설정을 함께 검토합니다.
- 구체적인 변경 경계와 API 약속은 `ARCHITECTURE.md`를 기준으로 판단합니다.
