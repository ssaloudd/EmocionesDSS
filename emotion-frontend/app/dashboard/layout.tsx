"use client"; // Este componente debe ser de cliente para usar el contexto

import Menu from "@/components/Menu";
import Navbar from "@/components/Navbar";
import Image from "next/image";
import Link from "next/link";
import { AuthProvider } from '@/lib/context/AuthContext'; // Importa el AuthProvider

export default function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    // Envuelve toda la aplicación con AuthProvider
    <AuthProvider>
      <div className="h-screen flex">
        {/* LEFT */}
        <div className="w-[14%] md:w-[8%] lg:w-[16%] xl:w-[14%] p-4">
          <Link
            href="/"
            className="flex items-center justify-center lg:justify-start gap-2"
          >
            <Image src="/logo.png" alt="logo" width={32} height={32} />
            <span className="hidden lg:block font-bold">EduEmotion</span>
          </Link>
          <Menu /> {/* El componente Menu ahora tendrá acceso al AuthContext */}
        </div>
        {/* RIGHT */}
        <div className="w-[86%] md:w-[92%] lg:w-[84%] xl:w-[86%] bg-[#F7F8FA] overflow-scroll flex flex-col">
          <Navbar />
          {children}
        </div>
      </div>
    </AuthProvider>
  );
}
