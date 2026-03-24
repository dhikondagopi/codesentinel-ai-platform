import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { ShieldCheck } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

export default function AuthPage() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, loading: authLoading } = useAuth();

  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");

  // ⭐ AUTO REDIRECT IF ALREADY LOGGED
  useEffect(() => {
    if (!authLoading && user) {
      navigate("/dashboard");
    }
  }, [user, authLoading]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) throw error;

        // ⭐ REDIRECT TO DASHBOARD
        navigate("/dashboard");
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              display_name: name || email.split("@")[0],
            },
          },
        });

        if (error) throw error;

        toast({
          title: "Account created",
          description: "Please verify your email before login.",
        });

        setIsLogin(true);
      }
    } catch (err: any) {
      toast({
        title: "Authentication error",
        description: err.message,
        variant: "destructive",
      });
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen flex">
      {/* LEFT PANEL */}
      <div className="hidden lg:flex w-1/2 bg-gradient-to-br from-slate-900 to-black text-white p-12 flex-col justify-center">
        <div className="max-w-md">
          <ShieldCheck className="h-12 w-12 text-emerald-400 mb-6" />

          <h1 className="text-4xl font-bold leading-tight">
            CodeSentinel Platform
          </h1>

          <p className="text-slate-300 mt-4 text-lg">
            Intelligent security & quality monitoring for modern teams.
          </p>
        </div>
      </div>

      {/* LOGIN FORM */}
      <div className="flex-1 flex items-center justify-center bg-background p-6">
        <div className="w-full max-w-md border rounded-xl p-8 shadow-sm">
          <h2 className="text-2xl font-bold mb-2">
            {isLogin ? "Sign in" : "Create account"}
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <div>
                <Label>Name</Label>
                <Input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
            )}

            <div>
              <Label>Email</Label>
              <Input
                required
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div>
              <Label>Password</Label>
              <Input
                required
                type="password"
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <Button className="w-full" disabled={loading}>
              {loading ? "Please wait..." : isLogin ? "Login" : "Register"}
            </Button>
          </form>

          <p className="text-xs text-center mt-6 text-muted-foreground">
            {isLogin ? (
              <>
                Don’t have account?{" "}
                <button
                  onClick={() => setIsLogin(false)}
                  className="text-primary"
                >
                  Create account
                </button>
              </>
            ) : (
              <>
                Already registered?{" "}
                <button
                  onClick={() => setIsLogin(true)}
                  className="text-primary"
                >
                  Login
                </button>
              </>
            )}
          </p>
        </div>
      </div>
    </div>
  );
}