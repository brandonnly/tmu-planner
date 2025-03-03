import { createContext, useContext } from "react";
import type { Course } from "@/types/course";
import type { DragStartEvent, DragEndEvent } from "@dnd-kit/core";

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

interface CourseContextType {
	courses: Course[];
	setCourses: React.Dispatch<React.SetStateAction<Course[]>>;
}

export const CourseContext = createContext<CourseContextType>({
	courses: [],
	setCourses: () => {},
});

export const useCourses = () => useContext(CourseContext);
