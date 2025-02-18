import { Outlet, createRootRoute } from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/router-devtools";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import { Turnstile } from "@marsidev/react-turnstile";
import { useEffect, useState, createContext, useContext } from "react";
import { supabase } from "@/lib/supabase";
import { GoogleIcon } from "@/components/icons/google";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { User } from "@supabase/supabase-js";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LogOut } from "lucide-react";
import { Toaster, toast } from "sonner";
import { getCachedImage, revokeObjectURL } from "@/lib/utils";
import posthog from "posthog-js";
import { PostHogProvider } from "posthog-js/react";
import { Menu } from "lucide-react";
import { Input } from "@/components/ui/input";
import { DndContext } from "@dnd-kit/core";
import type { Course } from "@/types/course";
import { CourseCard } from "@/components/course-card";
import { ThemeProvider } from "@/components/theme-provider";

// Initialize PostHog at the top level
if (import.meta.env.VITE_POSTHOG_KEY) {
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

function UserMenu({ user }: { user: User }) {
	const [avatarUrl, setAvatarUrl] = useState<string>(
		user.user_metadata.picture,
	);

	useEffect(() => {
		let isMounted = true;

		getCachedImage(user.user_metadata.picture, `avatar-${user.id}`)
			.then((url) => {
				if (isMounted) {
					// Clean up previous object URL if it exists
					if (avatarUrl?.startsWith("blob:")) {
						revokeObjectURL(avatarUrl);
					}
					setAvatarUrl(url);
				}
			})
			.catch(console.error);

		return () => {
			isMounted = false;
			// Clean up object URL when component unmounts
			if (avatarUrl?.startsWith("blob:")) {
				revokeObjectURL(avatarUrl);
			}
		};
	}, [user.user_metadata.picture, user.id, avatarUrl]);

	const handleSignOut = async () => {
		const { error } = await supabase.auth.signOut();
		if (error) {
			console.error("Error signing out:", error.message);
			toast.error("Failed to sign out");
		} else {
			toast.success("Signed out successfully");
		}
	};

	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<Button variant="ghost" className="gap-2 py-6">
					<Avatar className="h-8 w-8">
						<AvatarImage src={avatarUrl} alt={user.user_metadata.full_name} />
						<AvatarFallback>
							{user.user_metadata.full_name?.[0]?.toUpperCase()}
						</AvatarFallback>
					</Avatar>
					<span className="text-sm font-normal">
						{user.user_metadata.full_name}
					</span>
				</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent align="end">
				<DropdownMenuLabel>My Account</DropdownMenuLabel>
				<DropdownMenuSeparator />
				<DropdownMenuItem
					onClick={handleSignOut}
					className="text-red-600 dark:text-red-400"
				>
					<LogOut className="mr-2 h-4 w-4" />
					Sign out
				</DropdownMenuItem>
			</DropdownMenuContent>
		</DropdownMenu>
	);
}

function LoginDialog() {
	const [verified, setVerified] = useState(false);
	const [user, setUser] = useState<User | null>(null);

	useEffect(() => {
		// Get initial session
		supabase.auth.getSession().then(({ data: { session } }) => {
			setUser(session?.user ?? null);
		});

		// Listen for auth changes
		const {
			data: { subscription },
		} = supabase.auth.onAuthStateChange((_event, session) => {
			setUser(session?.user ?? null);
		});

		return () => subscription.unsubscribe();
	}, []);

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
			// Only show welcome toast when redirecting to Google
			// The actual success will be handled when we return
			toast.success("Redirecting to Google...");
		}
	};

	if (user) {
		return <UserMenu user={user} />;
	}

	return (
		<Dialog>
			<DialogTrigger asChild>
				<Button variant="outline">Login</Button>
			</DialogTrigger>
			<DialogContent className="sm:max-w-md">
				<DialogHeader>
					<DialogTitle>Login to TMU Planner</DialogTitle>
				</DialogHeader>
				<div className="flex flex-col items-center gap-6 py-4">
					<Turnstile
						siteKey={import.meta.env.VITE_TURNSTILE_SITE_KEY}
						onSuccess={() => setVerified(true)}
						onError={() => setVerified(false)}
						onExpire={() => setVerified(false)}
					/>
					<Button
						disabled={!verified}
						variant="outline"
						className="w-full bg-white hover:bg-gray-50 text-gray-900 font-medium border-gray-200"
						onClick={handleGoogleSignIn}
					>
						<GoogleIcon />
						<span>Sign in with Google</span>
					</Button>
				</div>
			</DialogContent>
		</Dialog>
	);
}

