# AI 프레임 프롬프트 기준점

기록일: 2026-07-13 오후 (같은 날 오전 기준점을 대체, 2026-07-11 기준점의 후속)

이 문서는 현재 만족스러운 결과를 만든 프롬프트, 그 상태에 도달한 실험 기록, 그리고 각 단어가 결과에 미친 영향을 보존한다. 수정할 때는 문구를 덧붙이기보다 아래 실험 기록을 먼저 읽고, 같은 실패를 반복하지 않는 방향으로 교체한다.

## 현재 목표 (달성됨)

- 순백색에 가까운 밝은 아이보리 배경
- 전체 면적의 대부분이 비어 있는 포토 프레임
- 무늬는 별·하트 2종류, 몇 개(3~5개 느낌), 알아볼 수 있는 크기와 형태
- 실사가 아닌 평면 그림책 삽화 스타일
- 동물·캐릭터·마스코트 같은 형상 없음
- 크레용이나 연필 같은 미술도구 자체는 그리지 않음

## 화면에 보이는 긍정 프롬프트 (현재 확정본)

```text
flat 2D storybook illustration, childlike hand-drawn symbols with solid color fills, ultra-bright high-key pure white-ivory background, clean high-chroma palette, at least ninety percent bare and undecorated, dry wax-pastel texture contained inside each shape, a few small distinct stars and hearts, crisp sharply defined boundaries, plenty of empty space, saturated red, yellow, green, sky blue, pink and orange
```

## 화면에 보이는 네거티브 프롬프트 (현재 확정본)

```text
animal, character, mascot, repeated motifs, dense ornament, crowded border, clusters, all-over pattern, wallpaper, filled border, oversized motif, photorealistic, photograph, 3D render, realistic texture, realistic lighting, muddy colors, desaturated, gray haze, stains, smudges, blur, fuzzy edges, color bleeding, soft boundaries, black filter, dark overlay, underexposed, person, face, crayon stick, art supplies, text, watermark
```

## 내부에서 자동으로 추가되는 문구 (코드, 변경 없음 — 단 대부분 전달 안 됨)

- 스타일 가드 (프롬프트에 스타일 표현이 없을 때만 앞에 추가): `flat 2D storybook illustration, childlike hand-drawn symbols, solid color fills`
- 세로 스트립: `only one or two tiny isolated motifs across the entire strip, vast bare background` + `mostly plain border with isolated doodles` — **토큰 한계 밖이라 실제로는 전달 안 됨**
- 2×2 그리드: `only one tiny isolated motif per frame cell, vast bare background` — **마찬가지로 전달 안 됨**
- 참고 이미지 업로드 시: `matching the reference image colors and composition` — 전달 안 됨 (단, 참고 이미지는 프롬프트가 아니라 베이스 캔버스+낮은 strength로 반영되므로 기능 자체는 동작)

## ⚠️ 대전제: CLIP 77토큰 한계 (모든 판단의 출발점)

SD1.5의 CLIP 텍스트 인코더는 약 77토큰(콘텐츠 기준 약 75토큰)에서 그냥 잘린다. 청킹 없음. 한계 밖의 텍스트는 **존재하지 않는 것과 같다.** 긍정·네거티브 각각 따로 이 한계를 받는다.

### 현재 절단 지점 (실측)

**긍정** — `plenty of empty` 뒤에서 잘림:

- 전달됨: 스타일 → 밝은 배경 → 90% 여백 → 파스텔 질감 → `a few small distinct stars and hearts` → `crisp sharply defined boundaries` → `plenty of empty`
- 잘림: `space, saturated red, yellow, green, sky blue, pink and orange` + 코드가 붙이는 모든 문구
- 잘리는 파편(`plenty of empty`)이 "여백"이라는 뜻을 유지하는 무해한 절단이다. **이 절단 위치는 의도적으로 설계된 것.**

**네거티브** — `soft boundaries` 뒤에서 잘림:

- 전달됨: 동물·캐릭터 금지 → 무늬 밀도 억제 → 실사 방지 → 탁한 색·번짐 방지
- 잘림: `black filter, dark overlay, underexposed`(코드의 밝기 검수+후처리가 대신 방어), `person, face, crayon stick, art supplies, text, watermark`(현재 문제로 나타나지 않아 후순위)

### 절단 지점 측정 방법

수정할 때마다 반드시 실행한다. 단어 수 × 1.25 + 쉼표 수의 보수적 추정:

```bash
node -e 'const t="측정할 전체 프롬프트"; const ws=t.split(/\s+/);
let tok=0,ci=ws.length;
for(let i=0;i<ws.length;i++){tok+=(ws[i].includes("-")?2:1)*1.25+(ws[i].includes(",")?1:0);if(tok>75){ci=i;break;}}
console.log("보임:",ws.slice(0,ci).join(" "));console.log("잘림:",ws.slice(ci).join(" "))'
```

