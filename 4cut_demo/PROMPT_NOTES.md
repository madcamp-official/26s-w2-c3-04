# AI 프레임 프롬프트 기준점

기록일: 2026-07-13 (2026-07-11 기준점을 대체)

이 문서는 현재 만족스러운 결과를 만든 프롬프트와 관련 설정을 보존한다. 이후 프롬프트를 수정할 때는 문구를 계속 덧붙이기보다, 아래 핵심 조건을 유지하면서 중복 표현을 교체한다.

## 현재 목표

- 순백색에 가까운 밝은 아이보리 배경
- 전체 면적의 대부분이 비어 있는 포토 프레임
- 무늬는 한 종류(작은 별), 스트립 전체에 1~2개 수준
- 실사가 아닌 평면 그림책 삽화 스타일
- 파스텔 질감은 도형 내부에만 적용하고 경계는 또렷하게 유지
- 크레용이나 연필 같은 미술도구 자체는 그리지 않음

## 화면에 보이는 긍정 프롬프트

```text
flat 2D storybook illustration, childlike hand-drawn symbols with solid color fills, ultra-bright high-key pure white-ivory background, clean high-chroma palette, at least ninety percent bare and undecorated, dry wax-pastel texture contained inside each shape, only one or two tiny isolated motifs of a single kind, a small star, crisp sharply defined boundaries, saturated red, yellow, green, sky blue, pink and orange
```

## 화면에 보이는 네거티브 프롬프트

```text
photorealistic, photograph, photographic detail, realistic texture, realistic lighting, material rendering, volumetric shading, 3D render, realistic scene, muddy colors, dull colors, desaturated, gray haze, blotches, stains, smudges, blur, fuzzy edges, color bleeding, soft boundaries, black filter, dark overlay, underexposed, all-over pattern, wallpaper, filled border, repeated motifs, dense ornament, crowded border, clusters, oversized motif, person, character, mascot, animal, face, crayon stick, pencil, marker, art supplies, text, watermark
```

## 내부에서 자동으로 추가되는 문구

스타일 표현이 사용자 프롬프트에 없으면 다음 문구를 앞에 추가한다.

```text
flat 2D storybook illustration, childlike hand-drawn symbols, solid color fills
```

세로 스트립 모드:

```text
only one or two tiny isolated motifs across the entire strip, vast bare background
mostly plain border with isolated doodles
```

2×2 그리드 모드:

```text
only one tiny isolated motif per frame cell, vast bare background
```

참고 이미지를 업로드한 경우:

```text
matching the reference image colors and composition
```

## ⚠️ CLIP 토큰 한계와 실제 전달 범위 (2026-07-13 실측)

SD1.5의 CLIP 텍스트 인코더는 약 77토큰(콘텐츠 기준 약 75토큰)에서 그냥 잘린다. 청킹이 없어서 한계를 넘는 뒷부분은 **모델에 아예 전달되지 않는다.** 현재 프롬프트는 이 한계를 넘고, 실측한 절단 지점은 다음과 같다.

### 긍정 프롬프트 — `a small star` 뒤에서 잘림

모델이 실제로 보는 것:

```text
flat 2D storybook illustration, ... only one or two tiny isolated motifs of a single kind, a small star
```

모델이 못 보는 것 (화면 프롬프트 뒷부분 + 코드가 붙이는 문구 전부):

```text
crisp sharply defined boundaries, saturated red, yellow, green, sky blue, pink and orange
+ only one or two tiny isolated motifs across the entire strip, vast bare background
+ mostly plain border with isolated doodles
```

**중요:** 색 목록 등 뒷부분은 죽은 텍스트지만 **패딩으로서 기능한다.** 이 꼬리 덕분에 절단이 `a small star` 뒤의 깔끔한 위치에서 일어난다. 실제로 꼬리를 지우자 절단 경계가 뒤로 밀리며 `saturated`가 색 이름 없이 홀로 전달됐고("a single" 실험), 결과가 눈에 띄게 요란해졌다. **꼬리를 지우거나 줄일 때는 절단 지점이 어디로 이동하는지 반드시 함께 확인할 것.**

