"use client";
import Image from "next/image";
import Link from "next/link";
import AuthButton from "./AuthButton";

export default function Header() {
  return (
    <header className="flex justify-between items-center px-6 md:px-12 py-4 bg-[#1a1a2e] text-white h-[80px]">
      <div className="logo">
        <Link href="/">
          <Image src="/logo.png" alt="CaseMate Logo" width={200} height={200} />
        </Link>
      </div>
      <nav className="relative">
        <ul className="flex items-center space-x-6">
          <li><Link href="/chatbot" className="hover:text-[#e94560]">AI Chatbot</Link></li>
          <li><Link href="/document-analyzer" className="hover:text-[#e94560]">Document Analyzer</Link></li>
          <li>
            <Link href="/generate" className="hover:text-[#e94560]">
              Document Templates
            </Link>
          </li>
          <li><Link href="/about" className="hover:text-[#e94560]">About</Link></li>
          <li><Link href="/contact" className="hover:text-[#e94560]">Contact</Link></li>
          <li><AuthButton /></li>
        </ul>
      </nav>
    </header>
  );
}
