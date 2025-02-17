import { DndContext, DragEndEvent, DragStartEvent, useDroppable, DragOverlay, PointerSensor, useSensor, useSensors } from "@dnd-kit/core";
import { Card } from "@/components/ui/card";
import { CourseCard } from "@/components/course-card";
import { useState } from "react";
import { Leaf, Snowflake, Sun } from "lucide-react";

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

function generateSemesters(startTerm: Term, startYear: number, endTerm: Term, endYear: number): Semester[] {
  const terms: Term[] = ["Fall", "Winter", "Spring/Summer"];
  const semesters: Semester[] = [];
  
  // Adjust end year if the end term is Winter or Spring/Summer
  // because these terms belong to the previous academic year
  const adjustedEndYear = endTerm === "Fall" ? endYear : endYear - 1;
  
  let currentYear = startYear;
  let currentTermIndex = terms.indexOf(startTerm);
  const endTermIndex = terms.indexOf(endTerm);
  
  while (currentYear < adjustedEndYear || (currentYear === adjustedEndYear && currentTermIndex <= endTermIndex)) {
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

function groupSemestersByAcademicYear(semesters: Semester[]): Record<number, Semester[]> {
  const academicYears: Record<number, Semester[]> = {};
  
  semesters.forEach((semester) => {
    // Academic year is determined by the Fall semester
    // Fall 2021, Winter 2022, Spring/Summer 2022 all belong to academic year 2021-2022
    const academicYear = semester.term === "Fall" ? semester.year : semester.year - 1;
    
    if (!academicYears[academicYear]) {
      academicYears[academicYear] = [];
    }
    
    academicYears[academicYear].push(semester);
  });
  
  // Sort semesters within each academic year
  Object.values(academicYears).forEach(yearSemesters => {
    yearSemesters.sort((a, b) => {
      const termOrder = { "Fall": 0, "Winter": 1, "Spring/Summer": 2 };
      if (a.year === b.year) {
        return termOrder[a.term] - termOrder[b.term];
      }
      return a.year - b.year;
    });
  });
  
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
        return <Leaf className="w-4 h-4" />;
      case "Winter":
        return <Snowflake className="w-4 h-4" />;
      case "Spring/Summer":
        return <Sun className="w-4 h-4" />;
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

function AcademicYear({ startYear, semesters, semesterCourses }: AcademicYearProps) {
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

export function AcademicPlanner() {
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

  // Generate semesters starting from Fall 2021
  const semesters = generateSemesters("Fall", 2021, "Fall", 2026);
  const academicYears = groupSemestersByAcademicYear(semesters);

  // State to track which courses are in which semester
  const [semesterCourses, setSemesterCourses] = useState<Record<string, Course[]>>({
    "fall-2021": exampleCourses, // Initially place courses in Fall 2021
  });

  // State to track the currently dragged course
  const [activeCourse, setActiveCourse] = useState<Course | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

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
    <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className="h-full overflow-hidden">
        <div className="h-full overflow-x-auto">
          <div className="flex gap-16 p-6 min-w-min h-full">
            {Object.entries(academicYears).map(([startYear, yearSemesters]) => (
              <div key={startYear} className="h-full">
                <AcademicYear 
                  startYear={parseInt(startYear)} 
                  semesters={yearSemesters}
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