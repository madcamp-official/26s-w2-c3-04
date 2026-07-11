# 인생네컷 프로토타입

웹캠으로 사진 4장을 촬영하고 Cloudflare Workers AI로 생성한 프레임과 합성하는 로컬 프로토타입입니다.

## 실행

Cloudflare 인증값을 환경변수로 설정한 뒤 서버를 실행합니다.

```bash
cd 4cut_demo
export CF_ACCOUNT_ID="your_cloudflare_account_id"
export CF_API_TOKEN="your_cloudflare_api_token"
python3 server.py 8000
```

브라우저에서 `http://localhost:8000`을 엽니다.

실제 인증값은 소스 코드나 커밋에 넣지 마세요. 이미 노출된 토큰은 Cloudflare에서 폐기하고 새 토큰을 발급하는 것이 안전합니다.
