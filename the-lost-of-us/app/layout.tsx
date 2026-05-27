import { ClerkProvider } from "@clerk/nextjs";
import ThemeProvider from "@/app/components/theme/ThemeProvider";
import "leaflet/dist/leaflet.css";
import "./globals.css";

const clerkLocalization = {
  userButton: {
    action__addAccount: "Adicionar conta",
    action__closeUserMenu: "Fechar menu do usuario",
    action__manageAccount: "Gerenciar conta",
    action__openUserMenu: "Abrir menu do usuario",
    action__signOut: "Sair",
    action__signOutAll: "Sair de todas as contas",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <body>
        <ClerkProvider localization={clerkLocalization}>
          <ThemeProvider>{children}</ThemeProvider>
        </ClerkProvider>
      </body>
    </html>
  );
}
