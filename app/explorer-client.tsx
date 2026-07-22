"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { LayerGroup, Map as LeafletMap, Marker as LeafletMarker } from "leaflet";

type MarkerData = { id: string; x: number; y: number; type: string; description: string };
type ViewMode = "grotto" | "all";
type ConnectionPair = { id: string; name: string; color: string; from: [number, number]; to: [number, number]; curve: [number, number] };

const GROTTO_CENTER: [number, number] = [-0.0815, 0.7315];
const WORLD_CENTER: [number, number] = [-0.0972900390625, 0.443359375];

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
    Promise.all([fetch("/api/markers"), fetch("/api/progress")])
      .then(async ([markersResponse, progressResponse]) => {
        if (!markersResponse.ok) throw new Error("marker-data");
        const markerPayload = (await markersResponse.json()) as MarkerData[];
        const progressPayload = progressResponse.ok ? ((await progressResponse.json()) as { completedIds: string[] }) : { completedIds: [] };
        if (!cancelled) { setMarkers(markerPayload); setCompletedIds(new Set(progressPayload.completedIds)); }
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
      return marker.description.toLowerCase().includes(normalizedQuery) || typeLabel(marker.type).toLowerCase().includes(normalizedQuery);
    });
  }, [markers, viewMode, selectedType, hideCompleted, completedIds, query]);

  const scopedMarkers = useMemo(() => markers.filter((marker) => viewMode === "all" || inGrottoWest(marker)), [markers, viewMode]);
  const completedInScope = useMemo(() => scopedMarkers.filter((marker) => completedIds.has(marker.id)).length, [scopedMarkers, completedIds]);
  const progressPercent = scopedMarkers.length ? Math.round((completedInScope / scopedMarkers.length) * 100) : 0;
  const typeOptions = useMemo(() => [...new Set(scopedMarkers.map((marker) => normalizeType(marker.type)))].sort((a, b) => typeLabel(a).localeCompare(typeLabel(b), "ko")), [scopedMarkers]);

  const toggleComplete = useCallback(async (markerId: string) => {
    let nextCompleted = false;
    setCompletedIds((current) => {
      const next = new Set(current); nextCompleted = !next.has(markerId);
      if (nextCompleted) next.add(markerId); else next.delete(markerId); return next;
    });
    try {
      const response = await fetch("/api/progress", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ markerId, completed: nextCompleted }) });
      if (!response.ok) throw new Error("save-failed");
      setToast(nextCompleted ? "획득 완료로 저장했습니다." : "체크를 되돌렸습니다.");
    } catch {
      setCompletedIds((current) => { const next = new Set(current); if (nextCompleted) next.delete(markerId); else next.add(markerId); return next; });
      setToast("저장하지 못했습니다. 다시 시도해 주세요.");
    }
  }, []);
  toggleCompleteRef.current = (id) => void toggleComplete(id);

  useEffect(() => { if (!toast) return; const timer = window.setTimeout(() => setToast(null), 2200); return () => window.clearTimeout(timer); }, [toast]);

  useEffect(() => {
    let cancelled = false;
    async function drawMarkers() {
      const layer = markerLayerRef.current; if (!mapRef.current || !layer) return;
      const L = await import("leaflet"); if (cancelled) return;
      layer.clearLayers(); markerRefs.current.clear();
      visibleMarkers.forEach((markerData) => {
        const isComplete = completedIds.has(markerData.id);
        const icon = L.divIcon({ className: "marker-icon", html: `<div class="marker-badge${isComplete ? " is-complete" : ""}"><img src="${iconUrl(markerData.type)}" alt="" /></div>`, iconSize: [34, 34], iconAnchor: [17, 17], popupAnchor: [0, -17] });
        const marker = L.marker([markerData.x, markerData.y], { icon, title: `${typeLabel(markerData.type)}: ${markerData.description}`, alt: markerData.description });
        const popup = document.createElement("div");
        const type = document.createElement("div"); type.className = "popup-type"; type.textContent = typeLabel(markerData.type);
        const description = document.createElement("div"); description.className = "popup-description"; description.textContent = markerData.description;
        const actions = document.createElement("div"); actions.className = "popup-actions";
        const checkButton = document.createElement("button"); checkButton.type = "button"; checkButton.className = isComplete ? "done" : ""; checkButton.textContent = isComplete ? "체크 해제" : "획득 완료"; checkButton.addEventListener("click", () => toggleCompleteRef.current(markerData.id));
        const sourceLink = document.createElement("a"); sourceLink.href = `https://ninesolsmap.com/en/${markerData.id}`; sourceLink.target = "_blank"; sourceLink.rel = "noreferrer"; sourceLink.textContent = "원본 ↗";
        actions.append(checkButton, sourceLink); popup.append(type, description, actions); marker.bindPopup(popup, { maxWidth: 280 }); marker.addTo(layer); markerRefs.current.set(markerData.id, marker);
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
        <div className="brand"><div className="brand-mark" aria-hidden="true">九</div><div><h1>나인 솔즈 탐사 지도</h1><p>Item tracker & route guide</p></div></div>
        <div className="top-stats"><span className="save-state">개인 진행도 저장 중</span><span className="top-progress"><strong>{completedInScope}</strong> / {scopedMarkers.length}</span></div>
      </header>
      <div className="workspace">
        <aside className="side-panel" aria-label="지도 탐색 도구"><div className="panel-scroll">
          <section className="intro"><p className="eyebrow">Personal exploration log</p><h2>{viewMode === "grotto" ? "도교 석굴 서쪽" : "신곤 전체 지도"}</h2><p className="intro-copy">아이콘을 눌러 획득 여부를 체크하고, 석굴에서는 같은 색 번호끼리 이어지는 길을 확인하세요.</p></section>
          <div className="view-switch" aria-label="지도 범위 선택"><button className={viewMode === "grotto" ? "active" : ""} onClick={() => changeView("grotto")}>석굴 서쪽</button><button className={viewMode === "all" ? "active" : ""} onClick={() => changeView("all")}>전체 지도</button></div>
          <section className="progress-card" aria-label="탐사 진행도"><div className="progress-row"><span>현재 범위 진행도</span><strong>{progressPercent}%</strong></div><div className="progress-track" aria-hidden="true"><i style={{ width: `${progressPercent}%` }} /></div></section>
          {viewMode === "grotto" && <section>
            <div className="section-title"><h3>석굴 연결 오버레이</h3><div className="route-toggle"><span>7쌍</span><button className={`toggle-button ${showConnections ? "on" : ""}`} onClick={() => setShowConnections((value) => !value)}>{showConnections ? "표시 중" : "숨김"}</button></div></div>
            <div className="route-grid">{CONNECTIONS.map((pair) => <button className="route-button" key={pair.id} onClick={() => focusConnection(pair)}><span className="route-swatch" style={{ background: pair.color, color: pair.color }} /><b>{pair.id} · {pair.name}</b></button>)}</div>
            <details className="reference-card"><summary>첨부한 손그림 같이 보기</summary><img src="/grotto-west-connections.png" alt="색으로 연결 지점을 표시한 도교 석굴 서쪽 손그림" /><p>손그림의 같은 색 표시를 A–G 연결선으로 옮겼습니다. 위치를 다듬고 싶을 때 이 원본과 바로 비교할 수 있어요.</p></details>
          </section>}
          <section>
            <div className="section-title"><h3>아이템 & 상호작용</h3><span>{loading ? "불러오는 중" : `${visibleMarkers.length}개 표시`}</span></div>
            <div className="controls"><label className="search-field"><span className="sr-only">아이템 검색</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="아이템 설명 검색" /></label><div className="control-line"><select className="type-select" value={selectedType} onChange={(event) => setSelectedType(event.target.value)} aria-label="아이템 종류"><option value="all">모든 종류</option>{typeOptions.map((type) => <option value={type} key={type}>{typeLabel(type)}</option>)}</select><button className={`soft-button ${hideCompleted ? "active" : ""}`} onClick={() => setHideCompleted((value) => !value)}>완료 숨김</button></div></div>
            <div className="marker-list">{listMarkers.map((marker) => { const completed = completedIds.has(marker.id); return <button className={`list-row ${completed ? "completed" : ""}`} key={marker.id} onClick={() => focusMarker(marker)}><img className="list-icon" src={iconUrl(marker.type)} alt="" /><span className="list-copy"><strong>{marker.description}</strong><span>{typeLabel(marker.type)}</span></span><span className="check-dot" role="checkbox" aria-checked={completed} aria-label={`${marker.description} 획득 여부`} onClick={(event) => { event.stopPropagation(); void toggleComplete(marker.id); }}>✓</span></button>; })}{!loading && listMarkers.length === 0 && <div className="empty-state">조건에 맞는 아이템이 없습니다.</div>}{visibleMarkers.length > listMarkers.length && <div className="more-row">지도에는 나머지 {visibleMarkers.length - listMarkers.length}개 아이콘도 표시됩니다.</div>}</div>
          </section>
          <p className="source-note">지도 타일·아이템 위치와 설명은 <a href="https://ninesolsmap.com/en" target="_blank" rel="noreferrer">Nine Sols Interactive Map</a>의 공개 데이터를 사용합니다. 연결 정보는 첨부한 손그림을 바탕으로 표시했습니다.</p>
        </div></aside>
        <section className="map-pane" aria-label="나인 솔즈 인터랙티브 지도"><div ref={mapElementRef} className="map-canvas" /><div className="map-hint"><b>{viewMode === "grotto" ? "A1 ↔ A2처럼 같은 글자를 따라가세요." : "아이콘을 누르면 설명과 체크 버튼이 열립니다."}</b>{viewMode === "grotto" && " 목록의 색 버튼을 누르면 해당 연결만 가까이 볼 수 있습니다."}</div></section>
      </div>
      {toast && <div className="toast" role="status">{toast}</div>}
    </main>
  );
}
