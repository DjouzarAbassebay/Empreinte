import Link from "next/link";

export function Logo({ href = "/" }: { href?: string }) {
  return (
    <Link href={href} className="logo" aria-label="Espace Empreinte">
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M12 2.5c-4.4 0-7.5 3.4-7.5 8 0 3.2 1.3 6 3.2 8.3.5.6 1.4.6 1.9 0C11 17 12 14.8 12 12.6V9.3c0-.6.4-1 1-1s1 .4 1 1v3.3c0 2.2-.7 4.3-2 6.1 2.6-.9 4.6-3.1 5.6-5.7.5-1.3.9-2.7.9-4.1 0-4.1-2.9-6.4-6.5-6.4zm0 3c2 0 3.5 1.5 3.5 3.8 0 .5-.4.9-.9.9s-.9-.4-.9-.9c0-1.3-.8-2-1.7-2-1.1 0-2 .9-2 2.3v2.7c0 .5-.4.9-.9.9s-.9-.4-.9-.9V9.6c0-2.3 1.6-4.1 3.8-4.1z" />
      </svg>
      Empreinte<b>.</b>
    </Link>
  );
}
