import { Outlet, createRootRoute, Link } from "@tanstack/react-router";
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
import {
	DndContext,
	useSensors,
	useSensor,
	PointerSensor,
	DragStartEvent,
	DragEndEvent,
	DragOverlay,
} from "@dnd-kit/core";
import type { Course } from "@/types/course";
import { CourseCard } from "@/components/course-card";
import { ThemeProvider } from "@/components/theme-provider";
import { useDroppable } from "@dnd-kit/core";

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
	}, [user.user_metadata.picture, user.id]);

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
				<DropdownMenuItem
					onClick={handleSignOut}
					className="text-destructive focus:bg-destructive focus:text-destructive-foreground"
				>
					<LogOut className="mr-2 h-4 w-4" />
					Sign out
				</DropdownMenuItem>
			</DropdownMenuContent>
		</DropdownMenu>
	);
}

function LoginButton() {
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

	if (user) {
		return <UserMenu user={user} />;
	}

	return (
		<Link to="/login">
			<Button variant="outline">Login</Button>
		</Link>
	);
}

function CourseSidebar({ courses }: { courses: Course[] }) {
	const [search, setSearch] = useState("");
	const { setNodeRef, isOver } = useDroppable({
		id: "sidebar",
	});

	const filteredCourses = courses.filter(
		(course) =>
			course.courseCode.toLowerCase().includes(search.toLowerCase()) ||
			course.courseName.toLowerCase().includes(search.toLowerCase()),
	);

	return (
		<div ref={setNodeRef} className="h-full flex flex-col">
			<div className="p-4">
				<Input
					placeholder="Search courses..."
					value={search}
					onChange={(e) => setSearch(e.target.value)}
					className="w-full"
				/>
			</div>
			<div
				className={`flex-1 overflow-y-auto p-4 transition-colors ${isOver ? "bg-muted/50" : ""}`}
			>
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

export const Route = createRootRoute({
	component: RootComponent,
});

interface SidebarContextType {
	isOpen: boolean;
	setIsOpen: (open: boolean) => void;
}

export const SidebarContext = createContext<SidebarContextType>({
	isOpen: true,
	setIsOpen: () => {},
});
export const useSidebar = () => useContext(SidebarContext);

interface DragContextType {
	handleDragStart: (event: DragStartEvent) => void;
	handleDragEnd: (event: DragEndEvent) => void;
}

export const DragContext = createContext<DragContextType>({
	handleDragStart: () => {},
	handleDragEnd: () => {},
});
export const useDrag = () => useContext(DragContext);

interface SemesterContextType {
	semesterCourses: Record<string, Course[]>;
	setSemesterCourses: React.Dispatch<
		React.SetStateAction<Record<string, Course[]>>
	>;
}

export const SemesterContext = createContext<SemesterContextType>({
	semesterCourses: {},
	setSemesterCourses: () => {},
});
export const useSemesters = () => useContext(SemesterContext);

function RootComponent() {
	const [sidebarOpen, setSidebarOpen] = useState(true);
	const [activeCourse, setActiveCourse] = useState<Course | null>(null);
	const [courses] = useState<Course[]>([
		{ id: "1", courseCode: "CPS109", courseName: "Computer Science I" },
		{ id: "2", courseCode: "CPS209", courseName: "Computer Science II" },
		{ id: "3", courseCode: "CPS305", courseName: "Data Structures" },
		{ id: "4", courseCode: "CPS393", courseName: "Introduction to C and UNIX" },
		{ id: "5", courseCode: "CPS400", courseName: "Computer Science III" },
		{ id: "6", courseCode: "CPS401", courseName: "Computer Science IV" },
		{ id: "7", courseCode: "CPS402", courseName: "Computer Science V" },
		{ id: "8", courseCode: "CPS403", courseName: "Computer Science VI" },
		{ id: "9", courseCode: "CPS404", courseName: "Computer Science VII" },
		{ id: "10", courseCode: "CPS405", courseName: "Computer Science VIII" },
	]);
	const [semesterCourses, setSemesterCourses] = useState<
		Record<string, Course[]>
	>({});

	const sensors = useSensors(
		useSensor(PointerSensor, {
			activationConstraint: {
				distance: 8,
			},
		}),
	);

	const handleDragStart = (event: DragStartEvent) => {
		const course = courses.find((c) => c.id === event.active.id);
		if (course) {
			setActiveCourse(course);
		}
	};

	const handleDragEnd = (event: DragEndEvent) => {
		const { active, over } = event;

		if (over && active.id !== over.id) {
			const course = courses.find((c) => c.id === active.id);
			if (!course) return;

			setSemesterCourses((prev) => {
				// Find which semester currently has the course
				let sourceSemester = "";
				for (const [semester, courses] of Object.entries(prev)) {
					if (courses.some((c) => c.id === active.id)) {
						sourceSemester = semester;
						break;
					}
				}

				// Create new state with all existing courses
				const newSemesterCourses = { ...prev };

				// Remove course from source semester if found
				if (sourceSemester) {
					newSemesterCourses[sourceSemester] = prev[sourceSemester].filter(
						(c) => c.id !== active.id,
					);
				}

				// If dropping to sidebar, just remove from semester
				if (over.id === "sidebar") {
					return newSemesterCourses;
				}

				// Add course to target semester
				const targetSemester = over.id as string;
				newSemesterCourses[targetSemester] = [
					...(newSemesterCourses[targetSemester] || []),
					course,
				];

				return newSemesterCourses;
			});
		}
		setActiveCourse(null);
	};

	// Get all courses that are in semesters
	const coursesInSemesters = new Set(
		Object.values(semesterCourses)
			.flat()
			.map((course) => course.id),
	);

	// Filter out courses that are already in semesters for the sidebar
	const availableCourses = courses.filter(
		(course) => !coursesInSemesters.has(course.id),
	);

	return (
		<ThemeProvider defaultTheme="system" storageKey="theme">
			<PostHogProvider client={posthog}>
				<CourseContext.Provider value={{ courses, setCourses: () => {} }}>
					<SemesterContext.Provider
						value={{ semesterCourses, setSemesterCourses }}
					>
						<SidebarContext.Provider
							value={{ isOpen: sidebarOpen, setIsOpen: setSidebarOpen }}
						>
							<DragContext.Provider value={{ handleDragStart, handleDragEnd }}>
								<DndContext
									sensors={sensors}
									onDragStart={handleDragStart}
									onDragEnd={handleDragEnd}
								>
									<div className="h-screen flex">
										<div
											className={`
												border-r bg-background
												transition-all duration-300
												${sidebarOpen ? "w-[320px] min-w-[320px]" : "w-0 min-w-0"}
											`}
										>
											<div
												className={`${sidebarOpen ? "w-[320px]" : "w-0"} h-full overflow-hidden`}
											>
												<CourseSidebar courses={availableCourses} />
											</div>
										</div>
										<div className="flex-1 flex flex-col min-w-0">
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
												<LoginButton />
												<ThemeToggle />
											</div>
											<div className="flex-1 min-h-0">
												<div className="h-full overflow-y-auto overflow-x-hidden scrollbar-gutter-stable [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-thumb]:bg-muted-foreground/20 hover:[&::-webkit-scrollbar-thumb]:bg-muted-foreground/25">
													<Outlet />
												</div>
											</div>
										</div>
									</div>
									<DragOverlay>
										{activeCourse ? (
											<div className="transform-none">
												<CourseCard
													id={activeCourse.id}
													courseCode={activeCourse.courseCode}
													courseName={activeCourse.courseName}
												/>
											</div>
										) : null}
									</DragOverlay>
								</DndContext>
							</DragContext.Provider>
						</SidebarContext.Provider>
					</SemesterContext.Provider>
				</CourseContext.Provider>
				<Toaster />
				{process.env.NODE_ENV === "development" && <TanStackRouterDevtools />}
			</PostHogProvider>
		</ThemeProvider>
	);
}

interface CourseContextType {
	courses: Course[];
	setCourses: React.Dispatch<React.SetStateAction<Course[]>>;
}

export const CourseContext = createContext<CourseContextType>({
	courses: [],
	setCourses: () => {},
});
export const useCourses = () => useContext(CourseContext);
