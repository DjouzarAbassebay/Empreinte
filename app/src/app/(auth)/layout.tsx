import { ThemeToggle } from "@/components/ThemeToggle";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="auth">
      <div style={{ position: "fixed", top: 16, right: 16, zIndex: 5 }}>
        <ThemeToggle />
      </div>
      {children}
    </div>
  );
}