긍정을 잴 때는 화면 프롬프트 뒤에 코드가 붙이는 문구까지 이어 붙여서 잰다. 네거티브는 화면 값 + `, empty canvas, rectangular openings, grid lines`(스트립 모드 기준).

## 실험 기록: 어떤 단어가 어떤 변화를 만들었나 (2026-07-13)

시간 순서. 각 항목: 바꾼 것 → 관찰된 결과 → 얻은 추론.

### 1. 무늬 종류 4가지 나열 → 1가지 (`simple star, outline heart, small spiral or short line` → `a small star`)
- 결과: 무늬 다양성 감소 방향으로 개선.
- 추론: **종류를 나열하면 모델이 전부 조금씩 그린다.** 종류 수 = 화면에 나오는 다양성.

### 2. 개수 문구 `five or six` → `one or two` → 좋음 / → `a single` → 오히려 지저분해짐
- 결과: `one or two`는 깔끔. 더 줄이려고 `a single`로 짧게 바꾸자 갑자기 화려하고 지저분해짐.
- 추론 (이 세션의 핵심 발견): **프롬프트를 줄여도 결과가 나빠질 수 있다.** 문구가 짧아지며 절단 경계가 뒤로 밀려, 색 목록 직전의 `saturated`가 색 이름 없이 홀로 전달됐다. "채도 높게"만 지시받은 모델이 요란한 결과를 냈다. → **길이를 바꾸면(늘려도 줄여도) 절단 지점이 이동한다. 수정 후 반드시 재측정.**
- 부가 추론: 잘려서 죽어 있는 꼬리(색 목록)도 **절단 위치를 고정하는 패딩**으로 기능한다. 무심코 지우면 안 된다.

### 3. `childlike hand-drawn symbols` 제거 실험 → 실패, 복구
- 결과: 뺐더니 스타일이 무너짐(사용자 판정). 다시 넣음.
- 추론: 이 문구는 무늬 발생을 부추기는 부작용이 있지만 **그림책 손그림 스타일의 뼈대**다. 유지 확정. 무늬 억제는 네거티브 쪽에서 해결할 것.

### 4. 네거티브 재배열 — 죽어 있던 무늬 밀도 억제 블록을 맨 앞으로
- 바꾼 것: `repeated motifs, dense ornament, crowded border, clusters, all-over pattern, wallpaper, filled border, oversized motif`를 네거티브 맨 앞으로 이동. 자리 확보를 위해 겹말 압축(`photographic detail`, `material rendering`, `volumetric shading`, `realistic scene` 등 제거).
- 결과: 무늬 과다·산만함이 처음으로 확실히 개선됨.
- 추론: **네거티브도 똑같이 77토큰 한계를 받는다.** 이 억제 블록은 그동안 한계 밖에 있어서 완전히 죽어 있었다. "무늬가 많다"는 문제의 진짜 원인은 표현이 약해서가 아니라 **방어선이 아예 전달되지 않아서**였다.

### 5. 흰 말(동물 형상) 출현 → `animal, character, mascot`을 네거티브 맨 앞으로
- 결과: 정체불명의 큰 동물 형상이 사라짐.
- 추론: 난해한 큰 무늬의 정체는 동물/캐릭터화였다. 이 금지어들도 절단 구간에서 죽어 있었다. **"난해한 무늬"가 나오면 어떤 금지어가 죽어 있는지부터 확인할 것.**

### 6. `tiny` 무늬 → 정체불명의 점으로 뭉개짐 → `small distinct`로 교체
- 결과: `a few tiny simple stars and hearts`에서 무늬가 "이게 무슨 무늬지" 싶은 작은 점으로 나옴. `a few small distinct stars and hearts`로 바꾸자 형태가 살아남.
- 추론: 생성 해상도 448px에서 **`tiny`는 형태를 그릴 픽셀이 부족**해 얼룩/점이 된다 (과거 `dust-speck` 실패와 같은 원리). 크기 하한은 `small`. 형태 인식은 `distinct`가 담당.

### 7. 개수·다양성 미세 조정: `only one or two ... stars` → `a few ... stars and hearts`
- 결과: 너무 휑하고 단조롭던 것이 적당한 밀도·다양성으로.
- 추론: 개수는 `only one or two` < `a few` < `several` 순으로 계단식 조절이 가능하다. 종류는 2가지(별+하트)가 상한 — 4가지 나열은 실험 1의 실패로 회귀한다.

## 주요 키워드의 역할 (전달되는 것만)