function CourseSidebar({ courses }: { courses: Course[] }) {
	const [search, setSearch] = useState("");

	const filteredCourses = courses.filter(
		(course) =>
			course.courseCode.toLowerCase().includes(search.toLowerCase()) ||
			course.courseName.toLowerCase().includes(search.toLowerCase()),
	);

	return (
		<div className="h-full flex flex-col">
			<div className="p-4">
				<Input
					placeholder="Search courses..."
					value={search}
					onChange={(e) => setSearch(e.target.value)}
					className="w-full"
				/>
			</div>
			<div className="flex-1 overflow-y-auto p-4">
				<div className="space-y-2">
					{filteredCourses.map((course) => (
						<CourseCard
							key={course.id}
							id={course.id}
							courseCode={course.courseCode}
							courseName={course.courseName}
						/>
					))}
				</div>
			</div>
		</div>
	);
}

interface CourseContextType {
	courses: Course[];
}

export const CourseContext = createContext<CourseContextType>({
	courses: [],
});
export const useCourses = () => useContext(CourseContext);

export const Route = createRootRoute({
	component: RootComponent,
});

function RootComponent() {
	const [sidebarOpen, setSidebarOpen] = useState(true);

	const exampleCourses: Course[] = [
		{ id: "1", courseCode: "CPS109", courseName: "Computer Science I" },
		{ id: "2", courseCode: "CPS209", courseName: "Computer Science II" },
		// ... rest of the courses
	];

	return (
		<ThemeProvider defaultTheme="system" storageKey="theme">
			<PostHogProvider client={posthog}>
				<CourseContext.Provider value={{ courses: exampleCourses }}>
					<DndContext>
						<div className="h-screen">
							<div
								className={`
									fixed top-0 left-0 h-screen w-[320px] border-r bg-background
									transition-transform duration-300
									${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
								`}
							>
								<CourseSidebar courses={exampleCourses} />
							</div>
							<div
								className={`
									h-screen flex flex-col
									transition-all duration-300
									${sidebarOpen ? "pl-[320px]" : "pl-0"}
								`}
							>
								<div className="flex gap-4 text-xl border-b p-4 items-center">
									<div className="font-bold text-xl flex items-center gap-3">
										<Button
											variant="ghost"
											size="icon"
											onClick={() => setSidebarOpen(!sidebarOpen)}
											className="h-8 w-8 p-0"
											type="button"
										>
											<Menu className="h-5 w-5" />
										</Button>
										<img
											src="/Logo.png"
											alt="TMU Planner Logo"
											className="h-8 w-8"
										/>
										TMU Planner
									</div>
									<div className="flex-1" />
									<LoginDialog />
									<ThemeToggle />
								</div>
								<div className="flex-1 min-h-0">
									<SidebarContext.Provider value={{ isOpen: sidebarOpen }}>
										<Outlet />
									</SidebarContext.Provider>
								</div>
							</div>
						</div>
					</DndContext>
				</CourseContext.Provider>
				<Toaster />
			</PostHogProvider>
		</ThemeProvider>
	);
}

interface SidebarContextType {
	isOpen: boolean;
}

export const SidebarContext = createContext<SidebarContextType>({
	isOpen: true,
});
export const useSidebar = () => useContext(SidebarContext);
