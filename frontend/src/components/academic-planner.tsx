import { DndContext, DragEndEvent, DragStartEvent, useDraggable, useDroppable, DragOverlay } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { Card } from "@/components/ui/card";
import { CourseCard } from "@/components/course-card";
import { useState } from "react";

// Example course data - you can replace this with your actual data structure
interface Course {
  id: string;
  courseCode: string;
  courseName: string;
}

interface SemesterColumnProps {
  term: string;
  year: string;
  id: string;
  courses: Course[];
}

function SemesterColumn({ term, year, id, courses }: SemesterColumnProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: id,
  });

  return (
    <Card 
      ref={setNodeRef}
      className={`p-4 w-[300px] h-full transition-colors ${
        isOver ? "bg-muted/50" : ""
      }`}
    >
      <div className="h-full flex flex-col">
        <h3 className="font-semibold mb-4">{`${term} ${year}`}</h3>
        <div className="flex-1 min-h-0 space-y-4 overflow-y-auto">
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
    </Card>
  );
}

interface AcademicYearProps {
  startYear: number;
  semesterCourses: Record<string, Course[]>;
}

function AcademicYear({ startYear, semesterCourses }: AcademicYearProps) {
  return (
    <div className="h-full flex flex-col">
      <h2 className="text-lg font-bold mb-2">{`${startYear}-${startYear + 1}`}</h2>
      <div className="flex gap-2 flex-1 min-h-0">
        <SemesterColumn
          term="Fall"
          year={startYear.toString()}
          id={`fall-${startYear}`}
          courses={semesterCourses[`fall-${startYear}`] || []}
        />
        <SemesterColumn
          term="Winter"
          year={(startYear + 1).toString()}
          id={`winter-${startYear + 1}`}
          courses={semesterCourses[`winter-${startYear + 1}`] || []}
        />
        <SemesterColumn
          term="Spring/Summer"
          year={(startYear + 1).toString()}
          id={`spring-${startYear + 1}`}
          courses={semesterCourses[`spring-${startYear + 1}`] || []}
        />
      </div>
    </div>
  );
}

export function AcademicPlanner() {
  const startYears = [2021, 2022, 2023, 2024];
  
  // Example courses - replace with your actual course data
  const exampleCourses: Course[] = [
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
  ];

  // State to track which courses are in which semester
  const [semesterCourses, setSemesterCourses] = useState<Record<string, Course[]>>({
    "fall-2021": exampleCourses, // Initially place courses in Fall 2021
  });

  // State to track the currently dragged course
  const [activeCourse, setActiveCourse] = useState<Course | null>(null);

  const handleDragStart = (event: DragStartEvent) => {
    const course = exampleCourses.find(c => c.id === event.active.id);
    if (course) {
      setActiveCourse(course);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (over && active.id !== over.id) {
      setSemesterCourses(prev => {
        const course = exampleCourses.find(c => c.id === active.id);
        if (!course) return prev;

        // Find which semester currently has the course
        let sourceSemester = '';
        Object.entries(prev).forEach(([semester, courses]) => {
          if (courses.some(c => c.id === active.id)) {
            sourceSemester = semester;
          }
        });

        // Create new state with all existing courses
        const newSemesterCourses = { ...prev };

        // Remove course from source semester if found
        if (sourceSemester) {
          newSemesterCourses[sourceSemester] = prev[sourceSemester].filter(
            c => c.id !== active.id
          );
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

  return (
    <DndContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className="h-full overflow-hidden">
        <div className="h-full overflow-x-auto">
          <div className="flex gap-16 p-6 min-w-min h-full">
            {startYears.map((year) => (
              <div key={year} className="h-full">
                <AcademicYear 
                  startYear={year} 
                  semesterCourses={semesterCourses}
                />
              </div>
            ))}
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
  );
} 