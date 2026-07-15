// 손동작 인식 로직 — univ_ver3.html의 검증된 판정 함수를 그대로 이식.
// MediaPipe HandLandmarker가 주는 landmark 배열(0~20번 관절)을 입력으로 받아
// 각 제스처를 만족하는지 boolean으로 판정한다. React/DOM에 의존하지 않는
// 순수 함수들이라 ShootingScreen뿐 아니라 다른 화면에서도 재사용 가능하다.

export interface Point {
  x: number;
  y: number;
  z?: number;
}

export type Landmarks = Point[];

export interface GestureDef {
  id: string;
  name: string;
  minHands: number;
}

export const GESTURES: GestureDef[] = [
  { id: 'v', name: '브이 ✌️', minHands: 1 },
  { id: 'thumbsup', name: '엄지척 👍', minHands: 1 },
  { id: 'tigerclaw', name: '어흥 🐯', minHands: 1 },
  { id: 'catears', name: '고양이 귀 🐱', minHands: 1 },
  { id: 'cheekheart', name: '볼하트 💕', minHands: 1 },
  { id: 'bigheart', name: '양손하트 🫶', minHands: 2 },
  { id: 'flower', name: '꽃받침 🌸', minHands: 1 },
  { id: 'mouthpose', name: '숭이포즈 ☝️', minHands: 1 },
  { id: 'yahoo', name: '야호포즈 🙌', minHands: 1 },
  { id: 'palmpose', name: '놀라는 포즈 🖐️', minHands: 1 },
  { id: 'rocknroll', name: '락앤롤 포즈 🤟', minHands: 1 },
];

export const GUIDE_CAPTION: Record<string, string> = {
  v: '검지·중지를 펴서 브이 모양',
  thumbsup: '엄지만 세우고 나머지 손가락은 접기',
  tigerclaw: '손바닥이 보이게 들고, 손톱이 보일 정도로만 손가락을 살짝 구부리기',
  catears: '손목을 머리 위로 들고 손등이 보이게, 검지·중지를 벌려 손톱이 머리에 닿도록 굽히기 (한 손 OK)',
  cheekheart: '엄지는 아래로, 나머지 네 손가락은 살짝 구부려 반원 모양으로 볼(입 높이 또는 그 위)에 대기 (한 손 OK)',
  bigheart: '양손을 둥글게 구부려 검지 끝은 위에서, 엄지 끝은 아래에서 맞닿게 하트 만들기',
  flower: '손가락을 붙여 펴고 턱 밑에 대기 (한 손 OK)',
  mouthpose: '검지손가락을 입꼬리 끝에 대기 (살짝 깨무는 느낌도 OK)',
  yahoo: '브이를 뒤집어서 손톱이 바닥을 향하게',
  palmpose: '손등이 보이게, 손가락을 사이사이 틈이 보이도록 쫙 펼치기 (한 손 OK)',
  rocknroll: '엄지·검지·새끼손가락은 펴고, 중지·약지는 완전히 접기',
};

// ---------- 기하 헬퍼 ----------
function dist(a: Point, b: Point) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}
function isFingerExtended(lm: Landmarks, tipIdx: number, pipIdx: number) {
  return lm[pipIdx].y - lm[tipIdx].y > 0.02;
}
function isFingerCurled(lm: Landmarks, tipIdx: number, pipIdx: number) {
  return !isFingerExtended(lm, tipIdx, pipIdx);
}
function wristDist(lm: Landmarks, idx: number) {
  return dist(lm[idx], lm[0]);
}
function isFingerFolded(lm: Landmarks, tipIdx: number, mcpIdx: number) {
  return wristDist(lm, tipIdx) < wristDist(lm, mcpIdx) * 1.35;
}
function fingerBendAngle(lm: Landmarks, mcpIdx: number, pipIdx: number, tipIdx: number) {
  const v1 = { x: lm[mcpIdx].x - lm[pipIdx].x, y: lm[mcpIdx].y - lm[pipIdx].y };
  const v2 = { x: lm[tipIdx].x - lm[pipIdx].x, y: lm[tipIdx].y - lm[pipIdx].y };
  const m1 = Math.hypot(v1.x, v1.y);
  const m2 = Math.hypot(v2.x, v2.y);
  const cosA = (v1.x * v2.x + v1.y * v2.y) / (m1 * m2 || 1);
  return (Math.acos(Math.min(1, Math.max(-1, cosA))) * 180) / Math.PI;
}
function curlRatio(lm: Landmarks, tipIdx: number, mcpIdx: number) {
  return wristDist(lm, tipIdx) / (wristDist(lm, mcpIdx) || 1);
}

