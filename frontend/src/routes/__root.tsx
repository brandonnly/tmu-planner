import { Outlet, createRootRoute } from "@tanstack/react-router";
import { ThemeProvider } from "@/components/theme-provider";
import { PostHogProvider } from "posthog-js/react";
import posthog from "posthog-js";
import { Toaster } from "sonner";
import { SpringSummerProvider } from "@/components/spring-summer-provider";

// Initialize PostHog at the top level
if (import.meta.env.VITE_POSTHOG_KEY && import.meta.env.PROD) {
	posthog.init(import.meta.env.VITE_POSTHOG_KEY, {
		api_host: import.meta.env.VITE_POSTHOG_HOST || "https://app.posthog.com",
		// Set custom properties for the project
		loaded: (posthog) => {
			posthog.register({
				project_name: "TMU Planner",
			});
		},
	});
}

export const Route = createRootRoute({
	component: RootComponent,
});

function RootComponent() {
	return (
		<ThemeProvider defaultTheme="system" storageKey="theme">
			<PostHogProvider client={posthog}>
				<SpringSummerProvider>
					<Outlet />
					<Toaster />
				</SpringSummerProvider>
			</PostHogProvider>
		</ThemeProvider>
	);
}
