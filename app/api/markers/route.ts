const MARKERS_URL = "https://ninesolsmap.com/api/markers";

export async function GET() {
  try {
    const upstream = await fetch(MARKERS_URL, {
      headers: { Accept: "application/json" },
    });

    if (!upstream.ok) {
      throw new Error(`Marker source returned ${upstream.status}`);
    }

    const payload = await upstream.text();
    JSON.parse(payload);

    return new Response(payload, {
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Cache-Control": "public, max-age=300, stale-while-revalidate=3600",
      },
    });
  } catch {
    return Response.json(
      { error: "아이템 위치 데이터를 불러오지 못했습니다." },
      { status: 502 }
    );
  }
}