// 손등/손바닥 방향 판정 (실측 결과 반전이 필요해서 FLIP=true로 둠 — 원본과 동일)
const FLIP_HAND_ORIENTATION = true;
function isBackOfHandFacing(lm: Landmarks, handednessLabel?: string) {
  const wrist = lm[0], idx = lm[5], pinky = lm[17];
  const v1x = idx.x - wrist.x, v1y = idx.y - wrist.y;
  const v2x = pinky.x - wrist.x, v2y = pinky.y - wrist.y;
  const crossZ = v1x * v2y - v1y * v2x;
  let backFacing = handednessLabel === 'Right' ? crossZ < 0 : crossZ > 0;
  if (FLIP_HAND_ORIENTATION) backFacing = !backFacing;
  return backFacing;
}

// ---------- 한 손 컴포넌트 ----------
function vComponent(lm: Landmarks) {
  const indexExt = isFingerExtended(lm, 8, 6);
  const middleExt = isFingerExtended(lm, 12, 10);
  const ringCurl = isFingerCurled(lm, 16, 14);
  const pinkyCurl = isFingerCurled(lm, 20, 18);
  return indexExt && middleExt && ringCurl && pinkyCurl;
}

function thumbsUpComponent(lm: Landmarks) {
  const indexCurl = isFingerCurled(lm, 8, 6);
  const middleCurl = isFingerCurled(lm, 12, 10);
  const ringCurl = isFingerCurled(lm, 16, 14);
  const pinkyCurl = isFingerCurled(lm, 20, 18);
  const thumbUp = lm[4].y < lm[2].y - 0.03;
  return indexCurl && middleCurl && ringCurl && pinkyCurl && thumbUp;
}

function tigerClawComponent(lm: Landmarks) {
  const fingers: [number, number][] = [[8, 5], [12, 9], [16, 13], [20, 17]];
  return fingers.every(([tip, mcp]) => {
    const dTip = wristDist(lm, tip);
    const dMcp = wristDist(lm, mcp);
    return dTip > dMcp * 0.75 && dTip < dMcp * 1.5;
  });
}

function catEarsComponent(lm: Landmarks) {
  const indexStraight = fingerBendAngle(lm, 5, 6, 8) > 140;
  const middleStraight = fingerBendAngle(lm, 9, 10, 12) > 140;
  if (!indexStraight || !middleStraight) return false;

  const ringCurl = fingerBendAngle(lm, 13, 14, 16) < 140;
  const pinkyCurl = fingerBendAngle(lm, 17, 18, 20) < 140;
  const wristAboveFingers = lm[0].y < lm[8].y && lm[0].y < lm[12].y;

  const v1 = { x: lm[8].x - lm[0].x, y: lm[8].y - lm[0].y };
  const v2 = { x: lm[12].x - lm[0].x, y: lm[12].y - lm[0].y };
  const mag1 = Math.hypot(v1.x, v1.y), mag2 = Math.hypot(v2.x, v2.y);
  const cosA = (v1.x * v2.x + v1.y * v2.y) / (mag1 * mag2 || 1);
  const angleDeg = (Math.acos(Math.min(1, Math.max(-1, cosA))) * 180) / Math.PI;
  const angleOk = angleDeg > 10;

  const nearHead = lm[8].y < 0.6 && lm[12].y < 0.6;

  return ringCurl && pinkyCurl && indexStraight && middleStraight && wristAboveFingers && angleOk && nearHead;
}

function cheekHeartComponent(lm: Landmarks) {
  const handScale = wristDist(lm, 9) || 0.001;
  const middleFolded = isFingerFolded(lm, 12, 9);
  const ringFolded = isFingerFolded(lm, 16, 13);
  const pinkyFolded = isFingerFolded(lm, 20, 17);
  const gapRatio = dist(lm[4], lm[8]) / handScale;
  const gapOk = gapRatio > 0.15 && gapRatio < 1.5;
  const upperArea = lm[8].y < 0.8;
  return middleFolded && ringFolded && pinkyFolded && gapOk && upperArea;
}

function flowerComponent(lm: Landmarks) {
  const allExt = ([[8, 6], [12, 10], [16, 14], [20, 18]] as [number, number][]).every(([t, p]) =>
    isFingerExtended(lm, t, p)
  );
  const closeGaps = dist(lm[8], lm[12]) < 0.06 && dist(lm[12], lm[16]) < 0.06 && dist(lm[16], lm[20]) < 0.06;
  const nearFace = lm[0].y > 0.25 && lm[0].y < 0.75;
  return allExt && closeGaps && nearFace;
}