### 네거티브 프롬프트 — `all-over` 부근에서 잘림

모델이 실제로 보는 것: `photorealistic ... underexposed, all-over` 까지 (실사 방지 + 색·번짐 방지 블록).

모델이 못 보는 것:

```text
pattern, wallpaper, filled border, repeated motifs, dense ornament, crowded border,
clusters, oversized motif, person, character, mascot, animal, face,
crayon stick, pencil, marker, art supplies, text, watermark
+ 코드가 붙이는 구조 금지어 (empty canvas, rectangular openings, grid lines 등)
```

즉 **무늬 밀도 억제 블록(all-over pattern ~ oversized motif)과 인물/미술도구/텍스트 금지 블록은 현재 전혀 작동하지 않는다.** 무늬가 여전히 많거나 다양하게 나온다면 첫 번째 용의자는 이것이다.

### 절단 지점 측정 방법

`node`로 대략 추정한다 (단어 수 × 1.25 + 쉼표 수, 실제보다 약간 크게 잡는 보수적 추정):

```bash
node -e 'const t="측정할 프롬프트"; const ws=t.split(/\s+/);
let tok=0,ci=ws.length;
for(let i=0;i<ws.length;i++){tok+=(ws[i].includes("-")?2:1)*1.25+(ws[i].includes(",")?1:0);if(tok>75){ci=i;break;}}
console.log("보임:",ws.slice(0,ci).join(" "));console.log("잘림:",ws.slice(ci).join(" "))'
```

## 주요 키워드의 역할 (실제 전달되는 것만)

### 스타일
- `flat 2D storybook illustration`: 실사나 3D 렌더 대신 평면 그림책 삽화로 유도한다.
- `childlike hand-drawn symbols`: 단순한 손그림 심볼을 만든다. 무늬 발생을 부추기는 면도 있으나, 이 문구를 뺐을 때 스타일이 망가져서 유지하기로 결정 (2026-07-13).
- `solid color fills`: 도형 내부를 단순한 면으로 유지한다.
- `dry wax-pastel texture contained inside each shape`: 질감만 도형 내부에 적용한다.

### 밝기
- `ultra-bright high-key pure white-ivory background`: 어두운 배경을 피한다.
- `clean high-chroma palette`: 탁하지 않은 색을 유도한다.

### 여백과 무늬
- `at least ninety percent bare and undecorated`: 배경이 무늬로 덮이지 않게 한다.
- `only one or two tiny isolated motifs of a single kind, a small star`: 무늬를 한 종류(별) 1~2개로 제한한다. **이 문구가 절단 한계 안에 있는 것이 이 버전의 핵심이다.**

### 네거티브 (전달되는 앞부분)
- `photorealistic ~ realistic scene`: 실사풍을 막는다.
- `muddy ~ underexposed`: 탁한 색, 번짐, 어두운 필터를 막는다.

## 이미지 검수와 후처리 (변경 없음)

- 전체 평균 밝기가 `45` 미만이거나 바깥 테두리 평균 밝기가 `55` 미만이면 지나치게 어두운 결과로 판단해 재시도한다.
- 검정 이미지 판정을 통과한 결과의 평균 밝기가 `190` 미만이면 밝은 아이보리색을 `screen` 방식으로 합성한다.
- 밝기 보정 후 `saturate(1.28) contrast(1.06)`을 적용해 채도와 경계를 복원한다.
- 단색에 가깝다는 이유만으로 탈락시키지 않는다. 넓고 밝은 단색 여백은 의도에 맞는 정상 결과다.

## 유지해야 할 구현 설정 (변경 없음)

