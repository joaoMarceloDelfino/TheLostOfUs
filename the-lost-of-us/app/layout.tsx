import { ClerkProvider } from "@clerk/nextjs";
import ThemeProvider from "@/app/components/theme/ThemeProvider";
import "leaflet/dist/leaflet.css";
import "./globals.css";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body>
        <ClerkProvider>
          <ThemeProvider>{children}</ThemeProvider>
        </ClerkProvider>
      </body>
    </html>
  );
}