function mouthPoseComponent(lm: Landmarks) {
  const middleCurl = curlRatio(lm, 12, 9) < 1.1;
  const ringCurl = curlRatio(lm, 16, 13) < 1.1;
  const pinkyCurl = curlRatio(lm, 20, 17) < 1.1;
  const indexNearMouth = lm[8].y > 0.3 && lm[8].y < 0.78;
  return middleCurl && ringCurl && pinkyCurl && indexNearMouth;
}

function yahooComponent(lm: Landmarks) {
  const indexExtended = curlRatio(lm, 8, 5) > 1.15;
  const middleExtended = curlRatio(lm, 12, 9) > 1.15;
  const pointingDown = lm[8].y - lm[5].y > 0.03 && lm[12].y - lm[9].y > 0.03;
  const ringCurl = curlRatio(lm, 16, 13) < 1.05;
  const pinkyCurl = curlRatio(lm, 20, 17) < 1.05;
  return indexExtended && middleExtended && pointingDown && ringCurl && pinkyCurl;
}

function palmPoseHandComponent(lm: Landmarks, handedness?: string) {
  const fourExtended = ([[8, 5], [12, 9], [16, 13], [20, 17]] as [number, number][]).every(
    ([tip, mcp]) => curlRatio(lm, tip, mcp) > 1.15
  );
  const thumbExtended = curlRatio(lm, 4, 2) > 1.15;
  const palmWidth = dist(lm[5], lm[17]) || 1;
  const gaps = [dist(lm[4], lm[8]), dist(lm[8], lm[12]), dist(lm[12], lm[16]), dist(lm[16], lm[20])];
  const spread = gaps.every((g) => g / palmWidth > 0.35);
  const backFacing = isBackOfHandFacing(lm, handedness);
  return fourExtended && thumbExtended && spread && backFacing;
}

function rockAndRollComponent(lm: Landmarks) {
  const indexExtended = curlRatio(lm, 8, 5) > 1.15;
  const pinkyExtended = curlRatio(lm, 20, 17) > 1.15;
  const thumbExtended = curlRatio(lm, 4, 2) > 1.15;
  const middleCurl = curlRatio(lm, 12, 9) < 1.05;
  const ringCurl = curlRatio(lm, 16, 13) < 1.05;
  return indexExtended && pinkyExtended && thumbExtended && middleCurl && ringCurl;
}

const COMPONENTS: Record<string, (lm: Landmarks, handedness?: string) => boolean> = {
  v: vComponent,
  thumbsup: thumbsUpComponent,
  tigerclaw: tigerClawComponent,
  catears: catEarsComponent,
  cheekheart: cheekHeartComponent,
  flower: flowerComponent,
  mouthpose: mouthPoseComponent,
  yahoo: yahooComponent,
  palmpose: palmPoseHandComponent,
  rocknroll: rockAndRollComponent,
};

type Checker = (hands: Landmarks[], handednesses?: string[]) => boolean;

function makeChecker(gestureId: string, minHands: number): Checker {
  const component = COMPONENTS[gestureId];
  return (hands, handednesses) => {
    if (hands.length < minHands) return false;
    return hands.every((lm, i) => component(lm, handednesses?.[i]));
  };
}

// 양손하트: 손끼리의 관계를 봐야 해서 별도 처리
function bigHeartChecker(hands: Landmarks[]): boolean {
  if (hands.length !== 2) return false;
  const [a, b] = hands;
  const indexTipsClose = dist(a[8], b[8]) < 0.12;
  const thumbTipsClose = dist(a[4], b[4]) < 0.12;
  const orientedUp = a[8].y < a[4].y && b[8].y < b[4].y;
  return indexTipsClose && thumbTipsClose && orientedUp;
}

const SPECIAL_CHECKERS: Record<string, Checker> = {
  bigheart: bigHeartChecker,
};

export const CHECKERS: Record<string, Checker> = {};
GESTURES.forEach((g) => {
  CHECKERS[g.id] = SPECIAL_CHECKERS[g.id] || makeChecker(g.id, g.minHands);
});

export function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export interface ShotDef extends GestureDef {
  round: 1 | 2;
}

// 8장(4동작 x 2회) 랜덤 시퀀스 생성
export function buildShotSequence(): ShotDef[] {
  const chosen = shuffle(GESTURES).slice(0, 4);
  const sequence: ShotDef[] = [];
  chosen.forEach((g) => {
    sequence.push({ ...g, round: 1 });
    sequence.push({ ...g, round: 2 });
  });
  return sequence;
}
