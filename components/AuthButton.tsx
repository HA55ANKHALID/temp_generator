"use client";

export default function AuthButton() {
  const handleSignOut = () => {
    // Add your sign out logic here
    // For example: signOut(), clear session, redirect, etc.
    console.log("Sign out clicked");
  };

  return (
    <button 
      onClick={handleSignOut}
      className="rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-semibold text-white transition hover:-translate-y-0.5 hover:border-white/30 hover:bg-white/15"
    >
      Sign Out
    </button>
  );
}
