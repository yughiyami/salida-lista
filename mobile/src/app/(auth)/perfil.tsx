import { useState } from "react";
import { useRouter } from "expo-router";
import { getSupabaseClient } from "../../lib/supabase";
import { useSession, type UserProfile } from "../../features/auth/useSession";
import { AuthShell } from "../../ui/AuthShell";
import { Banner, Button, Card, Field } from "../../ui/kit";
import {
  mapAuthErrorMessage,
  validateDisplayName,
} from "../../features/auth/validation";

export default function ProfileSetupScreen() {
  const router = useRouter();
  const user = useSession((s) => s.user);
  const profile = useSession((s) => s.profile);
  const setProfile = useSession((s) => s.setProfile);
  const signOut = useSession((s) => s.signOut);

  const [displayName, setDisplayName] = useState(profile?.display_name ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSaveProfile = async () => {
    if (busy) return;
    setError(null);

    const validated = validateDisplayName(displayName);
    if (!validated.ok) {
      setError(validated.error);
      return;
    }

    if (!user?.id) {
      setError("Tu sesión expiró. Vuelve a iniciar sesión.");
      return;
    }

    setBusy(true);
    try {
      const supabase = getSupabaseClient();
      const { data, error: upsertError } = await supabase
        .from("profiles")
        .upsert(
          {
            id: user.id,
            display_name: validated.value,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "id" },
        )
        .select("id, display_name, avatar_url, created_at, updated_at")
        .single<UserProfile>();

      if (upsertError || !data) {
        setError(
          mapAuthErrorMessage(
            upsertError ?? new Error("No se pudo guardar el perfil."),
          ),
        );
        return;
      }

      setProfile(data);
      router.replace("/(tabs)/mapa");
    } catch (e) {
      setError(mapAuthErrorMessage(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthShell title="¿Cómo te llamamos?" subtitle="Así te verán las personas con quienes compartas tus círculos.">
      {error ? <Banner tone="danger">{error}</Banner> : null}
      <Card>
        <Field
          label="Nombre para mostrar (2 a 40 caracteres)"
          value={displayName}
          onChangeText={setDisplayName}
          editable={!busy}
          maxLength={40}
          placeholder="Ej. Ana Quispe"
          onSubmitEditing={() => void handleSaveProfile()}
        />
        <Button label="Guardar perfil" onPress={() => void handleSaveProfile()} loading={busy} />
        <Button label="Cerrar sesión" variant="ghost" disabled={busy} onPress={() => void signOut()} />
      </Card>
    </AuthShell>
  );
}
