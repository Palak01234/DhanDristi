import { ArrowRight, LogIn, UserPlus } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { AuthShell } from "@/components/feature/AuthShell";
import { Button } from "@/components/base/Button";

export default function AuthChoice() {
  const navigate = useNavigate();

  return (
    <AuthShell
      eyebrow="Welcome"
      title="How would you like to continue?"
      subtitle="Choose an account path to get started with DhanDrishti."
      footer={
        <p className="text-sm text-foreground-600">
          You can change your voice and currency preferences later in Settings.
        </p>
      }
    >
      <div className="space-y-3">
        <Button
          type="button"
          size="xl"
          fullWidth
          onClick={() => navigate("/signup")}
          icon={<UserPlus aria-hidden="true" className="h-5 w-5" />}
          iconRight={<ArrowRight aria-hidden="true" className="h-5 w-5" />}
        >
          Create Account
        </Button>
        <Button
          type="button"
          size="xl"
          variant="outline"
          fullWidth
          onClick={() => navigate("/login")}
          icon={<LogIn aria-hidden="true" className="h-5 w-5" />}
          iconRight={<ArrowRight aria-hidden="true" className="h-5 w-5" />}
        >
          Log In
        </Button>
      </div>
    </AuthShell>
  );
}