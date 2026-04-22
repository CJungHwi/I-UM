import type { Metadata, Viewport } from "next";
import { Inter, Oswald } from "next/font/google";
import { Providers } from "@/components/providers";
import { DashboardLayout } from "@/components/layout/dashboard-layout";
import { getMenuItems, buildMenuHierarchy } from "@/lib/menu";
import { auth } from "@/auth";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const oswald = Oswald({
  subsets: ["latin"],
  variable: "--font-oswald",
});

export const metadata: Metadata = {
  title: "이음(I-UM) - 학원 관리 시스템",
  description: "연결과 따뜻한 관리, 학원 통합 관리 플랫폼",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  viewportFit: "cover",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // 세션에서 사용자 권한 레벨 가져오기
  const session = await auth();
  const isAuthenticated = !!session?.user;
  const userLevel = session?.user?.mbLevel ?? 0;

  // 메뉴 데이터 가져오기 (로그인된 경우에만)
  const menuItems = isAuthenticated ? await getMenuItems(userLevel) : [];
  const navItems = buildMenuHierarchy(menuItems);

  return (
    <html lang="ko" suppressHydrationWarning>
      <body
        className={`${inter.variable} ${oswald.variable} font-sans antialiased`}
      >
        <Providers>
          {isAuthenticated ? (
            <DashboardLayout menuItems={navItems}>{children}</DashboardLayout>
          ) : (
            // 로그인 전: 사이드바/헤더 없이 렌더링
            <div className="min-h-dvh bg-background">
              {children}
            </div>
          )}
        </Providers>
      </body>
    </html>
  );
}