- 세로 스트립 요청 폭: `448px`
- 기본 생성 `strength`: `1`
- 참고 이미지 사용 시 `strength`: `0.55`
- `guidance`: `8.0`
- 최대 재시도: `3회`

## 피해야 할 과거 표현

- `Korean photo booth`: 실제 포토부스 사진을 유도할 수 있었다.
- 긍정 프롬프트의 반복적인 `crayon` 표현: 크레용 막대 자체를 그리게 했다.
- `simple geometric shapes`의 과도한 강조: 무늬가 지나치게 딱딱해졌다.
- `dust-speck`, `hairline`, `0.5% 미만`: 흐릿한 얼룩으로 변했다.
- 무늬 개수를 사진 구역마다 강제: 전체가 과도하게 장식됐다.
- **긴 프롬프트 끝에 중요한 지시 배치: 75토큰 한계 밖이라 모델이 아예 못 본다. 코드가 뒤에 붙이는 개수 문구도 마찬가지로 현재 전달되지 않는다 (2026-07-13 실측).**
- **프롬프트 꼬리를 무심코 삭제: 절단 경계가 이동해 `saturated` 같은 단어가 목적어 없이 홀로 전달되며 결과가 요란해졌다 ("a single" 실험, 2026-07-13).**
- 무늬 종류 나열 (`simple star, outline heart, small spiral or short line`): 4종류를 나열하니 다양하고 산만한 무늬가 나왔다. 한 종류(`a small star`)로 줄인 것이 현재 버전.
- 색 변화가 적은 이미지를 실패 처리: 의도한 넓은 단색 여백까지 잘못 탈락시켰다.

## 수정 원칙

1. **중요한 지시(무늬 개수·종류, 여백)는 앞쪽 75토큰 안에 배치한다.** 뒤에 덧붙이는 것은 효과가 없다.
2. 프롬프트 길이를 바꾸면(줄여도!) 절단 지점이 이동한다. 수정 후 반드시 위 측정 방법으로 절단 지점을 확인한다.
3. 새 조건을 추가할 때는 동의어나 중복 문구를 먼저 제거한다.
4. 무늬의 개수와 크기만 바꾸려면 `only one or two tiny isolated motifs of a single kind, a small star` 부분만 수정한다.
5. 네거티브 프롬프트도 같은 75토큰 한계를 받는다. 무늬 밀도 억제어를 살리려면 네거티브 앞쪽으로 옮겨야 한다 (아직 미적용, 아래 참고).
6. 화면 프롬프트뿐 아니라 내부 자동 문구와 후처리 설정도 함께 검토한다.

## 다음 개선 후보 (2026-07-13, 미적용)

무늬가 여전히 많거나 다양할 때 시도할 것:

1. **네거티브 재배열 (최우선, 텍스트만):** 무늬 밀도 억제 블록(`all-over pattern, wallpaper, filled border, repeated motifs, dense ornament, crowded border, clusters, oversized motif`)을 네거티브 프롬프트 맨 앞으로 이동. 현재는 75토큰 밖이라 완전히 죽어 있다. 대신 뒤로 밀려나는 색·번짐 방지어 일부가 잘리게 되므로 트레이드오프 확인 필요.
2. 긍정 프롬프트의 `of a single kind` 강조를 `exactly one kind of motif` 같은 더 단정적인 표현으로 교체.
3. 시드 고정 기능 추가(코드 변경 필요): 같은 프롬프트로 A/B 비교가 가능해져 변경 효과를 랜덤과 구분할 수 있다.

## 구현 위치

현재 설정은 `4cut_demo/index.html`에 있다.

- 화면 기본 프롬프트: `promptInput`, `negativePromptInput` (line 249, 252 부근)
- 내부 프롬프트 조합: `generateFrame()` (line 1155 부근)
- 어두운 결과 판정: `getGeneratedImageIssue()`
- 밝기·채도 후처리: `removeDarkCast()`
