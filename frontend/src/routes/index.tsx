import {
	createFileRoute,
	Link,
	useSearch,
	useNavigate,
} from "@tanstack/react-router";
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

import { Menu, Trash2, X } from "lucide-react";
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
import { LoginModal } from "@/components/login-modal";
import { PlanSelector } from "@/components/plan-selector";

export const Route = createFileRoute("/")({
	component: Index,
	validateSearch: (search: Record<string, unknown>) => {
		return {
			q: search.q as string | undefined,
			login: search.login as boolean | undefined,
		};
	},
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

	return (
		<div className="flex items-center gap-2">
			<Avatar className="h-8 w-8">
				<AvatarImage src={avatarUrl} alt={user.user_metadata.full_name} />
				<AvatarFallback>
					{user.user_metadata.full_name?.[0]?.toUpperCase()}
				</AvatarFallback>
			</Avatar>
			<span className="text-sm font-normal">
				{user.user_metadata.full_name}
			</span>
		</div>
	);
}

function LoginButton() {
	const [user, setUser] = useState<User | null>(null);
	const navigate = useNavigate();

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
		<Button
			variant="outline"
			onClick={() => {
				// Use window.location to avoid TanStack Router type issues
				const url = new URL(window.location.href);
				url.searchParams.set("login", "true");
				window.history.pushState({}, "", url.toString());
				// Force a re-render
				window.dispatchEvent(new Event("popstate"));
			}}
		>
			Login
		</Button>
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
	const { q: searchParam = "" } = useSearch({ from: "/" });
	const [inputValue, setInputValue] = useState(searchParam);
	const navigate = useNavigate({ from: "/" });
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

	// Sync input value with search param when it changes from outside (e.g. navigation)
	useEffect(() => {
		setInputValue(searchParam);
	}, [searchParam]);

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

	// Effect to perform search when search param changes
	useEffect(() => {
		performSearch(searchParam);
	}, [searchParam, performSearch]);

	const handleSearchChange = useCallback(
		(e: React.ChangeEvent<HTMLInputElement>) => {
			const value = e.target.value;
			setInputValue(value);

			// Clear any existing timeout
			if (searchTimeoutRef.current) {
				clearTimeout(searchTimeoutRef.current);
			}

			// Set new timeout to update search params
			searchTimeoutRef.current = setTimeout(() => {
				navigate({
					search: (prev) => ({
						...prev,
						q: value || undefined,
					}),
					replace: true,
				});
			}, 300);
		},
		[navigate],
	);

	// Cleanup timeouts on unmount
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
		return searchParam.trim() ? searchResults : courses;
	}, [searchParam, searchResults, courses]);

	return (
		<div ref={setNodeRef} className="h-full flex flex-col">
			<div className="p-4 border-b">
				<div className="relative">
					<Input
						placeholder="Search for course..."
						value={inputValue}
						onChange={handleSearchChange}
						className="w-full pr-8"
						autoFocus
					/>
					{inputValue && (
						<Button
							variant="ghost"
							size="icon"
							className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 p-0 hover:bg-accent hover:text-accent-foreground"
							onClick={() => {
								setInputValue("");
								navigate({
									search: (prev) => ({
										...prev,
										q: undefined,
									}),
								});
							}}
						>
							<X className="h-4 w-4" />
							<span className="sr-only">Clear search</span>
						</Button>
					)}
				</div>
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
						{isLoading ? (
							skeletonItems.map((item) => (
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
						) : displayedCourses.length === 0 && !searchParam.trim() ? (
							<div className="space-y-6 py-8 text-center text-muted-foreground">
								<div className="space-y-2">
									<h3 className="text-lg font-medium text-foreground">
										Search for Courses
									</h3>
									<p>Search by course code or name to get started</p>
								</div>
								<div className="space-y-6">
									<div className="space-y-2">
										<p className="font-medium text-sm">Example course codes:</p>
										<div className="flex gap-2 justify-center flex-wrap">
											<Button
												variant="outline"
												size="sm"
												className="bg-muted/50 hover:bg-muted"
												onClick={() => {
													navigate({
														search: (prev) => ({
															...prev,
															q: "PLX333",
														}),
													});
												}}
											>
												PLX333
											</Button>
											<Button
												variant="outline"
												size="sm"
												className="bg-muted/50 hover:bg-muted"
												onClick={() => {
													navigate({
														search: (prev) => ({
															...prev,
															q: "GCM750",
														}),
													});
												}}
											>
												GCM750
											</Button>
											<Button
												variant="outline"
												size="sm"
												className="bg-muted/50 hover:bg-muted"
												onClick={() => {
													navigate({
														search: (prev) => ({
															...prev,
															q: "CPS847",
														}),
													});
												}}
											>
												CPS847
											</Button>
										</div>
									</div>
									<div className="space-y-2">
										<p className="font-medium text-sm">Try searching by:</p>
										<div className="flex flex-col items-center gap-2">
											<Button
												variant="outline"
												size="sm"
												className="w-full max-w-xs bg-muted/50 hover:bg-muted"
												onClick={() => {
													navigate({
														search: (prev) => ({
															...prev,
															q: "CPS Networks",
														}),
													});
												}}
											>
												CPS Networks
											</Button>
											<Button
												variant="outline"
												size="sm"
												className="w-full max-w-xs bg-muted/50 hover:bg-muted"
												onClick={() => {
													navigate({
														search: (prev) => ({
															...prev,
															q: "Database Systems",
														}),
													});
												}}
											>
												Database Systems
											</Button>
											<Button
												variant="outline"
												size="sm"
												className="w-full max-w-xs bg-muted/50 hover:bg-muted"
												onClick={() => {
													navigate({
														search: (prev) => ({
															...prev,
															q: "Calculus",
														}),
													});
												}}
											>
												Calculus
											</Button>
										</div>
									</div>
								</div>
							</div>
						) : (
							displayedCourses.map((course) => (
								<DraggableCourseCard
									key={course.id}
									id={course.id}
									courseCode={course.courseCode}
									courseName={course.courseName}
								/>
							))
						)}
					</div>
				</div>
			</div>
			<div className="p-4 border-t">
				<div className="flex items-center justify-center gap-4">
					<Link to="/privacy" search={{ from: "/" }}>
						<Button variant="link" size="sm">
							Privacy Policy
						</Button>
					</Link>
					<Link to="/tos" search={{ from: "/" }}>
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
	const { login } = useSearch({ from: "/" });
	const navigate = useNavigate();
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

	// Handle deleting a course from a semester
	const handleDeleteCourse = useCallback(
		(semesterId: string, courseId: string) => {
			setSemesterCourses((prev) => {
				const newSemesterCourses = { ...prev };

				// Check if the semester exists
				if (newSemesterCourses[semesterId]) {
					// Find the course before removing it
					const courseToDelete = newSemesterCourses[semesterId].find(
						(course) => course.id === courseId,
					);

					// Remove the course from the semester
					newSemesterCourses[semesterId] = newSemesterCourses[
						semesterId
					].filter((course) => course.id !== courseId);

					// Show toast notification if we found the course
					if (courseToDelete) {
						toast.success("Course Removed", {
							description: `${courseToDelete.courseCode}: ${courseToDelete.courseName} has been removed from your plan.`,
							duration: 3000,
						});
					}
				}

				return newSemesterCourses;
			});
		},
		[],
	);

	// Handle clicking on a course card
	const handleCourseClick = useCallback(
		(semesterId: string, courseId: string) => {
			// Find the course in the semester
			const course = semesterCourses[semesterId]?.find(
				(course) => course.id === courseId,
			);

			if (course) {
				// Show information about the course
				toast.info(`${course.courseCode}: ${course.courseName}`, {
					description: "Course details would be shown here.",
					duration: 3000,
				});

				// You can implement more functionality here, such as:
				// - Opening a modal with course details
				// - Navigating to a course details page
				// - Showing prerequisite information
				// - etc.
			}
		},
		[semesterCourses],
	);

	const handleCloseLoginModal = () => {
		// Use window.location to avoid TanStack Router type issues
		const url = new URL(window.location.href);
		url.searchParams.delete("login");
		window.history.pushState({}, "", url.toString());
		// Force a re-render
		window.dispatchEvent(new Event("popstate"));
	};

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
							{/* Login Modal */}
							{login && <LoginModal onClose={handleCloseLoginModal} />}

							{/* Rest of the component */}
							<div className="flex h-screen">
								<div
									className={`
										border-r bg-background
										transition-all duration-300 overflow-hidden
										${sidebarOpen ? "w-[320px] flex-none" : "w-0"}
									`}
								>
									<div
										className={`
											h-full w-[320px] flex-none
											transition-transform duration-300
											${sidebarOpen ? "translate-x-0" : "-translate-x-full"}
										`}
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
									<div className="flex gap-4 items-center border-b h-[69px] px-4">
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
										<PlanSelector />
										<LoginButton />
										<ThemeToggle />
									</div>
									<div className="flex-1 min-h-0">
										<div className="h-full overflow-y-auto overflow-x-hidden scrollbar-gutter-stable [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-thumb]:bg-muted-foreground/20 hover:[&::-webkit-scrollbar-thumb]:bg-muted-foreground/25">
											<AcademicPlanner
												semesterCourses={semesterCourses}
												courses={courses}
												onDeleteCourse={handleDeleteCourse}
												onCourseClick={handleCourseClick}
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
