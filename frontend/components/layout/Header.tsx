import Link from "next/link";

import { ArrowRight02Icon, Icon, Layers01Icon } from "@/components/icons/Icon";

const NAV_LINKS = [
  { href: "/check", label: "Check" },
  { href: "/guides", label: "Guides" },
  { href: "/#pools", label: "Pools" },
  { href: "/#readiness", label: "Readiness" },
];

export function Header() {
  return (
    <header className="relative z-10 mb-16 flex items-center justify-between gap-6">
      <Link href="/" className="flex cursor-pointer items-center gap-2 text-foreground">
        <span className="flex h-8 w-8 items-center justify-center rounded-full border border-border bg-gradient-to-b from-white/10 to-transparent text-accent">
          <Icon icon={Layers01Icon} size={16} />
        </span>
        <span className="text-lg font-medium tracking-tight">
          TURN<span className="text-faint">STILE</span>
        </span>
      </Link>

      <nav className="hidden items-center gap-8 rounded-full border border-border bg-surface/80 px-6 py-2 text-xs font-medium uppercase tracking-widest text-faint backdrop-blur-sm md:flex">
        {NAV_LINKS.map((link) => (
          <Link
            key={link.href}
            href={link.href}
            className="cursor-pointer transition-colors duration-200 hover:text-foreground"
          >
            {link.label}
          </Link>
        ))}
      </nav>

      <Link
        href="/check"
        className="group flex cursor-pointer items-center gap-2 rounded-lg border border-border bg-white/[0.03] px-5 py-2.5 text-[11px] font-medium uppercase tracking-tight text-muted transition-all duration-200 hover:border-border-strong hover:bg-white/[0.06] hover:text-foreground"
      >
        Check my wallet
        <Icon
          icon={ArrowRight02Icon}
          size={14}
          className="transition-transform duration-200 group-hover:translate-x-1"
        />
      </Link>
    </header>
  );
}
