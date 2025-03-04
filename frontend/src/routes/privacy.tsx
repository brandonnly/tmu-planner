import {
	createFileRoute,
	Link,
	useSearch,
	useNavigate,
} from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { ChevronLeft } from "lucide-react";

export const Route = createFileRoute("/privacy")({
	component: PrivacyPage,
	validateSearch: (search: Record<string, unknown>) => {
		return {
			from: search.from as string | undefined,
		};
	},
});

function PrivacyPage() {
	const { from } = useSearch({ from: "/privacy" });
	const navigate = useNavigate();

	// Handle navigation back
	const handleBackClick = () => {
		if (from === "login") {
			// Navigate back to index with login modal open
			const url = new URL(window.location.origin);
			url.searchParams.set("login", "true");
			window.location.href = url.toString();
		} else {
			// Navigate back to index using the same approach
			window.location.href = window.location.origin;
		}
	};

	const backText = from === "login" ? "Back to Login" : "Back to TMU Planner";

	return (
		<div className="min-h-screen bg-background flex flex-col">
			<nav className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
				<div className="container flex h-14 items-center pl-6">
					<Button variant="ghost" size="sm" onClick={handleBackClick}>
						<ChevronLeft className="h-4 w-4" />
						{backText}
					</Button>
				</div>
			</nav>

			<main className="flex-1 flex items-center justify-center">
				<div className="w-full max-w-2xl px-4 py-6 md:py-12">
					<div className="space-y-8">
						<div className="space-y-2">
							<h1 className="scroll-m-20 text-4xl font-extrabold tracking-tight lg:text-5xl">
								Privacy Policy
							</h1>
							<p className="text-xl text-muted-foreground">
								TMU Planner is an open-source project created by{" "}
								<a
									href="https://brndn.ly"
									target="_blank"
									rel="noopener noreferrer"
									className="font-medium underline underline-offset-4"
								>
									Brandon Ly
								</a>{" "}
								to help students plan their degrees more easily.
							</p>
							<p className="text-sm text-muted-foreground">
								Last updated: February 19, 2025
							</p>
						</div>

						<section className="space-y-4">
							<h2 className="scroll-m-20 border-b pb-2 text-3xl font-semibold tracking-tight first:mt-0">
								1. Information We Collect
							</h2>
							<p>We collect the following information:</p>
							<ul>
								<li>
									<strong>Course Planning Data:</strong> We store your course
									plans locally in your browser's storage. No personal
									information is collected if you only use local storage.
								</li>
								<li className="pt-2">
									<strong>Optional Cloud Sync Data:</strong> If you choose to
									sign in with a Google account, we store your course plans in
									our Supabase database. This data is associated with your
									Google account ID but does not require additional personal
									information.
								</li>
								<li className="pt-2">
									<strong>Usage Data:</strong> We may collect anonymous usage
									data to improve the Service. This may include information
									about how you interact with the Service, such as the pages you
									visit and the features you use. This data is anonymized and
									does not identify individual users.
								</li>
							</ul>
						</section>

						<section className="space-y-4">
							<h2 className="scroll-m-20 border-b pb-2 text-3xl font-semibold tracking-tight first:mt-0">
								2. How We Use Your Information
							</h2>
							<p>We use your information for the following purposes:</p>
							<ul>
								<li>
									<strong>To provide the Service:</strong> We use your course
									planning data to allow you to create and manage your academic
									plans.
								</li>
								<li>
									<strong>To provide cloud sync (optional):</strong> If you
									choose to enable cloud sync, which requires explicit action on
									your part, we use your data to synchronize your plans across
									your devices.
								</li>
								<li>
									<strong>To improve the Service:</strong> We use anonymous
									usage data to analyze how users interact with the Service and
									to identify areas for improvement. This data is anonymized and
									does not identify individual users.
								</li>
							</ul>
						</section>

						<section className="space-y-4">
							<h2 className="scroll-m-20 border-b pb-2 text-3xl font-semibold tracking-tight first:mt-0">
								3. How We Share Your Information
							</h2>
							<p>
								We do not share your personal information with third parties. We
								do not sell or give out your information to any third parties.
							</p>
							<ul>
								<li>
									We may disclose your information if required to do so by law
									or in response to a valid legal request.
								</li>
							</ul>
						</section>

						<section className="space-y-4">
							<h2 className="scroll-m-20 border-b pb-2 text-3xl font-semibold tracking-tight first:mt-0">
								4. Data Security
							</h2>
							<p>
								We take reasonable measures to protect user data. Data is
								encrypted in transit and at rest. Our project uses AWS data
								centers that are located in Canada, and are subject to Canadian
								privacy laws.
							</p>
						</section>

						<section className="space-y-4">
							<h2 className="scroll-m-20 border-b pb-2 text-3xl font-semibold tracking-tight first:mt-0">
								5. Your Rights
							</h2>
							<p>
								You have the right to access, correct, or delete your personal
								data. You can request to delete your account and all associated
								data by contacting us through the channels listed below.
							</p>
						</section>

						<section className="space-y-4">
							<h2 className="scroll-m-20 border-b pb-2 text-3xl font-semibold tracking-tight first:mt-0">
								6. Changes to This Privacy Policy
							</h2>
							<p>
								We may update our Privacy Policy from time to time. We will
								notify you of any changes by posting the new Privacy Policy on
								this page.
							</p>
						</section>

						<section className="space-y-4">
							<h2 className="scroll-m-20 border-b pb-2 text-3xl font-semibold tracking-tight first:mt-0">
								7. Contact & Open Source
							</h2>
							<p>
								TMU Planner is an open-source project available on{" "}
								<a
									href="https://github.com/brandonnly/tmu-planner"
									target="_blank"
									rel="noopener noreferrer"
									className="font-medium underline underline-offset-4"
								>
									GitHub
								</a>
								. If you have any questions or concerns, you can reach out
								through GitHub issues or contact Brandon through his{" "}
								<a
									href="https://brndn.ly"
									target="_blank"
									rel="noopener noreferrer"
									className="font-medium underline underline-offset-4"
								>
									website
								</a>
								.
							</p>
						</section>
					</div>
				</div>
			</main>
		</div>
	);
}
