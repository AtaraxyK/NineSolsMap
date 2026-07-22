"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { LayerGroup, Map as LeafletMap, Marker as LeafletMarker } from "leaflet";
import { isCheckableType, localizedMarkerDescription } from "./marker-localization";

type MarkerData = { id: string; x: number; y: number; type: string; description: string };
type ViewMode = "grotto" | "all";
type ConnectionPair = { id: string; name: string; color: string; from: [number, number]; to: [number, number]; curve: [number, number] };

const GROTTO_CENTER: [number, number] = [-0.0815, 0.7315];
const WORLD_CENTER: [number, number] = [-0.0972900390625, 0.443359375];
const APP_VERSION = "2026.07.23-1";

const CONNECTIONS: ConnectionPair[] = [
  { id: "A", name: "보라 연결", color: "#9a6bdb", from: [-0.0657, 0.7194], to: [-0.0822, 0.7131], curve: [-0.073, 0.706] },
  { id: "B", name: "진홍 연결", color: "#d75767", from: [-0.0727, 0.7194], to: [-0.0767, 0.7260], curve: [-0.071, 0.728] },
  { id: "C", name: "파랑 연결", color: "#54a9e8", from: [-0.0654, 0.7461], to: [-0.0742, 0.7412], curve: [-0.068, 0.752] },
  { id: "D", name: "초록 연결", color: "#48b576", from: [-0.0822, 0.7394], to: [-0.0849, 0.7229], curve: [-0.080, 0.731] },
  { id: "E", name: "연두 연결", color: "#b8d93f", from: [-0.0846, 0.7180], to: [-0.0919, 0.7168], curve: [-0.089, 0.711] },
  { id: "F", name: "분홍 연결", color: "#df78b5", from: [-0.0822, 0.7107], to: [-0.0864, 0.7064], curve: [-0.081, 0.703] },
  { id: "G", name: "갈색 연결", color: "#b46c44", from: [-0.0803, 0.7534], to: [-0.0919, 0.7485], curve: [-0.087, 0.759] },
];

const TYPE_LABELS: Record<string, string> = {
  artifact: "유물", boss: "보스", chest: "금 상자", chiyou: "치우", collectible: "부품 상자",
  cpu: "계산 장치", darksteel: "현철", data: "데이터", fruit: "도과", hack: "해킹 지점",
  herb: "약초 촉매", jade: "옥", keyitem: "핵심 아이템", miniboss: "중간 보스",
  poison: "독물", robot: "격파 로봇", root: "뿌리 노드", shanhai: "산해 9000", vial: "약병",
};

