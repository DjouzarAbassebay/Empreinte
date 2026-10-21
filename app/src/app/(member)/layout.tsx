import { Nav } from "@/components/Nav";
import { requireUser } from "@/lib/auth";

export default async function MemberLayout({ children }: { children: React.ReactNode }) {
  const { profile } = await requireUser();
  return (
    <>
      <Nav profile={profile} />
      <main className="page">
        <div className="wrap">{children}</div>
      </main>
    </>
  );
}
