import { createFileRoute, Link, useSearch } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { ChevronLeft } from "lucide-react";

export const Route = createFileRoute("/tos")({
	component: TOSPage,
	validateSearch: (search: Record<string, unknown>) => {
		return {
			from: search.from as string | undefined,
		};
	},
});

function TOSPage() {
	const { from } = useSearch({ from: "/tos" });

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
								Terms of Service
							</h1>
							<p className="text-xl text-muted-foreground">
								By using TMU Planner, you agree to the following terms of
								service.
							</p>
							<p className="text-sm text-muted-foreground border-b pb-4">
								Last updated: February 19, 2025
							</p>
						</div>

						<section className="space-y-4">
							<h2 className="scroll-m-20 pb-2 text-3xl font-semibold tracking-tight first:mt-0">
								1. Project Overview
							</h2>
							<p>
								TMU Planner is a personal project by{" "}
								<a
									href="https://brndn.ly"
									target="_blank"
									rel="noopener noreferrer"
									className="font-medium underline underline-offset-4"
								>
									Brandon Ly
								</a>
								, and I created it to solve the challenge of degree planning at
								TMU. This isn't a commercial service or legal entity; it's an
								open-source tool available on{" "}
								<a
									href="https://github.com/brandonnly/tmu-planner"
									target="_blank"
									rel="noopener noreferrer"
									className="font-medium underline underline-offset-4"
								>
									GitHub
								</a>
								.
							</p>
						</section>

						<section>
							<h2 className="text-2xl font-semibold tracking-tight mt-8 mb-4">
								2. Description of Service
							</h2>
							<p>
								TMU Planner is a visual degree planning tool for Toronto
								Metropolitan University students. It allows you to plan your
								courses semester by semester, track degree requirements, and
								manage your academic progress.
							</p>
							<p className="font-bold pt-2">
								TMU Planner is not officially affiliated with Toronto
								Metropolitan University.
							</p>
						</section>

						<section>
							<h2 className="text-2xl font-semibold tracking-tight mt-8 mb-4">
								3. Data Accuracy and Disclaimer
							</h2>
							<p>
								I provide course and program information scraped from the
								Toronto Metropolitan University academic calendar. I try to keep
								the information up to date and accurate. However, I can't
								guarantee that everything is perfect. I'm not liable for any
								issues resulting from inaccuracies, so using the service is at
								your own risk. Please always double check the information with
								the official academic calendar and program plans.
							</p>
							<p className="pt-2">
								TMU Planner supports historical curriculum data back to
								2016-2017, but there may be limitations in checking historical
								curriculum.
							</p>
						</section>

						<section>
							<h2 className="text-2xl font-semibold tracking-tight mt-8 mb-4">
								4. User Accounts and Data
							</h2>
							<p>
								By default degree plans are saved locally in your browser
								storage. Should you sign in with a Google account, your degree
								plans will be synced and stored in the cloud.
							</p>
						</section>

						<section>
							<h2 className="text-2xl font-semibold tracking-tight mt-8 mb-4">
								5. Data Security
							</h2>
							<p>
								I take reasonable measures to protect your data, including
								industry standard practices. Your data is stored locally in the
								browser, unless you make an account, in which it is synced to
								the cloud via Supabase.
							</p>
							<p className="pt-2">
								This data is stored on data centres located in Canada and are
								subject to Canadian privacy laws, and Supabase's privacy policy
								and terms of service.
							</p>
						</section>

						<section>
							<h2 className="text-2xl font-semibold tracking-tight mt-8 mb-4">
								6. Intellectual Property and Licensing
							</h2>
							<p>
								I retain all intellectual property rights to TMU Planner itself.
								The code is shared under the MIT License, which means you are
								free to use, modify, and distribute the code, even for
								commercial purposes. See the{" "}
								<a
									href="https://github.com/brandonnly/tmu-planner/blob/main/LICENSE"
									target="_blank"
									rel="noopener noreferrer"
									className="font-medium underline underline-offset-4"
								>
									LICENSE
								</a>{" "}
								file for more details.
							</p>
							<p className="pt-2">
								However, all course data, program information, and other content
								scraped from the Toronto Metropolitan University website are the
								copyright of Toronto Metropolitan University.
							</p>
						</section>

						<section>
							<h2 className="text-2xl font-semibold tracking-tight mt-8 mb-4">
								7. Changes to Terms
							</h2>
							<p>I can modify or replace these Terms at any time.</p>
						</section>

						<section className="space-y-4">
							<h2 className="scroll-m-20 pb-2 text-2xl font-semibold tracking-tight first:mt-0">
								8. Contact & Open Source
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
								through GitHub issues or contact me through my{" "}
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
