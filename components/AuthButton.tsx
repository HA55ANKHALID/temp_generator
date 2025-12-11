"use client";
import Link from "next/link";

export default function AuthButton() {
  // You can customize this based on your authentication logic
  // For now, it's a simple login button
  return (
    <Link
      href="/login"
      className="bg-[#e94560] hover:bg-[#d62848] text-white px-4 py-2 rounded transition-colors duration-200"
    >
      Login
    </Link>
  );
}
