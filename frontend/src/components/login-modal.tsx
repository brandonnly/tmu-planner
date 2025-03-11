import { Button } from "@/components/ui/button";
import { Turnstile } from "@marsidev/react-turnstile";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { GoogleIcon } from "@/components/icons/google";
import { toast } from "sonner";
import posthog from "posthog-js";
import { useTheme } from "@/components/theme-provider";
import { actions } from "@/state";

interface LoginModalProps {
	onClose: () => void;
}

export function LoginModal({ onClose }: LoginModalProps) {
	const [verified, setVerified] = useState(false);
	const { theme } = useTheme();

	// Add global keyboard event listener for Escape key
	useEffect(() => {
		const handleKeyDown = (e: KeyboardEvent) => {
			if (e.key === "Escape") {
				onClose();
			}
		};

		// Add event listener
		window.addEventListener("keydown", handleKeyDown);

		// Clean up
		return () => {
			window.removeEventListener("keydown", handleKeyDown);
		};
	}, [onClose]);

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
			// Initialize auth state after successful login
			actions.initAuth();
			toast.success("Redirecting to Google...");
		}
	};

	return (
		<div
			className="fixed inset-0 z-[100]"
			style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0 }}
		>
			{/* Semi-transparent overlay */}
			<div
				className="fixed inset-0 bg-background/60 backdrop-blur-md cursor-default"
				onClick={onClose}
				onKeyDown={(e) => {
					if (e.key === "Escape") onClose();
				}}
				tabIndex={0}
				role="button"
				aria-label="Close login dialog"
			/>
			{/* Modal content */}
			<div
				className="fixed left-[50%] top-[50%] z-[101] grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-6 shadow-lg sm:rounded-lg md:w-full"
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
						className="w-[300px] h-11 text-base gap-3 bg-white dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 dark:text-gray-300 hover:text-gray-700 dark:hover:text-white shadow-sm hover:shadow-md transition-all duration-200 border dark:border-gray-600 dark:hover:border-gray-500"
						onClick={handleGoogleSignIn}
					>
						<GoogleIcon />
						<span>Sign in with Google</span>
					</Button>
					<p className="text-xs text-muted-foreground text-center max-w-[300px]">
						By signing in, you agree to our{" "}
						<a
							href="/privacy?from=login"
							className="underline hover:text-primary"
						>
							Privacy Policy
						</a>{" "}
						and{" "}
						<a href="/tos?from=login" className="underline hover:text-primary">
							Terms of Service
						</a>
					</p>
					<Button
						variant="ghost"
						className="absolute right-4 top-4"
						onClick={onClose}
					>
						✕
					</Button>
				</div>
			</div>
		</div>
	);
}
