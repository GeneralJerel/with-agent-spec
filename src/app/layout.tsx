import type { Metadata } from "next";

import "./globals.css";
import "./style.css";

export const metadata: Metadata = {
  title: "Scheduling Assistant",
  description: "AI scheduling assistant demo — manage your calendar, inbox, and emails",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=swap"
        />
      </head>
      <body className={"antialiased"}>
        <div className="flex h-dvh w-screen flex-col min-h-0 overflow-hidden bg-background">
          {children}
        </div>
      </body>
    </html>
  );
}