### 긍정
- `flat 2D storybook illustration`: 평면 그림책 삽화 스타일의 앵커.
- `childlike hand-drawn symbols with solid color fills`: 손그림 느낌의 뼈대 (실험 3에서 필수 확인).
- `ultra-bright high-key pure white-ivory background` / `clean high-chroma palette`: 밝고 맑은 배경.
- `at least ninety percent bare and undecorated`: 여백 확보의 핵심.
- `dry wax-pastel texture contained inside each shape`: 질감을 도형 내부로 한정.
- `a few small distinct stars and hearts`: 무늬의 개수(`a few`)·크기(`small`)·형태 인식(`distinct`)·종류(`stars and hearts`)를 한 구절이 전담. **조정은 이 네 단어만 갈아끼운다.**
- `crisp sharply defined boundaries`: 경계 뭉개짐 방지. 오전까지는 잘려서 죽어 있다가 프롬프트 압축으로 창 안에 들어옴.
- `plenty of empty (space)`: 여백 재강조 + 절단 위치를 고정하는 완충재.

### 네거티브 (앞쪽 = 우선순위)
- `animal, character, mascot`: 동물·캐릭터 형상 금지 (실험 5).
- `repeated motifs ~ oversized motif`: 무늬 밀도·크기 억제 (실험 4).
- `photorealistic, photograph, 3D render, realistic texture, realistic lighting`: 실사 방지.
- `muddy colors ~ soft boundaries`: 탁한 색·번짐 방지.

## 이미지 검수와 후처리 (변경 없음)

- 전체 평균 밝기 `45` 미만 또는 바깥 테두리 평균 밝기 `55` 미만이면 재시도.
- 통과한 결과의 평균 밝기 `190` 미만이면 밝은 아이보리를 `screen` 합성.
- 보정 후 `saturate(1.28) contrast(1.06)` 적용.
- 넓고 밝은 단색 여백은 정상 결과로 취급 (탈락시키지 않음).
- 네거티브의 `black filter, dark overlay, underexposed`가 잘려 있지만 이 검수·후처리가 어두운 결과를 대신 방어한다.

## 유지해야 할 구현 설정 (변경 없음)

- 세로 스트립 요청 폭: `448px`
- 기본 생성 `strength`: `1` / 참고 이미지 사용 시: `0.55`
- `guidance`: `8.0`
- 최대 재시도: `3회`

## 피해야 할 것 (실패 목록, 누적)

- `Korean photo booth`: 실제 포토부스 사진 유도.
- 긍정 프롬프트의 반복적 `crayon`: 크레용 막대 자체를 그림.
- `simple geometric shapes` 과다 강조: 무늬가 딱딱해짐.
- `tiny`, `dust-speck`, `hairline` 급의 크기 축소: 448px에서 형태가 점/얼룩으로 뭉개짐 (실험 6). **크기 하한은 `small`.**
- 무늬 종류 3가지 이상 나열: 산만한 다양성 (실험 1). **상한 2가지.**
- 중요한 지시를 프롬프트 뒤쪽에 배치: 75토큰 밖은 존재하지 않는 것과 같다 (실험 4, 5).
- 절단 지점 확인 없이 프롬프트 길이 변경: 줄이는 것조차 결과를 망칠 수 있다 (실험 2, orphan `saturated` 사건).
- 색 변화가 적다고 실패 처리: 의도된 넓은 단색 여백까지 탈락시킴.

## 수정 원칙

1. **모든 수정 전에 절단 지점을 측정한다** (위 node 스크립트). 수정 후에도 다시 측정한다.
2. 중요한 지시는 앞쪽 75토큰 안에. 네거티브도 동일.
3. 무늬 조정은 `a few small distinct stars and hearts` 구절의 네 슬롯(개수/크기/형태/종류)만 교체한다. 같은 단어 수로 교체하면 절단 지점이 안 움직여서 안전하다.
4. 죽은 꼬리(색 목록 등)는 패딩이다. 지우려면 절단 지점 이동을 먼저 계산할 것.
5. 한 번에 한 변수만 바꾼다. 시드가 매번 랜덤이라 결과 차이가 수정 때문인지 운인지 구분하려면 2~3회 생성으로 경향을 봐야 한다.
6. 화면 프롬프트는 페이지 로드 시에만 입력창에 채워진다. **수정 후 반드시 하드 새로고침(Cmd+Shift+R)** — 안 하면 옛 프롬프트로 계속 생성된다.

## 남은 개선 후보 (미적용)

- 시드 고정 기능 (코드 변경 필요): 같은 프롬프트로 A/B 비교가 가능해져 수정 효과와 시드 운을 분리할 수 있다.
- 코드가 뒤에 붙이는 문구들(스트립/그리드 개수 지시)은 현재 전부 죽어 있다. 정리하거나 앞쪽 주입으로 바꾸는 리팩토링 여지가 있으나, 현재 결과가 만족스러우므로 건드리지 않는다.

## 구현 위치

현재 설정은 `4cut_demo/index.html`에 있다.

- 화면 기본 프롬프트: `promptInput` (line 249), `negativePromptInput` (line 252)
- 내부 프롬프트 조합: `generateFrame()` (line 1155 부근)
- 어두운 결과 판정: `getGeneratedImageIssue()`
- 밝기·채도 후처리: `removeDarkCast()`
