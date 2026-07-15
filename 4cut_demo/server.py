#!/usr/bin/env python3
"""
인생네컷 프로토타입용 로컬 서버.

- 정적 파일(index.html 등)을 서빙
- POST /api/generate-frame : 브라우저 대신 이 서버가 Cloudflare Workers AI를
  호출해서 CORS 문제를 피함 (Cloudflare REST API는 브라우저 직접 호출을
  지원하지 않는 서버-투-서버용 API라서, 같은 서버 안에서 우회 처리함)

필수 환경변수: CF_ACCOUNT_ID, CF_API_TOKEN
실행: python3 server.py [포트, 기본 8000]
"""

import base64
import json
import os
import ssl
import sys
import urllib.request
import urllib.error
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer

try:
    import certifi
except ImportError:
    certifi = None


def get_ca_file():
    if certifi:
        return certifi.where()
    candidates = [
        os.environ.get("SSL_CERT_FILE"),
        "/opt/anaconda3/lib/python3.13/site-packages/certifi/cacert.pem",
        "/opt/anaconda3/ssl/cert.pem",
        "/etc/ssl/cert.pem",
    ]
    for path in candidates:
        if path and os.path.exists(path):
            return path
    return None


# 텍스트→이미지 모델(SDXL/phoenix-1.0 등)은 "빈 자리를 남겨줘"를 프롬프트로만
# 부탁하는 방식이라 크기/위치가 어긋나는 문제가 반복됐음. 그래서 인페인팅
# 모델로 교체: 베이스 이미지 + 마스크(검정=사진 자리/절대 건드리지 않음,
# 흰색=테두리/AI가 재생성)를 함께 보내서 사진 자리를 코드가 100% 고정함.
CF_MODEL = "@cf/runwayml/stable-diffusion-v1-5-inpainting"


class Handler(SimpleHTTPRequestHandler):
    def _send_json(self, status, payload):
        body = json.dumps(payload).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def do_POST(self):
        if self.path != "/api/generate-frame":
            self._send_json(404, {"error": "not found"})
            return

        try:
            length = int(self.headers.get("Content-Length", "0"))
            raw = self.rfile.read(length)
            data = json.loads(raw or "{}")
        except Exception:
            self._send_json(400, {"error": "잘못된 요청 본문입니다."})
            return

        account_id = os.environ.get("CF_ACCOUNT_ID", "").strip()
        api_token = os.environ.get("CF_API_TOKEN", "").strip()
        prompt = (data.get("prompt") or "").strip()
        negative_prompt = (data.get("negativePrompt") or "").strip()
        width = data.get("width")
        height = data.get("height")
        seed = data.get("seed")
        strength = data.get("strength")
        guidance = data.get("guidance")
        image_b64 = data.get("image")  # 베이스 이미지 (base64 PNG)
        mask_bytes = data.get("mask")  # 마스크 PNG 파일의 바이트 배열

        if not account_id or not api_token:
            self._send_json(500, {"error": "서버에 CF_ACCOUNT_ID와 CF_API_TOKEN 환경변수가 필요합니다."})
            return
        if not prompt:
            self._send_json(400, {"error": "prompt가 필요합니다."})
            return

        payload = {"prompt": prompt, "num_steps": 20}
        if negative_prompt:
            payload["negative_prompt"] = negative_prompt
        # 256~2048 범위의 width/height. 프론트에서 실제 캔버스 크기를 보내주면
        # 그 비율 그대로 요청해서 늘어나거나 잘리지 않게 함
        if isinstance(width, (int, float)) and isinstance(height, (int, float)):
            payload["width"] = max(256, min(2048, int(width)))
            payload["height"] = max(256, min(2048, int(height)))
        if isinstance(seed, (int, float)):
            payload["seed"] = int(seed)
        if isinstance(strength, (int, float)):
            payload["strength"] = max(0, min(1, float(strength)))
        if isinstance(guidance, (int, float)):
            payload["guidance"] = max(1, min(20, float(guidance)))
        # 인페인팅용 베이스 이미지 + 마스크. 마스크는 흰색=재생성 영역,
        # 검정=보존 영역(사진이 들어갈 자리)이라는 약속으로 프론트에서 그려서 보냄
        if image_b64:
            payload["image_b64"] = image_b64
        if isinstance(mask_bytes, list):
            payload["mask"] = mask_bytes

        cf_url = (
            f"https://api.cloudflare.com/client/v4/accounts/"
            f"{account_id}/ai/run/{CF_MODEL}"
        )
        req = urllib.request.Request(
            cf_url,
            data=json.dumps(payload).encode("utf-8"),
            headers={
                "Authorization": f"Bearer {api_token}",
                "Content-Type": "application/json",
            },
            method="POST",
        )

        try:
            # 일부 로컬 Python 설치는 기본 인증서 경로가 비어 있어
            # CERTIFICATE_VERIFY_FAILED가 날 수 있다. certifi가 있으면 그 CA 묶음을
            # 명시적으로 사용해서 TLS 검증은 유지한 채 Cloudflare에 연결한다.
            ca_file = get_ca_file()
            ssl_context = ssl.create_default_context(cafile=ca_file) if ca_file else None
            with urllib.request.urlopen(req, timeout=90, context=ssl_context) as resp:
                content_type = resp.headers.get("Content-Type", "")
                raw_body = resp.read()
        except urllib.error.HTTPError as e:
            try:
                err_body = json.loads(e.read().decode("utf-8"))
            except Exception:
                err_body = {"raw": str(e)}
            self._send_json(e.code, {"error": f"Cloudflare API 오류 ({e.code})", "detail": err_body})
            return
        except urllib.error.URLError as e:
            self._send_json(502, {"error": f"Cloudflare에 연결하지 못했습니다: {e.reason}"})
            return
        except Exception as e:
            self._send_json(500, {"error": f"알 수 없는 오류: {e}"})
            return

        # phoenix-1.0/SDXL은 이미지 바이트를 그대로 응답으로 줌 (flux-1-schnell처럼
        # JSON { result: { image: base64 } } 형태가 아님). 두 경우 다 처리함
        if content_type.startswith("image/"):
            image_b64 = base64.b64encode(raw_body).decode("ascii")
            mime = content_type
        else:
            try:
                result = json.loads(raw_body.decode("utf-8"))
            except Exception:
                self._send_json(502, {"error": "응답을 해석하지 못했습니다.", "detail": raw_body[:200].decode("utf-8", "replace")})
                return
            if not result.get("success", True):
                self._send_json(502, {"error": "생성 실패", "detail": result.get("errors")})
                return
            image_b64 = result.get("result", {}).get("image")
            mime = "image/jpeg"
            if not image_b64:
                self._send_json(502, {"error": "응답에 이미지가 없습니다.", "detail": result})
                return

        self._send_json(200, {"image": image_b64, "mime": mime})

    def log_message(self, format, *args):
        # 콘솔에 접속 로그 간단히만 출력
        sys.stderr.write("%s - %s\n" % (self.address_string(), format % args))


if __name__ == "__main__":
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 8000
    server = ThreadingHTTPServer(("0.0.0.0", port), Handler)
    print(f"서버 실행 중: http://localhost:{port}  (Ctrl+C로 종료)")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\n서버 종료")
