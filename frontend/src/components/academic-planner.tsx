import { useDroppable } from "@dnd-kit/core";
import { Card } from "@/components/ui/card";
import { SortableCourseCard } from "@/components/course-card";
import { Leaf, Snowflake, Sun } from "lucide-react";
import { useContext, useRef, useEffect, useState, useCallback } from "react";
import { SpringSummerContext } from "@/contexts";
import { use$ } from "@legendapp/state/react";
import { plans$, selectedPlanId$, planCourses$ } from "@/state";
import { Memo } from "@legendapp/state/react";
import type { Database } from "@/types/database.types";

import {
	SortableContext,
	verticalListSortingStrategy,
} from "@dnd-kit/sortable";

type Term = Database["public"]["Enums"]["term"];

interface Semester {
	term: Term;
	year: number;
	id: string;
}

type Course = {
	id: string;
	courseCode: string;
	courseName: string;
};

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
								id={id}
								items={courses}
								strategy={verticalListSortingStrategy}
							>
								<Memo>
									{() =>
										courses.map((course) => (
											<SortableCourseCard
												key={course.id}
												id={course.id}
												courseCode={course.courseCode}
												courseName={course.courseName}
												onDelete={handleDeleteCourse}
												onClick={() => handleCourseClick(course.id)}
											/>
										))
									}
								</Memo>
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

	return (
		<div className="h-full flex flex-col">
			<h2 className="text-lg font-bold mb-2 transition-colors [div[aria-current=true]_&]:text-primary">{`${startYear}-${startYear + 1}`}</h2>
			<div className="flex gap-2 flex-1 min-h-0">
				<Memo>
					{() => {
						const visibleSemesters = hideSpring
							? semesters.filter(
									(semester) => semester.term !== "Spring/Summer",
								)
							: semesters;

						return visibleSemesters.map((semester, index) => (
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
						));
					}}
				</Memo>
			</div>
		</div>
	);
}

export interface AcademicPlannerProps {
	onDeleteCourse?: (semesterId: string, courseId: string) => void;
	onCourseClick?: (semesterId: string, courseId: string) => void;
}

