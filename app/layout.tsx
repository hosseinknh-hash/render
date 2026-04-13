import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Kitchen Render AI",
  description: "Upload your kitchen design. See it in real life.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
