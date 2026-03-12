import type { Metadata } from "next";
import { QueryProvider } from "@/components/query-provider";
import "./globals.css";

export const metadata: Metadata = {
  title: "Document Manager",
  description: "Upload and organize your documents",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="bg-neutral-900 text-neutral-200 antialiased">
        <QueryProvider>{children}</QueryProvider>
      </body>
    </html>
  );
}
