"use client";

import { useAuth } from "@/hooks/useAuth";

export default function LoginButton() {
  const { signIn } = useAuth();

  return (
    <button
      onClick={() => signIn()}
      className="cursor-pointer rounded-lg bg-blue-400 px-6 py-3 text-white transition-colors hover:bg-blue-500"
    >
      Zaloguj się przez Google
    </button>
  );
}
