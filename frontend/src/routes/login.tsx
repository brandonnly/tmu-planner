import { createFileRoute } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Turnstile } from "@marsidev/react-turnstile";
import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { GoogleIcon } from "@/components/icons/google";
import { toast } from "sonner";
import posthog from "posthog-js";
import { useNavigate } from "@tanstack/react-router";
import { useTheme } from "@/components/theme-provider";

export const Route = createFileRoute("/login")({
	component: LoginPage,
});

function LoginPage() {
	const [verified, setVerified] = useState(false);
	const navigate = useNavigate();
	const { theme } = useTheme();
	console.log(theme);

	const getActualTheme = () => {
		if (theme === "system") {
			return window.matchMedia("(prefers-color-scheme: dark)").matches
				? "dark"
				: "light";
		}
		return theme;
	};

	const handleGoogleSignIn = async () => {
		posthog.capture("login_initiated", {});

		const { error, data } = await supabase.auth.signInWithOAuth({
			provider: "google",
			options: {
				queryParams: {
					access_type: "offline",
					prompt: "consent",
				},
			},
		});

		if (error) {
			posthog.capture("login_error", {
				error: error.message,
			});
			console.error("Error signing in with Google:", error.message);
			toast.error("Failed to sign in with Google");
		} else if (data.url) {
			posthog.capture("login_success", {});
			toast.success("Redirecting to Google...");
		}
	};

	return (
		<div className="fixed inset-0">
			<button
				type="button"
				className="fixed inset-0 bg-background/80 backdrop-blur-sm cursor-default"
				onClick={() => navigate({ to: "/" })}
				onKeyDown={(e) => {
					if (e.key === "Escape") navigate({ to: "/" });
				}}
				aria-label="Close login dialog"
			/>
			<div
				className="fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-6 shadow-lg sm:rounded-lg md:w-full"
				onClick={(e) => e.stopPropagation()}
				onKeyDown={(e) => e.stopPropagation()}
			>
				<div className="flex flex-col items-center gap-6">
					<h2 className="text-lg font-semibold">Login to TMU Planner</h2>
					<div className="h-[65px]">
						<Turnstile
							siteKey={import.meta.env.VITE_TURNSTILE_SITE_KEY}
							onSuccess={() => setVerified(true)}
							onError={() => setVerified(false)}
							onExpire={() => setVerified(false)}
							options={{
								theme: getActualTheme(),
							}}
						/>
					</div>
					<Button
						disabled={!verified}
						variant="outline"
						className="w-[300px] h-11 text-base gap-3 bg-white hover:bg-white text-gray-500 hover:text-gray-500 shadow-sm hover:shadow transition-shadow"
						onClick={handleGoogleSignIn}
					>
						<GoogleIcon />
						<span>Sign in with Google</span>
					</Button>
					<p className="text-xs text-muted-foreground text-center max-w-[300px]">
						By signing in, you agree to our{" "}
						<a href="/privacy" className="underline hover:text-primary">
							Privacy Policy
						</a>{" "}
						and{" "}
						<a href="/terms" className="underline hover:text-primary">
							Terms of Service
						</a>
					</p>
					<Button
						variant="ghost"
						className="absolute right-4 top-4"
						onClick={() => navigate({ to: "/" })}
					>
						✕
					</Button>
				</div>
			</div>
		</div>
	);
}
