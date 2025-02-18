import { createFileRoute } from "@tanstack/react-router";
import { AcademicPlanner } from "@/components/academic-planner";
import { useDrag, useCourses, useSemesters } from "./__root";

export const Route = createFileRoute("/")({
	component: Index,
});

function Index() {
	const { courses } = useCourses();
	const { semesterCourses } = useSemesters();
	const { handleDragStart, handleDragEnd } = useDrag();

	return (
		<div className="h-full flex flex-col">
			<div className="flex-1 min-h-0">
				<AcademicPlanner
					semesterCourses={semesterCourses}
					courses={courses}
					onDragStart={handleDragStart}
					onDragEnd={handleDragEnd}
				/>
			</div>
		</div>
	);
}