const normalizeType = (type: string) => type.trim().toLowerCase();
const typeLabel = (type: string) => TYPE_LABELS[normalizeType(type)] ?? type;
const iconUrl = (type: string) => `https://ninesolsmap.com/icons/${normalizeType(type)}.png`;
const inGrottoWest = (marker: MarkerData) => marker.x >= -0.106 && marker.x <= -0.056 && marker.y >= 0.68 && marker.y <= 0.775;
const PROGRESS_STORAGE_KEY = "nine-sols-map-progress-v1";
const SAVE_DATA_PREFIX = "NINESOLS-MAP-V1:";
const localAssetUrl = (path: string) => typeof window === "undefined" ? path : new URL(path.replace(/^\//, ""), document.baseURI).toString();

function readSavedProgress() {
  try {
    const value = JSON.parse(window.localStorage.getItem(PROGRESS_STORAGE_KEY) ?? "[]") as unknown;
    return new Set(Array.isArray(value) ? value.filter((id): id is string => typeof id === "string") : []);
  } catch {
    return new Set<string>();
  }
}

function persistProgress(completedIds: Set<string>) {
  window.localStorage.setItem(PROGRESS_STORAGE_KEY, JSON.stringify([...completedIds]));
}

function encodeSaveData(completedIds: Set<string>) {
  const payload = JSON.stringify({ version: 1, completedIds: [...completedIds].sort() });
  return `${SAVE_DATA_PREFIX}${window.btoa(payload)}`;
}

function decodeSaveData(value: string) {
  const trimmed = value.trim();
  if (!trimmed.startsWith(SAVE_DATA_PREFIX)) throw new Error("invalid-prefix");
  const payload = JSON.parse(window.atob(trimmed.slice(SAVE_DATA_PREFIX.length))) as { version?: unknown; completedIds?: unknown };
  if (payload.version !== 1 || !Array.isArray(payload.completedIds)) throw new Error("invalid-payload");
  return payload.completedIds.filter((id): id is string => typeof id === "string");
}

export default function ExplorerClient() {
  const mapElementRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<LeafletMap | null>(null);
  const markerLayerRef = useRef<LayerGroup | null>(null);
  const connectionLayerRef = useRef<LayerGroup | null>(null);
  const markerRefs = useRef(new Map<string, LeafletMarker>());
  const toggleCompleteRef = useRef<(id: string) => void>(() => undefined);
  const [markers, setMarkers] = useState<MarkerData[]>([]);
  const [completedIds, setCompletedIds] = useState<Set<string>>(new Set());
  const [viewMode, setViewMode] = useState<ViewMode>("grotto");
  const [showConnections, setShowConnections] = useState(true);
  const [selectedType, setSelectedType] = useState("all");
  const [query, setQuery] = useState("");
  const [hideCompleted, setHideCompleted] = useState(false);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch(localAssetUrl("markers.json"))
      .then(async (markersResponse) => {
        if (!markersResponse.ok) throw new Error("marker-data");
        const markerPayload = (await markersResponse.json()) as MarkerData[];
        const checkableMarkerIds = new Set(markerPayload.filter((marker) => isCheckableType(marker.type)).map((marker) => marker.id));
        const savedProgress = new Set([...readSavedProgress()].filter((id) => checkableMarkerIds.has(id)));
        if (!cancelled) { setMarkers(markerPayload); setCompletedIds(savedProgress); }
      })
      .catch(() => { if (!cancelled) setToast("지도 데이터를 불러오지 못했습니다. 잠시 뒤 새로고침해 주세요."); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    let disposed = false;
    async function initializeMap() {
      if (!mapElementRef.current || mapRef.current) return;
      const L = await import("leaflet");
      if (disposed || !mapElementRef.current) return;
      const map = L.map(mapElementRef.current, {
        crs: L.CRS.Simple, center: GROTTO_CENTER, zoom: 14, minZoom: 13, maxZoom: 15,
        maxBounds: [[0.05, -0.05], [-0.317529296875, 1]], maxBoundsViscosity: 0.68,
        zoomControl: false, scrollWheelZoom: true, attributionControl: false,
      });
      L.control.zoom({ position: "bottomright" }).addTo(map);
      L.tileLayer("https://map.ninesolsmap.com/map/{z}/{x}/{y}.png", { minZoom: 13, maxZoom: 15, noWrap: true }).addTo(map);
      markerLayerRef.current = L.layerGroup().addTo(map);
      connectionLayerRef.current = L.layerGroup().addTo(map);
      mapRef.current = map;
      window.setTimeout(() => map.invalidateSize(), 0);
    }
    void initializeMap();
    return () => { disposed = true; mapRef.current?.remove(); mapRef.current = null; markerLayerRef.current = null; connectionLayerRef.current = null; };
  }, []);

  const visibleMarkers = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return markers.filter((marker) => {
      if (viewMode === "grotto" && !inGrottoWest(marker)) return false;
      if (selectedType !== "all" && normalizeType(marker.type) !== selectedType) return false;
      if (hideCompleted && completedIds.has(marker.id)) return false;
      if (!normalizedQuery) return true;
      return localizedMarkerDescription(marker).toLowerCase().includes(normalizedQuery) || typeLabel(marker.type).toLowerCase().includes(normalizedQuery);
    });
  }, [markers, viewMode, selectedType, hideCompleted, completedIds, query]);

  const scopedMarkers = useMemo(() => markers.filter((marker) => viewMode === "all" || inGrottoWest(marker)), [markers, viewMode]);
  const scopedCheckableMarkers = useMemo(() => scopedMarkers.filter((marker) => isCheckableType(marker.type)), [scopedMarkers]);
  const checkableMarkerIds = useMemo(() => new Set(markers.filter((marker) => isCheckableType(marker.type)).map((marker) => marker.id)), [markers]);
  const completedInScope = useMemo(() => scopedCheckableMarkers.filter((marker) => completedIds.has(marker.id)).length, [scopedCheckableMarkers, completedIds]);
  const progressPercent = scopedCheckableMarkers.length ? Math.round((completedInScope / scopedCheckableMarkers.length) * 100) : 0;
  const typeOptions = useMemo(() => [...new Set(scopedMarkers.map((marker) => normalizeType(marker.type)))].sort((a, b) => typeLabel(a).localeCompare(typeLabel(b), "ko")), [scopedMarkers]);

  const toggleComplete = useCallback((markerId: string) => {
    if (!checkableMarkerIds.has(markerId)) return;
    const next = new Set(completedIds); const nextCompleted = !next.has(markerId);
    if (nextCompleted) next.add(markerId); else next.delete(markerId);
    setCompletedIds(next);
    try {
      persistProgress(next);
      setToast(nextCompleted ? "획득 완료로 저장했습니다." : "체크를 되돌렸습니다.");
    } catch {
      setToast("브라우저 저장소를 사용할 수 없어 이번 화면에만 반영했습니다.");
    }
  }, [checkableMarkerIds, completedIds]);
  useEffect(() => { toggleCompleteRef.current = toggleComplete; }, [toggleComplete]);

  const copySaveData = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(encodeSaveData(completedIds));
      setToast(`체크한 아이템 ${completedIds.size}개의 세이브 데이터를 복사했습니다.`);
    } catch {
      setToast("클립보드에 복사하지 못했습니다. 브라우저의 클립보드 권한을 확인해 주세요.");
    }
  }, [completedIds]);

  const pasteSaveData = useCallback(async () => {
    try {
      const importedIds = decodeSaveData(await navigator.clipboard.readText());
      const next = new Set(importedIds.filter((id) => checkableMarkerIds.has(id)));
      setCompletedIds(next);
      persistProgress(next);
      setToast(`세이브 데이터를 불러왔습니다. 체크한 아이템 ${next.size}개가 복원됐습니다.`);
    } catch {
      setToast("올바른 세이브 데이터를 붙여넣지 못했습니다. 먼저 다른 기기에서 데이터를 복사해 주세요.");
    }
  }, [checkableMarkerIds]);

  useEffect(() => { if (!toast) return; const timer = window.setTimeout(() => setToast(null), 2200); return () => window.clearTimeout(timer); }, [toast]);

  useEffect(() => {
    let cancelled = false;
    async function drawMarkers() {
      const layer = markerLayerRef.current; if (!mapRef.current || !layer) return;
      const L = await import("leaflet"); if (cancelled) return;
      layer.clearLayers(); markerRefs.current.clear();
      visibleMarkers.forEach((markerData) => {
        const checkable = isCheckableType(markerData.type);
        const isComplete = checkable && completedIds.has(markerData.id);
        const localizedDescription = localizedMarkerDescription(markerData);
        const icon = L.divIcon({ className: "marker-icon", html: `<div class="marker-badge${isComplete ? " is-complete" : ""}"><img src="${iconUrl(markerData.type)}" alt="" /></div>`, iconSize: [34, 34], iconAnchor: [17, 17], popupAnchor: [0, -17] });
        const marker = L.marker([markerData.x, markerData.y], { icon, title: `${typeLabel(markerData.type)}: ${localizedDescription}`, alt: localizedDescription });
        const popup = document.createElement("div");
        const type = document.createElement("div"); type.className = "popup-type"; type.textContent = typeLabel(markerData.type);
        const description = document.createElement("div"); description.className = "popup-description"; description.textContent = localizedDescription;
        const actions = document.createElement("div"); actions.className = "popup-actions";
        const sourceLink = document.createElement("a"); sourceLink.href = `https://ninesolsmap.com/en/${markerData.id}`; sourceLink.target = "_blank"; sourceLink.rel = "noreferrer"; sourceLink.textContent = "원본 지도 ↗";
        if (checkable) {
          const checkButton = document.createElement("button"); checkButton.type = "button"; checkButton.className = isComplete ? "done" : ""; checkButton.textContent = isComplete ? "체크 해제" : "획득 완료"; checkButton.addEventListener("click", () => toggleCompleteRef.current(markerData.id));
          actions.append(checkButton, sourceLink);
        } else {
          actions.classList.add("view-only"); actions.append(sourceLink);
        }
        popup.append(type, description, actions); marker.bindPopup(popup, { maxWidth: 280 }); marker.addTo(layer); markerRefs.current.set(markerData.id, marker);
      });
    }
    void drawMarkers(); return () => { cancelled = true; };
  }, [visibleMarkers, completedIds]);

  useEffect(() => {
    let cancelled = false;
    async function drawConnections() {
      const layer = connectionLayerRef.current; if (!layer) return;
      const L = await import("leaflet"); if (cancelled) return;
      layer.clearLayers(); if (!showConnections || viewMode !== "grotto") return;
      CONNECTIONS.forEach((pair) => {
        L.polyline([pair.from, pair.curve, pair.to], { color: pair.color, weight: 3, opacity: 0.82, dashArray: "7 8", lineCap: "round" }).addTo(layer);
        [pair.from, pair.to].forEach((point, index) => {
          const endpoint = L.marker(point, { icon: L.divIcon({ className: "portal-icon", html: `<div class="portal-node" style="background:${pair.color};color:#071723">${pair.id}${index + 1}</div>`, iconSize: [22, 22], iconAnchor: [11, 11] }), interactive: false });
          endpoint.bindTooltip(pair.name, { direction: "top", offset: [0, -11], className: "portal-tooltip" }); endpoint.addTo(layer);
        });
      });
    }
    void drawConnections(); return () => { cancelled = true; };
  }, [showConnections, viewMode]);

  const changeView = (nextMode: ViewMode) => {
    setViewMode(nextMode); setSelectedType("all"); setQuery(""); const map = mapRef.current; if (!map) return;
    map.setView(nextMode === "grotto" ? GROTTO_CENTER : WORLD_CENTER, nextMode === "grotto" ? 14 : 13, { animate: true });
  };
  const focusMarker = (marker: MarkerData) => { mapRef.current?.setView([marker.x, marker.y], 15, { animate: true }); window.setTimeout(() => markerRefs.current.get(marker.id)?.openPopup(), 280); };
  const focusConnection = (pair: ConnectionPair) => { mapRef.current?.fitBounds([pair.from, pair.to], { padding: [100, 100], maxZoom: 15, animate: true }); };
  const listMarkers = visibleMarkers.slice(0, 80);

  return (
    <main className="app-shell">
      <header className="topbar">
        <div className="brand"><div className="brand-mark" aria-hidden="true">九</div><div><h1>나인 솔즈 탐사 지도</h1><p>아이템 체크 · 길찾기</p></div></div>
        <div className="top-stats"><span className="save-state">브라우저 저장 · {APP_VERSION}</span><span className="top-progress"><strong>{completedInScope}</strong> / {scopedCheckableMarkers.length}</span></div>
      </header>
      <div className="workspace">
        <aside className="side-panel" aria-label="지도 탐색 도구"><div className="panel-scroll">
          <section className="intro"><p className="eyebrow">개인 탐사 기록</p><h2>{viewMode === "grotto" ? "도교 석굴 서쪽" : "신곤 전체 지도"}</h2><p className="intro-copy">획득 아이템과 데이터 기록만 체크할 수 있습니다. 보스·산해·뿌리 노드 같은 위치 정보는 지도에서 그대로 확인하세요.</p></section>
          <div className="view-switch" aria-label="지도 범위 선택"><button className={viewMode === "grotto" ? "active" : ""} onClick={() => changeView("grotto")}>석굴 서쪽</button><button className={viewMode === "all" ? "active" : ""} onClick={() => changeView("all")}>전체 지도</button></div>
          <section className="progress-card" aria-label="아이템 획득 진행도"><div className="progress-row"><span>현재 범위 아이템</span><strong>{progressPercent}%</strong></div><div className="progress-track" aria-hidden="true"><i style={{ width: `${progressPercent}%` }} /></div></section>
          <section className="save-card" aria-label="세이브 데이터 옮기기">
            <div><strong>세이브 데이터 옮기기</strong><span>다른 기기로 체크 기록을 복사할 수 있어요.</span></div>
            <div className="save-actions"><button type="button" onClick={() => void copySaveData()}>복사하기</button><button type="button" onClick={() => void pasteSaveData()}>붙여넣기</button></div>
          </section>
          {viewMode === "grotto" && <section>
            <div className="section-title"><h3>석굴 연결 오버레이</h3><div className="route-toggle"><span>7쌍</span><button className={`toggle-button ${showConnections ? "on" : ""}`} onClick={() => setShowConnections((value) => !value)}>{showConnections ? "표시 중" : "숨김"}</button></div></div>
            <div className="route-grid">{CONNECTIONS.map((pair) => <button className="route-button" key={pair.id} onClick={() => focusConnection(pair)}><span className="route-swatch" style={{ background: pair.color, color: pair.color }} /><b>{pair.id} · {pair.name}</b></button>)}</div>
            <details className="reference-card"><summary>첨부한 손그림 같이 보기</summary><img src={localAssetUrl("grotto-west-connections.png")} alt="색으로 연결 지점을 표시한 도교 석굴 서쪽 손그림" /><p>손그림의 같은 색 표시를 A–G 연결선으로 옮겼습니다. 위치를 다듬고 싶을 때 이 원본과 바로 비교할 수 있어요.</p></details>
          </section>}
          <section>
            <div className="section-title"><h3>지도 표시</h3><span>{loading ? "불러오는 중" : `${visibleMarkers.length}개 표시`}</span></div>
            <div className="controls"><label className="search-field"><span className="sr-only">지도 표시 검색</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="한국어 이름 검색" /></label><div className="control-line"><select className="type-select" value={selectedType} onChange={(event) => setSelectedType(event.target.value)} aria-label="표시 종류"><option value="all">모든 종류</option>{typeOptions.map((type) => <option value={type} key={type}>{typeLabel(type)}</option>)}</select><button className={`soft-button ${hideCompleted ? "active" : ""}`} onClick={() => setHideCompleted((value) => !value)}>완료 숨김</button></div></div>
            <div className="marker-list">
              {listMarkers.map((marker) => {
                const checkable = isCheckableType(marker.type);
                const completed = checkable && completedIds.has(marker.id);
                const localizedDescription = localizedMarkerDescription(marker);
                return <button className={`list-row ${completed ? "completed" : ""}`} key={marker.id} onClick={() => focusMarker(marker)}>
                  <img className="list-icon" src={iconUrl(marker.type)} alt="" />
                  <span className="list-copy"><strong>{localizedDescription}</strong><span>{typeLabel(marker.type)}</span></span>
                  {checkable
                    ? <span className="check-dot" role="checkbox" aria-checked={completed} aria-label={`${localizedDescription} 획득 여부`} onClick={(event) => { event.stopPropagation(); toggleComplete(marker.id); }}>✓</span>
                    : <span className="view-only-badge">위치</span>}
                </button>;
              })}
              {!loading && listMarkers.length === 0 && <div className="empty-state">조건에 맞는 표시가 없습니다.</div>}
              {visibleMarkers.length > listMarkers.length && <div className="more-row">지도에는 나머지 {visibleMarkers.length - listMarkers.length}개 아이콘도 표시됩니다.</div>}
            </div>
          </section>
          <p className="source-note">지도 타일과 아이콘 위치는 <a href="https://ninesolsmap.com/en" target="_blank" rel="noreferrer">나인 솔즈 인터랙티브 지도</a>의 공개 데이터를 사용합니다. 이름은 한국어로 옮겼고, 연결 정보는 첨부한 손그림을 바탕으로 표시했습니다.</p>
        </div></aside>
        <section className="map-pane" aria-label="나인 솔즈 인터랙티브 지도"><div ref={mapElementRef} className="map-canvas" /><div className="map-hint"><b>{viewMode === "grotto" ? "A1 ↔ A2처럼 같은 글자를 따라가세요." : "아이템은 체크할 수 있고, 나머지 아이콘은 위치만 보여줍니다."}</b>{viewMode === "grotto" && " 목록의 색 버튼을 누르면 해당 연결만 가까이 볼 수 있습니다."}</div></section>
      </div>
      {toast && <div className="toast" role="status">{toast}</div>}
    </main>
  );
}
