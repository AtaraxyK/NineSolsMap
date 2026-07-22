type LocalizableMarker = { type: string; description: string };

export const CHECKABLE_TYPES = new Set([
  "artifact",
  "chest",
  "collectible",
  "cpu",
  "data",
  "darksteel",
  "fruit",
  "herb",
  "jade",
  "keyitem",
  "poison",
  "vial",
]);

const VIEW_ONLY_TYPES = new Set([
  "boss",
  "chiyou",
  "hack",
  "miniboss",
  "robot",
  "root",
  "shanhai",
]);

const ARTIFACT_NAMES: Record<string, string> = {
  "Tiandao Academy Periodical": "천도 연구원 정기간행물",
  "Antique Vinyl Record": "골동품 음반",
  "Ready-to-eat Rations": "즉석 식량",
  "Virtual Reality Device": "가상 현실 장치",
  "The Four Treasures of the Study": "문방사우",
  "Penglai Recipe Collection": "봉래 요리법 모음",
  "Kunlun Immortal Portrait": "곤륜 선인 초상화",
  "Red Guifang Clay": "붉은 귀방 점토",
  "Multi-tool Kit": "다용도 공구 세트",
  "Unknown Seed": "정체불명의 씨앗",
  "Sword of Jie": "절씨 가문의 검",
  "Qiankun Board": "건곤기판",
  "Fusang Amulet": "부상 부적",
  Fertilizer: "비료",
};

const JADE_NAMES: Record<string, string> = {
  "Mob Quell Jade - Yin": "군주옥·음",
  "Swift Blade Jade": "신속 칼날옥",
  "Swift Descent Jade": "신속 하강옥",
  "Soul Reaper Jade": "영혼 수확옥",
  "Cultivation Jade": "수련옥",
  "Immovable Jade": "부동옥",
  "Bearing Jade": "차력옥",
  "Qi Swipe Jade": "기격옥",
  "Avarice Jade": "탐욕옥",
  "Breather Jade": "조식옥",
  "Divine Hand Jade": "신수옥",
  "Qi Blade Jade": "검기옥",
  "Stasis Jade": "정신옥",
  "Hedgehog Jade": "고슴도치옥",
  "Pauper Jade": "빈자옥",
  "Steely Jade": "무외옥",
  "Focus Jade": "폭검옥",
};

const KEY_ITEM_NAMES: Record<string, string> = {
  "Bloody Crimson Hibiscus": "핏빛 진홍 부상화",
  "Elevator Access Token": "승강기 출입 토큰",
  "Yellow Dragonsnake Venom Sac": "황룡사 독주머니",
  "Gene Eradicator": "유전자 제거제",
  "Rhizomatic Bomb": "근맥 폭탄",
  "Soul-severing Blade": "단혼도",
  "Thunderburst Bomb": "뇌폭탄",
  "Firestorm Ring": "화염폭풍 고리",
  "Tianhuo Serum": "천화 혈청",
  "Homing Darts": "유도 비도",
  "Ji's Hair": "희의 머리카락",
};

const POISON_NAMES: Record<string, string> = {
  "Plantago Frog poison": "질경이 개구리 독물",
  "Residual Hair poison": "잔모 독물",
  "Golden Yinglong Egg": "응룡의 황금알",
  "Oriander poison": "협죽도 독물",
  "Medicinal Citrine poison": "약용 황수정 독물",
  "Molted Tianma Hide poison": "천마 허물 독물",
  "Turtle Scorpion poison": "거북전갈 독물",
  "Porcine Gem poison": "돼지 보석 독물",
};

const BOSS_NAMES: Record<string, string> = {
  "Fuxi & Nuwa boss fight": "복희·여와 보스전",
  "Goumang boss fight": "구망 보스전",
  "General Yingzhao boss fight": "영초 장군 보스전",
  "Ji boss fight": "희 보스전",
  "Lady Ethereal boss fight": "환선 보스전",
  "Jiequan boss fight": "절전 보스전",
  "Sky Rending Claw Yanlao boss fight": "열천조 엄로 보스전",
  "Kanghui boss fight": "강회 보스전",
};

