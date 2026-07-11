# AI 프레임 프롬프트 기준점

기록일: 2026-07-11

이 문서는 현재 만족스러운 결과를 만든 프롬프트와 관련 설정을 보존한다. 이후 프롬프트를 수정할 때는 문구를 계속 덧붙이기보다, 아래 핵심 조건을 유지하면서 중복 표현을 교체한다.

## 현재 목표

- 순백색에 가까운 밝은 아이보리 배경
- 전체 면적의 대부분이 비어 있는 포토 프레임
- 작고 고립된 무늬만 제한적으로 배치
- 실사가 아닌 평면 그림책 삽화 스타일
- 선명하고 채도 높은 빨강, 노랑, 초록, 하늘색, 분홍, 주황
- 파스텔 질감은 도형 내부에만 적용하고 경계는 또렷하게 유지
- 크레용이나 연필 같은 미술도구 자체는 그리지 않음

## 화면에 보이는 긍정 프롬프트

```text
flat 2D storybook illustration, childlike hand-drawn symbols with solid color fills, ultra-bright high-key pure white-ivory background, clean high-chroma palette, at least ninety percent bare and undecorated, dry wax-pastel texture contained inside each shape, very few tiny isolated motifs, simple star, outline heart, small spiral or short line, crisp sharply defined boundaries, saturated red, yellow, green, sky blue, pink and orange
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
only five or six tiny isolated motifs across the entire strip, vast bare background
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

## 주요 키워드의 역할

### 스타일

- `flat 2D storybook illustration`: 실사나 3D 렌더 대신 평면 그림책 삽화로 유도한다.
- `childlike hand-drawn symbols`: 복잡한 작품이나 사실적 사물이 아닌 단순한 손그림 심볼을 만든다.
- `solid color fills`: 도형 내부를 단순한 면으로 유지해 얼룩이나 사진 질감을 줄인다.
- `dry wax-pastel texture contained inside each shape`: 미술도구 자체가 아니라 마른 왁스 파스텔의 질감만 도형 내부에 적용한다.

### 밝기와 색감

- `ultra-bright high-key pure white-ivory background`: 검은 필터가 씌워진 듯한 어두운 배경을 피한다.
- `clean high-chroma palette`: 탁하지 않고 채도가 높은 색을 유도한다.
- `saturated red, yellow, green, sky blue, pink and orange`: 사용할 색을 구체적으로 고정한다.

### 여백과 무늬 밀도

- `at least ninety percent bare and undecorated`: 배경이 무늬로 덮이지 않도록 한다.
- `very few tiny isolated motifs`: 무늬가 군집이나 반복 패턴으로 변하는 것을 줄인다.
- 세로 스트립 전체 `five or six`개: 각 사진 구역을 억지로 모두 장식하지 않고 전체 밀도를 제어한다.
- `vast bare background`: 포토 프레임에서 사진과 여백이 주인공이라는 점을 재강조한다.

### 경계와 선명도

- `crisp sharply defined boundaries`: 도형이 얼룩처럼 번지는 것을 방지한다.
- 네거티브의 `blotches`, `smudges`, `blur`, `fuzzy edges`, `color bleeding`, `soft boundaries`: 번짐과 흐릿한 경계를 억제한다.

### 실사 및 미술도구 방지

- `photorealistic`, `photographic detail`, `realistic texture`, `realistic lighting`, `material rendering`, `volumetric shading`: 실사풍과 입체 재질 묘사를 막는다.
- `crayon stick`, `pencil`, `marker`, `art supplies`: 파스텔 질감을 요청했을 때 크레용이나 연필 자체가 그려지는 것을 막는다.
- `person`, `character`, `mascot`, `animal`, `face`: 복잡한 캐릭터 삽화로 발전하는 것을 막는다.

## 이미지 검수와 후처리

- 전체 평균 밝기가 `45` 미만이거나 바깥 테두리 평균 밝기가 `55` 미만이면 지나치게 어두운 결과로 판단해 재시도한다.
- 검정 이미지 판정을 통과한 결과의 평균 밝기가 `190` 미만이면 밝은 아이보리색을 `screen` 방식으로 합성한다.
- 밝기 보정 후 `saturate(1.28) contrast(1.06)`을 적용해 채도와 경계를 복원한다.
- 단색에 가깝다는 이유만으로 탈락시키지 않는다. 넓고 밝은 단색 여백은 현재 의도에 맞는 정상 결과다.

## 유지해야 할 구현 설정

- 세로 스트립 요청 폭: `448px`
- 기본 생성 `strength`: `1`
- 참고 이미지 사용 시 `strength`: `0.55`
- `guidance`: `8.0`
- 최대 재시도: `3회`

## 피해야 할 과거 표현

- `Korean photo booth`: 실제 포토부스 사진을 유도할 수 있었다.
- 긍정 프롬프트의 반복적인 `crayon` 표현: 크레용 질감이 아니라 크레용 막대 자체를 그리게 했다.
- `simple geometric shapes`의 과도한 강조: 무늬가 지나치게 딱딱하고 기하학적으로 변했다.
- `dust-speck`, `hairline`, `0.5% 미만`: 현재 생성 해상도에서 형태가 줄어드는 대신 흐릿한 얼룩으로 변했다.
- 무늬 개수를 사진 구역마다 강제: 전체 스트립이 과도하게 장식되는 결과를 만들었다.
- 긴 프롬프트 끝에 실사 방지 문구 배치: CLIP 토큰 한계로 중요한 금지 조건이 잘릴 수 있었다.
- 색 변화가 적은 이미지를 실패 처리: 의도한 넓은 단색 여백까지 잘못 탈락시켰다.

## 수정 원칙

1. 긍정 프롬프트의 스타일, 밝기, 여백, 무늬, 경계 순서를 유지한다.
2. 실사 방지 키워드는 네거티브 프롬프트 앞부분에 둔다.
3. 새 조건을 추가할 때는 동의어나 중복 문구를 먼저 제거한다.
4. 무늬의 개수와 크기만 바꾸려면 내부 개수 문구만 수정한다.
5. 색감만 바꾸려면 밝기·팔레트 문구만 수정하고 생성 강도나 검수 로직은 건드리지 않는다.
6. 화면 프롬프트뿐 아니라 내부 자동 문구와 후처리 설정도 함께 검토한다.

## 구현 위치

현재 설정은 `4cut_demo/index.html`에 있다.

- 화면 기본 프롬프트: `promptInput`, `negativePromptInput`
- 내부 프롬프트 조합: `generateFrame()`
- 어두운 결과 판정: `getGeneratedImageIssue()`
- 밝기·채도 후처리: `removeDarkCast()`

