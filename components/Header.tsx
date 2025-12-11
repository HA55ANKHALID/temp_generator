"use client";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import AuthButton from "./AuthButton";

const navLinks = [
  { href: "/chatbot", label: "AI Chatbot" },
  { href: "/document-analyzer", label: "Document Analyzer" },
  { href: "https://temp-generator-chi.vercel.app", label: "Document Templates", external: true },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
];

export default function Header() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-40 bg-slate-950/80 backdrop-blur-md border-b border-white/10 shadow-lg">
      <div className="mx-auto flex h-[80px] w-full max-w-6xl items-center justify-between px-4 md:px-8">
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center gap-3">
            <Image 
              src="/logo.png" 
              alt="CaseMate Logo" 
              width={200} 
              height={200} 
              className="rounded-lg shadow-sm shadow-[#e94560]/1" 
              priority 
            />
          </Link>
        </div>

        <nav className="hidden items-center md:flex">
          <ul className="flex items-center gap-2 text-sm font-medium text-slate-200">
            {navLinks.map((link) => {
              const isActive = !link.external && pathname.startsWith(link.href);
              const baseStyles =
                "px-3 py-2 rounded-full transition-all duration-200 hover:text-white hover:bg-white/10";
              const activeStyles = isActive ? "bg-white/10 text-white shadow-sm shadow-[#e94560]/30" : "";

              if (link.external) {
                return (
                  <li key={link.href}>
                    <a
                      href={link.href}
                      className={`${baseStyles} ${activeStyles}`}
                      target="_blank"
                      rel="noreferrer"
                    >
                      {link.label}
                    </a>
                  </li>
                );
              }

              return (
                <li key={link.href}>
                  <Link href={link.href} className={`${baseStyles} ${activeStyles}`}>
                    {link.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="flex items-center gap-3">
          <Link
            href="/signup"
            className="hidden rounded-full bg-gradient-to-r from-[#e94560] to-[#ff6b6b] px-4 py-2 text-sm font-semibold text-white shadow-md shadow-[#e94560]/40 transition hover:-translate-y-0.5 hover:shadow-lg hover:shadow-[#e94560]/50 md:inline-flex"
          >
            Get started
          </Link>
          <AuthButton />
        </div>
      </div>

      <div className="px-4 pb-3 md:hidden">
        <div className="flex items-center gap-2 overflow-x-auto rounded-2xl border border-white/10 bg-white/5 p-2 text-sm text-slate-200">
          {navLinks.map((link) => {
            const isActive = !link.external && pathname.startsWith(link.href);
            const baseStyles =
              "whitespace-nowrap px-3 py-2 rounded-full transition-all duration-200 hover:text-white hover:bg-white/10";
            const activeStyles = isActive ? "bg-white/20 text-white shadow-sm shadow-[#e94560]/30" : "";

            if (link.external) {
              return (
                <a
                  key={link.href}
                  href={link.href}
                  className={`${baseStyles} ${activeStyles}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  {link.label}
                </a>
              );
            }

            return (
              <Link key={link.href} href={link.href} className={`${baseStyles} ${activeStyles}`}>
                {link.label}
              </Link>
            );
          })}
        </div>
      </div>
    </header>
  );
}