const MINIBOSS_NAMES: Record<string, string> = {
  "Red Tiger Elite: Kuiyan": "적호 정예·규염",
  "Celestial Enforcer: Tieyan": "천도 집행관·철염",
  "Red Tiger Elite: Lieguan. Use the key card in the Abandoned Mines to return to the Peach Village": "적호 정예·열관",
  "Celestial Spectre: Shangui": "천도 유령·산귀",
  "Red Tiger Elite: Yanren": "적호 정예·염인",
  "Celestial Sentinel: Jiaoduan": "천도 파수꾼·교단",
  Chien: "건",
  "The Great Miner: Tiashou": "위대한 광부·천수",
  "Spirit Keeper: Cixing. Complete all 3 parry rooms throughout the Grotto to spawn this boss": "영령 수호자·자형 · 석굴의 방어실 3곳 완료",
  "Celestial Warden: Yinyue": "천도 간수·은월",
  "Red Tiger Elite: Baichang": "적호 정예·백장",
  "Celestial Spectre: Shuigui": "천도 유령·수귀",
};

const AREA_NAMES: Record<string, string> = {
  "Empyrean District Sanctum": "천인 구역 도관",
  "Empyrean District Passages": "천인 구역 통로",
  "Empyrean District Living Area": "천인 구역 거주지",
  "Empyrean District": "천인 구역",
  "Tiandao Research Center": "천도 연구소",
  "Tiandao Research": "천도 연구소",
  "Shengyu Hall": "생육당",
  "Research Lab": "연구실",
  "Apeman Facility Monitoring": "원인 시설 감시 구역",
  "Apeman Facility Depths": "원인 시설 심층부",
  "Apeman Facility Elevator": "원인 시설 승강기",
  "Water & Oxygen Synthesis": "물·산소 합성 구역",
  "Agrarian Hall": "농경당",
  "Yinglong Canal": "응룡 수로",
  "Galactic Dock": "은하 부두",
  Pavilion: "사계각",
  Greenhouse: "온실",
  "Central Transport Hub": "중앙 운송 허브",
  "Power Reservoir Central": "에너지 저장고 중앙",
  "Power Reservoir East": "에너지 저장고 동쪽",
  "Power Reservoir West": "에너지 저장고 서쪽",
  "Power Reservoir": "에너지 저장고",
  "Factory Production Area": "공장 생산 구역",
  Factory: "공장",
  "Lake Yaochi Ruins": "요지 호수 유적",
  "Grotto West": "도교 석굴 서쪽",
  "Grotto East": "도교 석굴 동쪽",
  "Grotto entry": "도교 석굴 입구",
  Grotto: "도교 석굴",
  Prison: "감옥",
  "Factory Underground": "공장 지하",
  "Abandoned Mines": "폐광",
  "Cortex Center": "피질 중추",
  "Boundless Repository": "무한 저장고",
  "Radiant Pagoda": "빛나는 탑",
  "Factory Great Hall": "공장 대전",
  "Factory Machine Room": "공장 기계실",
  "Inner Warehouse": "내부 창고",
  "Outer Warehouse": "외부 창고",
  Warehouse: "창고",
  "Sky Tower": "천공탑",
  Farmland: "농경지",
};

const translatedStart = (description: string, names: Record<string, string>, fallback: string) => {
  const match = Object.entries(names).find(([name]) => description.startsWith(name));
  return match?.[1] ?? fallback;
};