export function AcademicPlanner({
	onDeleteCourse,
	onCourseClick,
}: AcademicPlannerProps) {
	const plans = use$(plans$);
	const selectedPlanId = use$(selectedPlanId$);
	const planCourses = use$(planCourses$);
	const [currentYearIndex, setCurrentYearIndex] = useState(0);
	const containerRef = useRef<HTMLDivElement>(null);
	const scrollTimeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(
		undefined,
	);

	// Function to scroll to a specific academic year
	const scrollToYear = useCallback((year: number) => {
		if (containerRef.current) {
			// Find the first semester column of the academic year
			const firstSemesterColumn = containerRef.current.querySelector(
				`[data-first-semester="true"][data-academic-year="${year}"]`,
			);

			if (firstSemesterColumn) {
				const columnRect = (
					firstSemesterColumn as HTMLElement
				).getBoundingClientRect();
				const containerRect = containerRef.current.getBoundingClientRect();

				// Calculate the scroll position needed to center the year
				const scrollLeft =
					containerRef.current.scrollLeft +
					columnRect.left -
					containerRect.left -
					(containerRect.width - columnRect.width) / 2;

				// Scroll to the calculated position
				containerRef.current.scrollTo({
					left: scrollLeft,
					behavior: "smooth",
				});
			}
		}
	}, []);

	// Function to handle clicking on a year indicator
	const handleYearIndicatorClick = useCallback(
		(yearIndex: number, academicYearKeys: number[]) => {
			setCurrentYearIndex(yearIndex);
			scrollToYear(academicYearKeys[yearIndex]);
		},
		[scrollToYear],
	);

	// Function to handle scroll events
	const handleScroll = useCallback((academicYearKeys: number[]) => {
		if (!containerRef.current) return;

		// Clear any existing timeout
		if (scrollTimeoutRef.current) {
			clearTimeout(scrollTimeoutRef.current);
		}

		// Debounce the scroll handler
		scrollTimeoutRef.current = setTimeout(() => {
			const container = containerRef.current;
			if (!container) return;

			const containerRect = container.getBoundingClientRect();
			const containerCenter = containerRect.left + containerRect.width / 2;
			const scrollLeft = container.scrollLeft;

			// Find the academic year div whose center is closest to the container's center
			let closestDistance = Number.POSITIVE_INFINITY;
			let closestIndex = 0;

			academicYearKeys.forEach((year, index) => {
				const yearDiv = container.querySelector(
					`[data-first-semester="true"][data-academic-year="${year}"]`,
				);
				if (!yearDiv) return;

				const yearRect = (yearDiv as HTMLElement).getBoundingClientRect();
				const yearCenter = yearRect.left + yearRect.width / 2;
				const adjustedYearCenter = yearCenter + scrollLeft;
				const distance = Math.abs(
					containerCenter + scrollLeft - adjustedYearCenter,
				);

				if (distance < closestDistance) {
					closestDistance = distance;
					closestIndex = index;
				}
			});

			setCurrentYearIndex(closestIndex);
		}, 100);
	}, []);

	// Function to handle keyboard navigation
	const handleKeyDown = useCallback(
		(e: KeyboardEvent, academicYearKeys: number[]) => {
			// Only handle if not in an input field
			if (
				document.activeElement?.tagName === "INPUT" ||
				document.activeElement?.tagName === "TEXTAREA"
			) {
				return;
			}

			if (e.key === "ArrowLeft" && currentYearIndex > 0) {
				e.preventDefault();
				handleYearIndicatorClick(currentYearIndex - 1, academicYearKeys);
			} else if (
				e.key === "ArrowRight" &&
				currentYearIndex < academicYearKeys.length - 1
			) {
				e.preventDefault();
				handleYearIndicatorClick(currentYearIndex + 1, academicYearKeys);
			}
		},
		[currentYearIndex, handleYearIndicatorClick],
	);

	// Memoize the event handlers
	const createHandleScrollThrottled = useCallback(
		(academicYearKeys: number[]) => {
			return () => handleScroll(academicYearKeys);
		},
		[handleScroll],
	);

	const createHandleKeyDownWrapper = useCallback(
		(academicYearKeys: number[]) => {
			return (e: KeyboardEvent) => handleKeyDown(e, academicYearKeys);
		},
		[handleKeyDown],
	);

	return (
		<div className="h-full flex flex-col">
			<Memo>
				{() => {
					// Get the plan data reactively
					const planId = selectedPlanId;
					if (!planId || typeof planId !== "string") {
						return (
							<div className="h-full flex flex-col items-center justify-center p-8">
								<div className="text-center max-w-md">
									<h2 className="text-2xl font-bold mb-4">No Plan Selected</h2>
									<p className="text-muted-foreground mb-6">
										Please select an existing plan or create a new one using the
										plan selector at the top of the page.
									</p>
								</div>
							</div>
						);
					}

					const plan = plans[planId];
					if (!plan) return null;

					// Generate semesters based on the selected plan
					const semesters = generateSemesters(
						plan.starting_semester_term as Term,
						plan.starting_semester_year,
						plan.ending_semester_term as Term,
						plan.ending_semester_year,
					);

					// Convert planCourses to semesterCourses format
					const coursesMap: Record<string, Course[]> = {};
					for (const [id, planCourse] of Object.entries(planCourses)) {
						if (planCourse.plan_id !== planId) continue;

						// Format the semester ID
						const term = String(planCourse.semester_term)
							.toLowerCase()
							.replace("/", "-");
						const semesterId = `${term}-${planCourse.semester_year}`;

						if (!coursesMap[semesterId]) {
							coursesMap[semesterId] = [];
						}

						coursesMap[semesterId].push({
							id: id,
							courseCode: planCourse.course_id,
							courseName: planCourse.note || "Course Name",
						});
					}

					const academicYears = groupSemestersByAcademicYear(semesters);
					const academicYearKeys = Object.keys(academicYears).map(Number);

					// Reset current year index if it's out of bounds
					if (
						currentYearIndex >= academicYearKeys.length &&
						academicYearKeys.length > 0 &&
						currentYearIndex !== 0
					) {
						setCurrentYearIndex(0);
					}

					const handleScrollThrottled =
						createHandleScrollThrottled(academicYearKeys);
					const handleKeyDownWrapper =
						createHandleKeyDownWrapper(academicYearKeys);

					// Set up event listeners for this specific set of academic years
					useEffect(() => {
						const container = containerRef.current;
						if (!container) return;

						// Add event listeners
						container.addEventListener("scroll", handleScrollThrottled, {
							passive: true,
						});
						window.addEventListener("keydown", handleKeyDownWrapper);

						// Initial scroll position check
						handleScrollThrottled();

						// Cleanup
						return () => {
							container.removeEventListener("scroll", handleScrollThrottled);
							window.removeEventListener("keydown", handleKeyDownWrapper);
						};
					}, [handleScrollThrottled, handleKeyDownWrapper]);

					return (
						<>
							<div
								className="h-full overflow-x-auto"
								ref={containerRef}
								onScroll={handleScrollThrottled}
							>
								<div className="flex gap-16 p-6 min-w-min h-full">
									{Object.entries(academicYears).map(
										([startYear, yearSemesters], index) => (
											<div
												key={startYear}
												className="h-full"
												id={`academic-year-${startYear}`}
												aria-current={
													index === currentYearIndex ? "true" : "false"
												}
											>
												<AcademicYear
													startYear={Number.parseInt(startYear)}
													semesters={yearSemesters}
													semesterCourses={coursesMap}
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
											onClick={() =>
												handleYearIndicatorClick(index, academicYearKeys)
											}
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
						</>
					);
				}}
			</Memo>
		</div>
	);
}
