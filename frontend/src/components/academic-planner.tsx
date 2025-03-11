import { useDroppable } from "@dnd-kit/core";
import { Card } from "@/components/ui/card";
import { SortableCourseCard } from "@/components/course-card";
import { Leaf, Snowflake, Sun, ArrowUpRight } from "lucide-react";
import {
	useContext,
	useRef,
	useEffect,
	useState,
	useCallback,
	useMemo,
} from "react";
import { SpringSummerContext } from "@/contexts";

import {
	SortableContext,
	verticalListSortingStrategy,
} from "@dnd-kit/sortable";

export type Term = "Fall" | "Winter" | "Spring/Summer";

interface Semester {
	term: Term;
	year: number;
	id: string;
}

// Example course data - you can replace this with your actual data structure
interface Course {
	id: string;
	courseCode: string;
	courseName: string;
}

function generateSemesters(
	startTerm: Term,
	startYear: number,
	endTerm: Term,
	endYear: number,
): Semester[] {
	const terms: Term[] = ["Fall", "Winter", "Spring/Summer"];
	const semesters: Semester[] = [];

	// Adjust end year if the end term is Winter or Spring/Summer
	// because these terms belong to the previous academic year
	const adjustedEndYear = endTerm === "Fall" ? endYear : endYear - 1;

	let currentYear = startYear;
	let currentTermIndex = terms.indexOf(startTerm);
	const endTermIndex = terms.indexOf(endTerm);

	while (
		currentYear < adjustedEndYear ||
		(currentYear === adjustedEndYear && currentTermIndex <= endTermIndex)
	) {
		const currentTerm = terms[currentTermIndex];

		// Adjust year for Winter and Spring/Summer terms
		const adjustedYear = currentTerm === "Fall" ? currentYear : currentYear + 1;

		// Create semester ID in lowercase format
		const termId = currentTerm.toLowerCase().replace("/", "-");

		semesters.push({
			term: currentTerm,
			year: adjustedYear,
			id: `${termId}-${adjustedYear}`,
		});

		currentTermIndex++;
		if (currentTermIndex >= terms.length) {
			currentTermIndex = 0;
			currentYear++;
		}
	}

	return semesters;
}

function groupSemestersByAcademicYear(
	semesters: Semester[],
): Record<number, Semester[]> {
	const academicYears: Record<number, Semester[]> = {};

	for (const semester of semesters) {
		// Academic year is determined by the Fall semester
		// Fall 2021, Winter 2022, Spring/Summer 2022 all belong to academic year 2021-2022
		const academicYear =
			semester.term === "Fall" ? semester.year : semester.year - 1;

		if (!academicYears[academicYear]) {
			academicYears[academicYear] = [];
		}

		academicYears[academicYear].push(semester);
	}

	// Sort semesters within each academic year
	for (const yearSemesters of Object.values(academicYears)) {
		yearSemesters.sort((a, b) => {
			const termOrder = { Fall: 0, Winter: 1, "Spring/Summer": 2 };
			if (a.year === b.year) {
				return termOrder[a.term] - termOrder[b.term];
			}
			return a.year - b.year;
		});
	}

	return academicYears;
}

interface SemesterColumnProps {
	term: Term;
	year: number;
	id: string;
	courses: Course[];
	"data-first-semester"?: string;
	"data-academic-year"?: number;
	onDeleteCourse?: (semesterId: string, courseId: string) => void;
	onCourseClick?: (semesterId: string, courseId: string) => void;
}