function itemHint(description: string) {
  if (description.startsWith("Hidden room with chests")) return "뿌리 노드가 있는 방 중앙 천장으로 이단 점프";
  if (/inside the tomb/i.test(description)) return "석굴의 방어실 3곳을 완료해 무덤 열기";
  if (/5 hackpoints/i.test(description)) return "이 지역의 해킹 지점 5곳 찾기";
  if (/walking chest/i.test(description)) return "움직이는 상자";
  if (/Defeat Lady Ethereal/i.test(description)) return "환선 처치";
  if (/Defeat Jiequan/i.test(description)) return "절전 처치";
  if (/Defeat the Fengs/i.test(description)) return "복희·여와 처치 후 돌연변이 파괴";
  if (/Defeat the boss/i.test(description)) return "보스 처치";
  if (/Defeat the miniboss|beat the miniboss|after the miniboss|dropped by the miniboss/i.test(description)) return "중간 보스 처치";
  if (/parry.*robots?|parrying the robots?/i.test(description)) return "주변 로봇의 공격을 튕겨내기";
  if (/giving Shuanshuan/i.test(description)) return "헌헌에게 씨앗과 비료 전달";
  if (/under the elevator/i.test(description)) return "승강기 아래 통로로 이동";
  if (/hit the bells.*2-5-1-4-3/i.test(description)) return "왼쪽부터 종을 2-5-1-4-3 순서로 타격";
  if (/hit the bells.*2-5-4-1-2/i.test(description)) return "왼쪽부터 종을 2-5-4-1-2 순서로 타격";
  if (/hidden hack point on the roof/i.test(description)) return "승강기에서 나온 뒤 지붕의 숨은 해킹 지점 사용";
  if (/hack point/i.test(description)) return "근처 해킹 지점 사용";
  if (/blue mutants/i.test(description)) return "문 근처의 푸른 돌연변이 처치";
  if (/Shennong's quest/i.test(description)) return "신농 퀘스트 진행";
  if (/boulder from above/i.test(description)) return "위층의 바위를 굴려 문 통과";
  if (/break the bookshelf/i.test(description)) return "책장 부수기";
  if (/break the pot/i.test(description)) return "사계각에서 항아리 부수기";
  if (/puzzle is solved/i.test(description)) return "퍼즐 해결 후 떨어지는 공 안쪽";
  if (/Factory Underground container transport/i.test(description)) return "공장 지하의 컨테이너 운송로 이용";
  return "";
}

function localizeItem(marker: LocalizableMarker) {
  const type = marker.type.trim().toLowerCase();
  const description = marker.description.trim();
  let name = "획득 아이템";

  if (type === "artifact") name = translatedStart(description, ARTIFACT_NAMES, "유물");
  if (type === "chest") name = description.startsWith("Hidden room") ? "숨겨진 금 상자 · 금 1,880" : "금 상자";
  if (type === "collectible") {
    if (description.startsWith("Noble Ring")) name = "귀족 반지";
    else if (description.startsWith("Advanced component")) name = description.includes("chest") ? "고급 부품 상자" : "고급 부품";
    else if (description.startsWith("Standard component")) name = description.includes("chest") ? "표준 부품 상자" : "표준 부품";
    else name = description.includes("chest") ? "기초 부품 상자" : "기초 부품";
  }
  if (type === "cpu") name = "계산 장치";
  if (type === "data") name = "데이터 기록";
  if (type === "darksteel") name = "현철";
  if (type === "fruit") {
    if (description.startsWith("Twin Tao Fruit")) name = "쌍둥이 도과";
    else if (description.startsWith("Greater Tao fruit")) name = "큰 도과";
    else name = "도과";
  }
  if (type === "herb") name = "약초 촉매";
  if (type === "jade") name = translatedStart(description, JADE_NAMES, "옥석");
  if (type === "keyitem") name = translatedStart(description, KEY_ITEM_NAMES, "핵심 아이템");
  if (type === "poison") name = translatedStart(description, POISON_NAMES, "독물");
  if (type === "vial") name = "약병";

  const hint = itemHint(description);
  return hint ? `${name} · ${hint}` : name;
}

function localizeArea(description: string) {
  const area = Object.entries(AREA_NAMES).find(([name]) => description.includes(name));
  return area?.[1] ?? "지역";
}

export function isCheckableType(type: string) {
  const normalizedType = type.trim().toLowerCase();
  return !VIEW_ONLY_TYPES.has(normalizedType) && CHECKABLE_TYPES.has(normalizedType);
}

export function localizedMarkerDescription(marker: LocalizableMarker) {
  const type = marker.type.trim().toLowerCase();
  const description = marker.description.trim();

  if (isCheckableType(type)) return localizeItem(marker);
  if (type === "boss") return BOSS_NAMES[description] ?? "보스전";
  if (type === "miniboss") return MINIBOSS_NAMES[description] ?? "중간 보스";
  if (type === "chiyou") return "치우 위치";
  if (type === "robot") return "격파 로봇";
  if (type === "data") return "데이터 기록";
  if (type === "root") return `${localizeArea(description)} 뿌리 노드`;
  if (type === "shanhai") return `${localizeArea(description)} 산해 9000`;
  if (type === "hack") {
    if (/miniboss/i.test(description)) return "중간 보스를 여는 해킹 지점";
    if (/jade below/i.test(description)) return "아래쪽 옥석을 여는 해킹 지점";
    if (/Herb Catalyst/i.test(description)) return "위쪽 약초 촉매를 여는 해킹 지점";
    if (/chest above/i.test(description)) return "위쪽 상자를 여는 해킹 지점";
    if (/achievement/i.test(description)) return "로봇으로 중간 보스를 처치하는 해킹 지점";
    return "해킹 지점";
  }
  return "위치 정보";
}
