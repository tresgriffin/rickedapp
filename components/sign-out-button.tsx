"use client";

import { signOut } from "next-auth/react";

export default function SignOutButton() {
  return (
    <button
      onClick={() => signOut({ callbackUrl: "/login" })}
      className="mt-2 rounded-full border-2 border-[#551904] px-6 py-2.5 text-sm font-bold text-[#551904] transition hover:bg-[#551904] hover:text-white focus:outline-none focus:ring-2 focus:ring-[#551904] focus:ring-offset-2"
    >
      Sign out
    </button>
  );
}
