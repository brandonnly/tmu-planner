import type { DragEndEvent, DragStartEvent } from "@dnd-kit/core";
import { useDroppable } from "@dnd-kit/core";
import { Card } from "@/components/ui/card";
import { CourseCard } from "@/components/course-card";
import { useState } from "react";
import { Leaf, Snowflake, Sun } from "lucide-react";
import { Input } from "@/components/ui/input";

type Term = "Fall" | "Winter" | "Spring/Summer";

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
}

function SemesterColumn({ term, year, id, courses }: SemesterColumnProps) {
	const { setNodeRef, isOver } = useDroppable({
		id: id,
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

	return (
		<Card
			ref={setNodeRef}
			className={`p-4 w-[320px] h-full transition-colors ${
				isOver ? "bg-muted/50" : ""
			}`}
		>
			<div className="h-full flex flex-col">
				<h3 className="font-semibold mb-4 text-center flex items-center justify-center gap-2">
					{getIcon()}
					{`${term} ${year}`}
				</h3>
				<div className="flex-1 min-h-0 overflow-hidden">
					<div className="h-full overflow-y-auto overflow-x-hidden scrollbar-gutter-stable [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-thumb]:bg-muted-foreground/20 hover:[&::-webkit-scrollbar-thumb]:bg-muted-foreground/25">
						<div className="space-y-4 px-4 mr-4">
							{courses.map((course) => (
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
			</div>
		</Card>
	);
}

interface AcademicYearProps {
	startYear: number;
	semesters: Semester[];
	semesterCourses: Record<string, Course[]>;
}

function AcademicYear({
	startYear,
	semesters,
	semesterCourses,
}: AcademicYearProps) {
	return (
		<div className="h-full flex flex-col">
			<h2 className="text-lg font-bold mb-2">{`${startYear}-${startYear + 1}`}</h2>
			<div className="flex gap-2 flex-1 min-h-0">
				{semesters.map((semester) => (
					<SemesterColumn
						key={semester.id}
						term={semester.term}
						year={semester.year}
						id={semester.id}
						courses={semesterCourses[semester.id] || []}
					/>
				))}
			</div>
		</div>
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

export interface AcademicPlannerProps {
	semesterCourses: Record<string, Course[]>;
	courses: Course[];
	// onDragStart: (event: DragStartEvent) => void;
	// onDragEnd: (event: DragEndEvent) => void;
}

export function AcademicPlanner({
	semesterCourses,
	courses,
}: AcademicPlannerProps) {
	// Generate semesters starting from Fall 2021
	const semesters = generateSemesters("Fall", 2021, "Fall", 2026);
	const academicYears = groupSemestersByAcademicYear(semesters);

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
		<div className="h-full">
			<div className="h-full overflow-x-auto">
				<div className="flex gap-16 p-6 min-w-min h-full">
					{Object.entries(academicYears).map(([startYear, yearSemesters]) => (
						<div key={startYear} className="h-full">
							<AcademicYear
								startYear={Number.parseInt(startYear)}
								semesters={yearSemesters}
								semesterCourses={semesterCourses}
							/>
						</div>
					))}
				</div>
			</div>
		</div>
	);
}
