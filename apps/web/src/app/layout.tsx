import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "DeskPort — Enterprise CLI Tool Sharing",
  description:
    "Securely share CLI tools and terminal sessions across your organization with fine-grained access control.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}
