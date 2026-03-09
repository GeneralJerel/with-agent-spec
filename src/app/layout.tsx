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
      <body className={"antialiased"}>
        <div className="flex h-dvh w-screen flex-col min-h-0 overflow-hidden bg-background">
          {children}
        </div>
      </body>
    </html>
  );
}
