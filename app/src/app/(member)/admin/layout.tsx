import type { Metadata } from "next";
import { AdminTabs } from "@/components/admin/AdminTabs";
import { requireAdmin } from "@/lib/auth";

export const metadata: Metadata = { title: "Admin" };

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin();
  return (
    <>
      <div className="page-head" style={{ marginBottom: 16 }}>
        <div>
          <span className="label" style={{ color: "var(--spark)" }}>Administration</span>
          <h1 style={{ marginTop: 8 }}>Pilotage du bootcamp.</h1>
        </div>
      </div>
      <AdminTabs />
      {children}
    </>
  );
}
