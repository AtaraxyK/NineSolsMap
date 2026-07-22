import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "나인 솔즈 탐사 지도",
  description: "아이템 체크와 도교 석굴 서쪽 연결 정보를 한 화면에서 보는 개인 탐사 지도.",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
  openGraph: {
    title: "나인 솔즈 탐사 지도",
    description: "아이템 체크 · 석굴 연결 가이드",
    type: "website",
    images: [{ url: "/og.png", width: 1536, height: 1024, alt: "나인 솔즈 탐사 지도" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "나인 솔즈 탐사 지도",
    description: "아이템 체크 · 석굴 연결 가이드",
    images: ["/og.png"],
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
