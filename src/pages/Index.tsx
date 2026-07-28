import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Glassmorphism from "@/components/designs/Glassmorphism";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";

export default function Index() {
  const navigate = useNavigate();
  const [ready, setReady] = useState(false);
  const [authed, setAuthed] = useState(false);
  const [email, setEmail] = useState<string | null>(null);

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      setAuthed(!!session);
      setEmail(session?.user.email ?? null);
    });
    supabase.auth.getSession().then(({ data }) => {
      setAuthed(!!data.session);
      setEmail(data.session?.user.email ?? null);
      setReady(true);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (ready && !authed) navigate("/auth", { replace: true });
  }, [ready, authed, navigate]);

  if (!ready || !authed) {
    return (
      <main className="min-h-screen flex items-center justify-center text-muted-foreground">
        Loading…
      </main>
    );
  }

  return (
    <div className="relative">
      <div className="absolute right-4 top-4 z-50 flex items-center gap-2 text-xs text-muted-foreground bg-background/70 backdrop-blur px-3 py-1.5 rounded-full border">
        <span>{email}</span>
        <Button
          variant="ghost"
          size="sm"
          className="h-6 px-2"
          onClick={async () => {
            await supabase.auth.signOut();
            navigate("/auth", { replace: true });
          }}
        >
          Sign out
        </Button>
      </div>
      <Glassmorphism />
    </div>
  );
}
