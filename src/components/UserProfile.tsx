"use client";

import { supabase } from "@/lib/supabase";
import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/hooks/useAuth";
import { User } from "next-auth";
import Image from "next/image";

export default function UserProfile() {
  const { user: sessionUser, signOut } = useAuth();
  const user = sessionUser as User | null;
  const [checkboxValue, setCheckboxValue] = useState(0);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const fetchUserPreferences = useCallback(async () => {
    if (!user?.id) {
      console.log("Brak user.id:", user);
      return;
    }

    try {
      setLoading(true);
      console.log("Pobieranie danych dla użytkownika:", user.id);
      console.log("Pełny obiekt user:", user);

      const { data, error } = await supabase
        .from("user_preferences")
        .select("checkbox_value")
        .eq("user_id", user.id)
        .single();

      if (error && error.code !== "PGRST116") {
        // PGRST116 = no rows returned
        console.error("Błąd pobierania danych:", error.message);
        return;
      }

      if (data) {
        console.log("Znaleziono dane:", data);
        setCheckboxValue(data.checkbox_value);
      } else {
        console.log("Brak danych, ustawiam wartość domyślną");
        // Jeśli nie ma danych, ustaw wartość domyślną
        setCheckboxValue(0);
      }
    } catch (error) {
      console.error("Nieoczekiwany błąd:", error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Pobierz dane użytkownika przy załadowaniu komponentu
  useEffect(() => {
    fetchUserPreferences();
  }, [fetchUserPreferences]);

  const handleCheckboxChange = async (newValue: number) => {
    if (!user?.id) {
      console.log("Brak user.id w handleCheckboxChange:", user);
      return;
    }

    try {
      setSaving(true);
      console.log(
        "Zapisywanie wartości:",
        newValue,
        "dla użytkownika:",
        user.id,
      );

      // Najpierw sprawdź czy rekord istnieje
      const { data: existingData, error: selectError } = await supabase
        .from("user_preferences")
        .select("id")
        .eq("user_id", user.id)
        .single();

      if (selectError && selectError.code !== "PGRST116") {
        console.error(
          "Błąd sprawdzania istniejącego rekordu:",
          selectError.message,
        );
        return;
      }

      if (existingData) {
        // Rekord istnieje - wykonaj UPDATE
        console.log("Rekord istnieje, wykonuję UPDATE");
        const { error } = await supabase
          .from("user_preferences")
          .update({ checkbox_value: newValue })
          .eq("user_id", user.id);

        if (error) {
          console.error("Błąd aktualizacji:", error.message);
          alert("Wystąpił błąd podczas zapisywania danych");
          return;
        }
      } else {
        // Rekord nie istnieje - wykonaj INSERT
        console.log("Rekord nie istnieje, wykonuję INSERT");
        const { error } = await supabase.from("user_preferences").insert({
          user_id: user.id,
          checkbox_value: newValue,
        });

        if (error) {
          console.error("Błąd tworzenia rekordu:", error.message);
          alert("Wystąpił błąd podczas tworzenia rekordu");
          return;
        }
      }

      console.log("Wartość zapisana pomyślnie:", newValue);
      setCheckboxValue(newValue);

      // Opcjonalnie: odśwież dane z bazy aby upewnić się, że są zsynchronizowane
      await fetchUserPreferences();
    } catch (error) {
      console.error("Nieoczekiwany błąd:", error);
      alert("Wystąpił nieoczekiwany błąd podczas zapisywania");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="rounded-lg p-6">
        <p>Ładowanie danych użytkownika...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 rounded-lg p-6">
      <div>
        <h2 className="mb-2 text-xl font-semibold">Profil użytkownika</h2>
        <p className="text-gray-300">Email: {user?.email}</p>
        <div className="mt-3 flex justify-center">
          {user?.image ? (
            <Image
              src={user.image}
              alt={`Avatar użytkownika ${user.name || user.email}`}
              width={64}
              height={64}
              className="h-16 w-16 rounded-full border-2 border-gray-300 object-cover"
            />
          ) : (
            <div className="flex h-16 w-16 items-center justify-center rounded-full border-2 border-gray-300 bg-gray-600 text-white">
              <span className="text-lg font-semibold">
                {user?.name
                  ? user.name
                      .split(" ")
                      .map((n) => n[0])
                      .join("")
                      .toUpperCase()
                      .slice(0, 2)
                  : user?.email
                    ? user.email[0].toUpperCase()
                    : "?"}
              </span>
            </div>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <label className="flex items-center space-x-2">
          <input
            type="checkbox"
            checked={checkboxValue === 1}
            onChange={(e) => handleCheckboxChange(e.target.checked ? 1 : 0)}
            disabled={saving}
            className="h-4 w-4 rounded border-gray-300 bg-gray-100 text-blue-600 focus:ring-blue-500"
          />
          <span className="text-sm font-medium text-gray-300">
            Opcja użytkownika {saving && "(zapisywanie...)"}
          </span>
        </label>
        <p className="text-xs text-gray-400">
          Aktualna wartość: {checkboxValue}
        </p>
      </div>

      <button
        onClick={() => signOut()}
        className="rounded-lg bg-red-600 px-4 py-2 text-white transition-colors hover:bg-red-700"
      >
        Wyloguj się
      </button>
    </div>
  );
}
