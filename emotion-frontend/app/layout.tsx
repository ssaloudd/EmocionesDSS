import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { AuthProvider } from '@/lib/context/AuthContext'; // Importa tu AuthProvider
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "EduEmotion",
  description: "Sistema de Reconocimiento de Emociones para la Educación",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className={inter.className}>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}
