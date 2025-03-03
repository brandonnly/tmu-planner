import { createFileRoute, Link } from "@tanstack/react-router";
import { AcademicPlanner } from "@/components/academic-planner";

import { Button } from "@/components/ui/button";
import { useEffect, useState, createContext, useContext } from "react";
import { supabase } from "@/lib/supabase";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { User } from "@supabase/supabase-js";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LogOut } from "lucide-react";
import { toast } from "sonner";
import { getCachedImage, revokeObjectURL } from "@/lib/utils";
import { Menu } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
	DndContext,
	useSensors,
	useSensor,
	PointerSensor,
	DragOverlay,
} from "@dnd-kit/core";
import type { Course } from "@/types/course";
import { CourseCard } from "@/components/course-card";
import { ThemeToggle } from "@/components/theme-toggle";
import { useDroppable } from "@dnd-kit/core";

// Add 'type' keyword to type-only imports
import type { DragStartEvent, DragEndEvent } from "@dnd-kit/core";

export const Route = createFileRoute("/")({
	component: Index,
});

function UserMenu({ user }: { user: User }) {
	const [avatarUrl, setAvatarUrl] = useState<string>(
		user.user_metadata.picture,
	);

	// biome-ignore lint/correctness/useExhaustiveDependencies: if you depend on avatar, it will loop infinitely because its changing from cached image
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
	const [searchResults, setSearchResults] = useState<Course[]>([]);
	const [isLoading, setIsLoading] = useState(false);
	const { setNodeRef, isOver } = useDroppable({
		id: "sidebar",
	});

	useEffect(() => {
		const searchCourses = async () => {
			if (!search.trim()) {
				setSearchResults(courses);
				return;
			}

			setIsLoading(true);
			try {
				const { data, error } = await supabase.rpc("search_courses", {
					search_query: search.trim(),
				});

				if (error) {
					console.error("Error searching courses:", error);
					toast.error("Failed to search courses");
					return;
				}

				if (!data) {
					setSearchResults([]);
					return;
				}

				setSearchResults(
					data.map((course) => ({
						id: course.id,
						courseCode: course.code,
						courseName: course.name,
					})),
				);
			} catch (error) {
				console.error("Error searching courses:", error);
				toast.error("Failed to search courses");
			} finally {
				setIsLoading(false);
			}
		};

		const debounceTimeout = setTimeout(searchCourses, 300);
		return () => clearTimeout(debounceTimeout);
	}, [search, courses]);

	// Create a stable array of skeleton items to avoid key warnings
	const skeletonItems = Array.from({ length: 3 }, (_, i) => ({
		id: `loading-skeleton-${i}`,
	}));

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
					{isLoading
						? // Show loading skeletons
							skeletonItems.map((item) => (
								<div
									key={item.id}
									className="bg-card text-card-foreground rounded-xl border shadow-sm p-4 relative"
								>
									<div className="space-y-1">
										<div className="h-5 w-24 bg-muted animate-pulse rounded" />
										<div className="h-4 w-48 bg-muted animate-pulse rounded" />
									</div>
								</div>
							))
						: search.trim()
							? searchResults.map((course) => (
									<CourseCard
										key={course.id}
										id={course.id}
										courseCode={course.courseCode}
										courseName={course.courseName}
									/>
								))
							: courses.map((course) => (
									<CourseCard
										key={course.id}
										id={course.id}
										courseCode={course.courseCode}
										courseName={course.courseName}
									/>
								))}
				</div>
			</div>
			<div className="p-4 border-t">
				<div className="flex items-center justify-center gap-4">
					<Link to="/privacy">
						<Button variant="link" size="sm">
							Privacy Policy
						</Button>
					</Link>
					<Link to="/tos">
						<Button variant="link" size="sm">
							Terms of Service
						</Button>
					</Link>
				</div>
			</div>
		</div>
	);
}

// --- Context Definitions (Moved from __root.tsx) ---
interface SidebarContextType {
	isOpen: boolean;
	setIsOpen: (open: boolean) => void;
}

export const SidebarContext = createContext<SidebarContextType>({
	isOpen: false,
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
export const useDrag = () => useContext(DragContext); // Added useDrag

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
export const useSemesters = () => useContext(SemesterContext); // Added useSemesters

interface CourseContextType {
	courses: Course[];
	setCourses: React.Dispatch<React.SetStateAction<Course[]>>;
}

export const CourseContext = createContext<CourseContextType>({
	courses: [],
	setCourses: () => {},
});
export const useCourses = () => useContext(CourseContext); // Added useCourses

// --- End Context Definitions ---

function Index() {
	const [sidebarOpen, setSidebarOpen] = useState(true);
	const [activeCourse, setActiveCourse] = useState<Course | null>(null);
	const [courses] = useState<Course[]>([]);
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
		<CourseContext.Provider value={{ courses, setCourses: () => {} }}>
			<SemesterContext.Provider value={{ semesterCourses, setSemesterCourses }}>
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
											<AcademicPlanner
												semesterCourses={semesterCourses}
												courses={courses}
											/>
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
	);
}
