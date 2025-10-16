"use client";

import { useAuth } from "@/hooks/useAuth";
import LoginButton from "@/components/LoginButton";
import UserProfile from "@/components/UserProfile";

export default function Home() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-dvh flex-col items-center justify-center space-y-8 text-center font-sans">
        <p>Ładowanie...</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center space-y-8 text-center font-sans">
      <h1 className="text-3xl font-bold">Calendar Sync</h1>

      {user ? (
        <UserProfile />
      ) : (
        <div className="space-y-4">
          <p className="text-gray-600">Zaloguj się, aby kontynuować</p>
          <LoginButton />
        </div>
      )}
    </div>
  );
}
