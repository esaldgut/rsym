
import type { Metadata } from "next";
import "@/app/globals.css";

export const metadata: Metadata = {
  title: "YAAN - $(general)",
  description: "YAAN Web Application",
};

export default function GeneralLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <>
      {children}
    </>
  );
}