function SemesterColumn({
	term,
	year,
	id,
	courses,
	onDeleteCourse,
	onCourseClick,
	...props
}: SemesterColumnProps) {
	const { setNodeRef, isOver } = useDroppable({
		id: id,
		data: {
			type: "semester-column",
			accepts: ["course-card"],
			term,
			year,
		},
	});

	const getIcon = () => {
		switch (term) {
			case "Fall":
				return <Leaf className="w-4 h-4 text-orange-500" />;
			case "Winter":
				return <Snowflake className="w-4 h-4 text-blue-400" />;
			case "Spring/Summer":
				return <Sun className="w-4 h-4 text-yellow-500" />;
			default:
				return null;
		}
	};

	const handleDeleteCourse = (courseId: string) => {
		if (onDeleteCourse) {
			onDeleteCourse(id, courseId);
		}
	};

	const handleCourseClick = (courseId: string) => {
		if (onCourseClick) {
			onCourseClick(id, courseId);
		}
	};

	// Sort courses by course code
	const sortedCourses = useMemo(() => {
		return [...courses].sort((a, b) =>
			a.courseCode.localeCompare(b.courseCode),
		);
	}, [courses]);

	return (
		<Card
			ref={setNodeRef}
			className={`p-4 w-[320px] h-full transition-colors ${
				isOver ? "bg-muted/50" : ""
			}`}
			data-droppable="semester-column"
			{...props}
		>
			<div className="h-full flex flex-col">
				<h3 className="font-semibold mb-4 text-center flex items-center justify-center gap-2">
					{getIcon()}
					{`${term} ${year}`}
				</h3>
				<div className="flex-1 min-h-0 overflow-hidden">
					<div className="h-full overflow-y-auto overflow-x-hidden scrollbar-gutter-stable [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-thumb]:bg-muted-foreground/20 hover:[&::-webkit-scrollbar-thumb]:bg-muted-foreground/25">
						<div className="space-y-4 mx-2">
							<SortableContext
								items={sortedCourses.map((c) => c.id)}
								strategy={verticalListSortingStrategy}
							>
								{sortedCourses.map((course) => (
									<SortableCourseCard
										key={course.id}
										id={course.id}
										courseCode={course.courseCode}
										courseName={course.courseName}
										onDelete={handleDeleteCourse}
										onClick={() => handleCourseClick(course.id)}
									/>
								))}
							</SortableContext>
							{/* Add invisible, minimal height placeholder to ensure dragging works at bottom of list */}
							<div className="h-1 w-full" />
						</div>
					</div>
				</div>
			</div>
		</Card>
	);
}

interface AcademicYearProps {
	startYear: number;
	semesters: Semester[];
	semesterCourses: Record<string, Course[]>;
	onDeleteCourse?: (semesterId: string, courseId: string) => void;
	onCourseClick?: (semesterId: string, courseId: string) => void;
}

function AcademicYear({
	startYear,
	semesters,
	semesterCourses,
	onDeleteCourse,
	onCourseClick,
}: AcademicYearProps) {
	const { hideSpring } = useContext(SpringSummerContext);
	const visibleSemesters = hideSpring
		? semesters.filter((semester) => semester.term !== "Spring/Summer")
		: semesters;

	return (
		<div className="h-full flex flex-col">
			<h2 className="text-lg font-bold mb-2 transition-colors [div[aria-current=true]_&]:text-primary">{`${startYear}-${startYear + 1}`}</h2>
			<div className="flex gap-2 flex-1 min-h-0">
				{visibleSemesters.map((semester, index) => (
					<SemesterColumn
						key={semester.id}
						term={semester.term}
						year={semester.year}
						id={semester.id}
						courses={semesterCourses[semester.id] || []}
						data-first-semester={index === 0 ? "true" : "false"}
						data-academic-year={startYear}
						onDeleteCourse={onDeleteCourse}
						onCourseClick={onCourseClick}
					/>
				))}
			</div>
		</div>
	);
}

export interface AcademicPlannerProps {
	semesterCourses: Record<string, Course[]>;
	courses: Course[];
	selectedPlan?: {
		startTerm: Term;
		startYear: number;
		endTerm: Term;
		endYear: number;
	} | null;
	onDeleteCourse?: (semesterId: string, courseId: string) => void;
	onCourseClick?: (semesterId: string, courseId: string) => void;
}

