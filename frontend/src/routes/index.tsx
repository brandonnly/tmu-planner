import { createFileRoute, Link } from "@tanstack/react-router";
import { AcademicPlanner } from "@/components/academic-planner";

import { Button } from "@/components/ui/button";
import {
	useEffect,
	useState,
	useMemo,
	useCallback,
	useRef,
	useContext,
} from "react";
import { supabase } from "@/lib/supabase";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import type { User } from "@supabase/supabase-js";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { LogOut, Menu, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { getCachedImage, revokeObjectURL } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import {
	DndContext,
	DragOverlay,
	PointerSensor,
	KeyboardSensor,
	useSensor,
	useSensors,
	pointerWithin,
	rectIntersection,
} from "@dnd-kit/core";
import type { CollisionDetection } from "@dnd-kit/core";
import { sortableKeyboardCoordinates, arrayMove } from "@dnd-kit/sortable";
import type { Course } from "@/types/course";
import { CourseCard, DraggableCourseCard } from "@/components/course-card";
import { ThemeToggle } from "@/components/theme-toggle";
import { useDroppable } from "@dnd-kit/core";

// Add 'type' keyword to type-only imports
import type { DragStartEvent, DragEndEvent } from "@dnd-kit/core";
import {
	CourseContext,
	DragContext,
	SemesterContext,
	SidebarContext,
} from "@/contexts";

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

function CourseSidebar({
	courses,
	searchResults,
	setSearchResults,
	activeCourse,
}: {
	courses: Course[];
	searchResults: Course[];
	setSearchResults: React.Dispatch<React.SetStateAction<Course[]>>;
	activeCourse: (Course & { isFromSidebar?: boolean }) | null;
}) {
	const [search, setSearch] = useState("");
	const [isLoading, setIsLoading] = useState(false);
	const { setNodeRef, isOver } = useDroppable({
		id: "sidebar",
		data: {
			type: "trash-zone",
			accepts: ["course-card"],
		},
	});
	const searchTimeoutRef = useRef<ReturnType<typeof setTimeout>>(null);
	const { semesterCourses } = useContext(SemesterContext);

	// Track if we're dragging from a semester
	const [showTrashIndicator, setShowTrashIndicator] = useState(false);

	// Update when drag state or active course changes
	useEffect(() => {
		// If not hovering or no active course, don't show the trash indicator
		if (!isOver || !activeCourse) {
			setShowTrashIndicator(false);
			return;
		}

		// Only show trash indicator if the course is being dragged from a semester (not from sidebar)
		setShowTrashIndicator(activeCourse.isFromSidebar === false);
	}, [isOver, activeCourse]);

	const performSearch = useCallback(
		async (value: string) => {
			const trimmedSearch = value.trim();

			if (!trimmedSearch) {
				setSearchResults(courses);
				return;
			}

			setIsLoading(true);
			try {
				const { data, error } = await supabase.rpc("search_courses", {
					search_query: trimmedSearch,
				});

				if (error) {
					console.error("Error searching courses:", error);
					toast.error("Failed to search courses");
					return;
				}

				const newResults = data
					? data.map((course) => ({
							id: course.id,
							courseCode: course.code,
							courseName: course.name,
						}))
					: [];

				setSearchResults(newResults);
			} catch (error) {
				console.error("Error searching courses:", error);
				toast.error("Failed to search courses");
			} finally {
				setIsLoading(false);
			}
		},
		[courses, setSearchResults],
	);

	const handleSearchChange = useCallback(
		(e: React.ChangeEvent<HTMLInputElement>) => {
			const value = e.target.value;
			setSearch(value);

			// Clear any existing timeout
			if (searchTimeoutRef.current) {
				clearTimeout(searchTimeoutRef.current);
			}

			// Clear results immediately if empty
			if (!value.trim()) {
				setSearchResults(courses);
				return;
			}

			// Set new timeout
			searchTimeoutRef.current = setTimeout(() => {
				performSearch(value);
			}, 300);
		},
		[courses, performSearch, setSearchResults],
	);

	// Cleanup timeout on unmount
	useEffect(() => {
		return () => {
			if (searchTimeoutRef.current) {
				clearTimeout(searchTimeoutRef.current);
			}
		};
	}, []);

	const skeletonItems = Array.from({ length: 3 }, (_, i) => ({
		id: `loading-skeleton-${i}`,
	}));

	const displayedCourses = useMemo(() => {
		return search.trim() ? searchResults : courses;
	}, [search, searchResults, courses]);

	return (
		<div ref={setNodeRef} className="h-full flex flex-col">
			<div className="p-4 border-b">
				<Input
					placeholder="Search courses..."
					value={search}
					onChange={handleSearchChange}
					className="w-full"
				/>
			</div>
			<div className="flex-1 min-h-0 relative">
				{/* Trash overlay - only shown when dragging from planner and hovering over sidebar content */}
				{showTrashIndicator && (
					<div className="absolute inset-0 bg-gradient-to-br from-red-500/20 to-red-600/30 flex flex-col items-center justify-center z-10 pointer-events-none backdrop-blur-[1px] transition-all duration-200 ease-in-out">
						<Trash2 className="h-16 w-16 text-red-500 drop-shadow-md animate-pulse" />
						<span className="mt-2 text-red-600 font-medium text-sm">
							Drop to Remove
						</span>
					</div>
				)}
				<div
					className={`h-full overflow-y-auto overflow-x-hidden p-4 transition-all duration-200
						[&::-webkit-scrollbar-horizontal]:hidden 
						[scrollbar-width:thin] 
						[scrollbar-gutter:stable]
						[&::-webkit-scrollbar]:w-2 
						[&::-webkit-scrollbar-thumb]:bg-muted-foreground/20 
						hover:[&::-webkit-scrollbar-thumb]:bg-muted-foreground/25
						${showTrashIndicator ? "bg-red-500/5" : isOver ? "bg-muted/20" : ""}`}
				>
					<div className="space-y-2 w-full">
						{isLoading
							? skeletonItems.map((item) => (
									<div
										key={item.id}
										className="bg-card text-card-foreground rounded-xl border shadow-sm p-4 relative w-full"
									>
										<div className="space-y-1">
											<div className="h-5 w-24 bg-muted animate-pulse rounded" />
											<div className="h-4 w-48 bg-muted animate-pulse rounded" />
										</div>
									</div>
								))
							: displayedCourses.map((course) => (
									<DraggableCourseCard
										key={course.id}
										id={course.id}
										courseCode={course.courseCode}
										courseName={course.courseName}
									/>
								))}
					</div>
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

function Index() {
	const [sidebarOpen, setSidebarOpen] = useState(true);
	const [activeCourse, setActiveCourse] = useState<
		(Course & { isFromSidebar?: boolean }) | null
	>(null);
	const [courses] = useState<Course[]>([]);
	const [searchResults, setSearchResults] = useState<Course[]>([]);
	const [semesterCourses, setSemesterCourses] = useState<
		Record<string, Course[]>
	>({});

	const sensors = useSensors(
		useSensor(PointerSensor, {
			activationConstraint: {
				distance: 8,
			},
		}),
		useSensor(KeyboardSensor, {
			coordinateGetter: sortableKeyboardCoordinates,
		}),
	);

	const handleDragStart = useCallback(
		(event: DragStartEvent) => {
			const { active } = event;

			// Try to find the course in any semester first
			const isFromSidebar = (() => {
				// Check if the course is in the sidebar (main courses or search results)
				const sidebarCourse =
					courses.find((c) => c.id === active.id) ||
					(searchResults.length > 0
						? searchResults.find((c) => c.id === active.id)
						: undefined);

				if (sidebarCourse) {
					setActiveCourse({ ...sidebarCourse, isFromSidebar: true });
					return true;
				}

				// If not in sidebar, check semesters
				for (const courses of Object.values(semesterCourses)) {
					const semesterCourse = courses.find((c) => c.id === active.id);
					if (semesterCourse) {
						setActiveCourse({ ...semesterCourse, isFromSidebar: false });
						return false;
					}
				}
				return false;
			})();
		},
		[courses, searchResults, semesterCourses],
	);

	const handleDragEnd = useCallback(
		(event: DragEndEvent) => {
			const { active, over } = event;

			if (!over || !activeCourse) {
				setActiveCourse(null);
				return;
			}

			// Determine the semester ID by checking the data type
			const overId = over.id;
			const overData = over.data.current;

			// Check if we're dropping onto a semester column or a course
			const targetSemesterId = (() => {
				// If directly dropping on a semester column, use its ID
				if (overData?.type === "semester-column") {
					return overId as string;
				}

				// If dropping on a course card, find its semester
				for (const [semesterId, courses] of Object.entries(semesterCourses)) {
					if (courses.some((c) => c.id === overId)) {
						return semesterId;
					}
				}

				// Default case - sidebar or invalid target
				return null;
			})();

			// If dropping to sidebar, handle that case
			if (overId === "sidebar" && !activeCourse.isFromSidebar) {
				// Find source semester
				const sourceSemesterId = (() => {
					for (const [semester, courses] of Object.entries(semesterCourses)) {
						if (courses.some((c) => c.id === active.id)) {
							return semester;
						}
					}
					return null;
				})();

				if (sourceSemesterId) {
					setSemesterCourses((prev) => ({
						...prev,
						[sourceSemesterId]: prev[sourceSemesterId].filter(
							(c) => c.id !== active.id,
						),
					}));
				}
				setActiveCourse(null);
				return;
			}

			// If we didn't find a valid target semester, do nothing
			if (!targetSemesterId) {
				setActiveCourse(null);
				return;
			}

			setSemesterCourses((prev) => {
				const newSemesterCourses = { ...prev };

				// Find source semester
				const sourceSemesterId = (() => {
					if (activeCourse.isFromSidebar) return null;

					for (const [semesterId, courses] of Object.entries(prev)) {
						if (courses.some((c) => c.id === active.id)) {
							return semesterId;
						}
					}
					return null;
				})();

				// If dragging between semesters, remove from source
				if (sourceSemesterId && !activeCourse.isFromSidebar) {
					newSemesterCourses[sourceSemesterId] = prev[sourceSemesterId].filter(
						(c) => c.id !== active.id,
					);
				}

				// Initialize target semester if it doesn't exist
				if (!(targetSemesterId in newSemesterCourses)) {
					newSemesterCourses[targetSemesterId] = [];
				}

				// If source and target are the same, handle reordering
				if (
					sourceSemesterId === targetSemesterId &&
					!activeCourse.isFromSidebar
				) {
					const oldIndex = prev[targetSemesterId].findIndex(
						(c) => c.id === active.id,
					);

					// If dropping on a course, find its position
					const newIndex = (() => {
						const overIndex = prev[targetSemesterId].findIndex(
							(c) => c.id === overId,
						);

						// If dropping directly on a course
						if (overIndex !== -1) {
							// Insert after the course we dropped on
							return overIndex < oldIndex ? overIndex : overIndex;
						}

						// If dropping on the semester itself, add to the end
						return prev[targetSemesterId].length - 1;
					})();

					if (oldIndex !== -1 && newIndex !== -1) {
						newSemesterCourses[targetSemesterId] = arrayMove(
							prev[targetSemesterId],
							oldIndex,
							Math.min(newIndex, prev[targetSemesterId].length - 1),
						);
						return newSemesterCourses;
					}
				}

				// Create a new course object with a unique ID if coming from sidebar
				const courseToAdd = activeCourse.isFromSidebar
					? {
							...activeCourse,
							id: `${activeCourse.courseCode}-${Date.now()}`,
						}
					: activeCourse;

				// Handle dropping onto a different semester
				// If dropping onto a course, find its position
				const overIndex = newSemesterCourses[targetSemesterId].findIndex(
					(c) => c.id === overId,
				);

				if (overIndex !== -1) {
					// If dropping onto a course, insert after it
					newSemesterCourses[targetSemesterId].splice(
						overIndex + 1,
						0,
						courseToAdd,
					);
				} else {
					// If dropping directly on the semester, add to the end
					newSemesterCourses[targetSemesterId].push(courseToAdd);
				}

				return newSemesterCourses;
			});

			setActiveCourse(null);
		},
		[activeCourse, semesterCourses],
	);

	// Get all courses that are in semesters
	const coursesInSemesters = useMemo(
		() =>
			new Set(
				Object.values(semesterCourses)
					.flat()
					.map((course) => course.id),
			),
		[semesterCourses],
	);

	// Custom collision detection that prioritizes semester columns
	const customCollisionDetection: CollisionDetection = useCallback((args) => {
		// First, find all intersecting droppable areas
		const pointerCollisions = pointerWithin(args);

		// Check for semester column collisions first
		const semesterCollisions = pointerCollisions.filter(
			(collision) =>
				collision.data?.droppable?.data?.type === "semester-column",
		);

		// If we found semester columns, prioritize them
		if (semesterCollisions.length > 0) {
			return semesterCollisions;
		}

		// Otherwise, use the standard collisions
		return pointerCollisions.length > 0
			? pointerCollisions
			: rectIntersection(args);
	}, []);

	return (
		<CourseContext.Provider value={{ courses, setCourses: () => {} }}>
			<SemesterContext.Provider value={{ semesterCourses, setSemesterCourses }}>
				<SidebarContext.Provider
					value={{ isOpen: sidebarOpen, setIsOpen: setSidebarOpen }}
				>
					<DragContext.Provider value={{ handleDragStart, handleDragEnd }}>
						<DndContext
							sensors={sensors}
							collisionDetection={customCollisionDetection}
							onDragStart={handleDragStart}
							onDragEnd={handleDragEnd}
						>
							<div className="h-screen flex">
								<div
									className={`
										border-r bg-background
										transition-all duration-300
										${sidebarOpen ? "w-[320px] flex-none" : "w-0"}
									`}
								>
									<div
										className={`${sidebarOpen ? "w-[320px] flex-none" : "w-0"} h-full`}
									>
										<CourseSidebar
											courses={courses}
											searchResults={searchResults}
											setSearchResults={setSearchResults}
											activeCourse={activeCourse}
										/>
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
									<CourseCard
										id={activeCourse.id}
										courseCode={activeCourse.courseCode}
										courseName={activeCourse.courseName}
									/>
								) : null}
							</DragOverlay>
						</DndContext>
					</DragContext.Provider>
				</SidebarContext.Provider>
			</SemesterContext.Provider>
		</CourseContext.Provider>
	);
}
