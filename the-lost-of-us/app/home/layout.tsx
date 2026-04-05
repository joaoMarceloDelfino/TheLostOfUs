import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import HomeHeader from "@/app/components/home/HomeHeader";
import HomeFooter from "@/app/components/home/HomeFooter";

export default async function HomeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { userId } = await auth();

  if (!userId) {
    redirect("/");
  }

  return (
    <>
      <HomeHeader />
      {children}
      <HomeFooter />
    </>
  );
}