export function AcademicPlanner({
	semesterCourses = {},
	selectedPlan,
	onDeleteCourse,
	onCourseClick,
}: AcademicPlannerProps) {
	// Generate semesters for the current plan
	const semesters = useMemo(() => {
		if (!selectedPlan) {
			return [];
		}

		return generateSemesters(
			selectedPlan.startTerm,
			selectedPlan.startYear,
			selectedPlan.endTerm,
			selectedPlan.endYear,
		);
	}, [selectedPlan]);

	const academicYears = useMemo(
		() => groupSemestersByAcademicYear(semesters),
		[semesters],
	);
	const academicYearKeys = useMemo(
		() => Object.keys(academicYears).map(Number),
		[academicYears],
	);
	const [currentYearIndex, setCurrentYearIndex] = useState(0);
	const containerRef = useRef<HTMLDivElement>(null);

	// Update current year index based on scroll position
	useEffect(() => {
		const updateCurrentYearOnScroll = () => {
			if (!containerRef.current) return;

			const containerRect = containerRef.current.getBoundingClientRect();
			const containerLeft = containerRect.left;
			const containerWidth = containerRect.width;
			const centerX = containerLeft + containerWidth / 2;

			// Find which academic year is most visible in the viewport
			let closestYear = academicYearKeys[0];
			let closestDistance = Number.POSITIVE_INFINITY;

			academicYearKeys.forEach((year, index) => {
				const yearElement = document.getElementById(`academic-year-${year}`);
				if (yearElement) {
					const yearRect = yearElement.getBoundingClientRect();
					const yearCenterX = yearRect.left + yearRect.width / 2;
					const distance = Math.abs(centerX - yearCenterX);

					if (distance < closestDistance) {
						closestDistance = distance;
						closestYear = year;
					}
				}
			});

			// Update current year index
			const newIndex = academicYearKeys.indexOf(closestYear);
			if (newIndex !== -1 && newIndex !== currentYearIndex) {
				setCurrentYearIndex(newIndex);
			}
		};

		const container = containerRef.current;
		if (container) {
			container.addEventListener("scroll", updateCurrentYearOnScroll);
			return () =>
				container.removeEventListener("scroll", updateCurrentYearOnScroll);
		}
	}, [academicYearKeys, currentYearIndex]);

	// Function to scroll to a specific academic year
	const scrollToYear = useCallback((year: number) => {
		if (containerRef.current) {
			// Find the first semester column of the academic year
			const firstSemesterColumn = containerRef.current.querySelector(
				`[data-first-semester="true"][data-academic-year="${year}"]`,
			);

			if (firstSemesterColumn) {
				// Get the container's padding-left
				const containerStyle = window.getComputedStyle(containerRef.current);
				const containerPaddingLeft =
					Number.parseInt(containerStyle.paddingLeft, 10) || 0;

				// Calculate the element's position relative to the container's content area
				const columnRect = (
					firstSemesterColumn as HTMLElement
				).getBoundingClientRect();
				const containerRect = containerRef.current.getBoundingClientRect();
				const relativeLeft =
					columnRect.left - containerRect.left - containerPaddingLeft;

				// Add a left offset to account for additional spacing (adjust this value as needed)
				const leftOffset = 24; // 24px offset to the left

				// Scroll to the calculated position with the offset
				containerRef.current.scrollTo({
					left: containerRef.current.scrollLeft + relativeLeft - leftOffset,
					behavior: "smooth",
				});
			}
		}
	}, []);

	useEffect(() => {
		const handleKeyDown = (e: KeyboardEvent) => {
			// Only handle if not in an input field
			if (
				e.target instanceof HTMLInputElement ||
				e.target instanceof HTMLTextAreaElement
			) {
				return;
			}

			// Only respond if no modifier keys are pressed (Ctrl, Alt, Shift, Meta)
			if (e.ctrlKey || e.altKey || e.shiftKey || e.metaKey) {
				return;
			}

			// Only handle left and right arrow keys
			if (e.key === "ArrowLeft") {
				e.preventDefault();
				setCurrentYearIndex((prev) => {
					const newIndex = Math.max(0, prev - 1);
					scrollToYear(academicYearKeys[newIndex]);
					return newIndex;
				});
			} else if (e.key === "ArrowRight") {
				e.preventDefault();
				setCurrentYearIndex((prev) => {
					const newIndex = Math.min(academicYearKeys.length - 1, prev + 1);
					scrollToYear(academicYearKeys[newIndex]);
					return newIndex;
				});
			}
		};

		window.addEventListener("keydown", handleKeyDown);
		return () => window.removeEventListener("keydown", handleKeyDown);
	}, [academicYearKeys, scrollToYear]);

	// Function to handle clicking on a year indicator
	const handleYearIndicatorClick = useCallback(
		(yearIndex: number) => {
			setCurrentYearIndex(yearIndex);
			scrollToYear(academicYearKeys[yearIndex]);
		},
		[academicYearKeys, scrollToYear],
	);

	if (!selectedPlan) {
		return (
			<div className="h-full flex items-center justify-center">
				<Card className="p-8 max-w-md text-center">
					<div className="flex justify-center mb-4">
						<ArrowUpRight className="h-12 w-12 text-muted-foreground" />
					</div>
					<h2 className="text-lg font-semibold mb-2">No Plan Selected</h2>
					<p className="text-muted-foreground">
						Select an existing plan or create a new one to start planning your
						courses.
					</p>
				</Card>
			</div>
		);
	}

	return (
		<div className="h-full flex flex-col">
			<div className="h-full overflow-x-auto scrollbar-hide" ref={containerRef}>
				<div className="flex gap-16 p-6 min-w-min h-full">
					{Object.entries(academicYears).map(
						([startYear, yearSemesters], index) => (
							<div
								key={startYear}
								className="h-full"
								id={`academic-year-${startYear}`}
								aria-current={index === currentYearIndex ? "true" : "false"}
							>
								<AcademicYear
									startYear={Number.parseInt(startYear)}
									semesters={yearSemesters}
									semesterCourses={semesterCourses}
									onDeleteCourse={onDeleteCourse}
									onCourseClick={onCourseClick}
								/>
							</div>
						),
					)}
				</div>
			</div>

			{/* Year indicator bar */}
			<div className="flex flex-col items-center py-2 border-t">
				{/* Current year indicator */}
				<div className="mb-2 text-sm font-medium">
					{academicYearKeys.length > 0 &&
					currentYearIndex >= 0 &&
					currentYearIndex < academicYearKeys.length
						? `${academicYearKeys[currentYearIndex]}-${academicYearKeys[currentYearIndex] + 1}`
						: ""}
				</div>

				<div className="flex gap-1 items-center">
					{/* First year label */}
					<span className="text-xs text-muted-foreground mr-2">
						{academicYearKeys.length > 0
							? `${academicYearKeys[0]}-${academicYearKeys[0] + 1}`
							: ""}
					</span>

					{academicYearKeys.map((year, index) => (
						<button
							type="button"
							key={year}
							onClick={() => handleYearIndicatorClick(index)}
							className={`h-2 rounded-full transition-all ${
								index === currentYearIndex
									? "w-8 bg-primary"
									: "w-2 bg-muted-foreground/30 hover:bg-muted-foreground/50"
							}`}
							title={`${year}-${year + 1}`}
							aria-label={`Go to academic year ${year}-${year + 1}`}
						/>
					))}

					{/* Last year label */}
					<span className="text-xs text-muted-foreground ml-2">
						{academicYearKeys.length > 0
							? `${academicYearKeys[academicYearKeys.length - 1]}-${academicYearKeys[academicYearKeys.length - 1] + 1}`
							: ""}
					</span>
				</div>
			</div>
		</div>
	);
}
