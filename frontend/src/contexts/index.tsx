import { createContext, useContext } from "react";
import type { Course } from "@/types/course";
import type { DragStartEvent, DragEndEvent } from "@dnd-kit/core";

export type SidebarContextType = {
	isOpen: boolean;
	setIsOpen: (isOpen: boolean) => void;
};

export const SidebarContext = createContext<SidebarContextType>({
	isOpen: false,
	setIsOpen: () => {},
});

export const useSidebar = () => useContext(SidebarContext);

export type DragContextType = {
	handleDragStart: (event: DragStartEvent) => void;
	handleDragEnd: (event: DragEndEvent) => void;
};

export const DragContext = createContext<DragContextType>({
	handleDragStart: () => {},
	handleDragEnd: () => {},
});

export const useDrag = () => useContext(DragContext);

export type SemesterContextType = {
	semesterCourses: Record<string, Course[]>;
	setSemesterCourses: React.Dispatch<
		React.SetStateAction<Record<string, Course[]>>
	>;
};

export const SemesterContext = createContext<SemesterContextType>({
	semesterCourses: {},
	setSemesterCourses: () => {},
});

export const useSemesters = () => useContext(SemesterContext);

export type CourseContextType = {
	courses: Course[];
	setCourses: React.Dispatch<React.SetStateAction<Course[]>>;
};

export const CourseContext = createContext<CourseContextType>({
	courses: [],
	setCourses: () => {},
});

export const useCourses = () => useContext(CourseContext);

export type SpringSummerContextType = {
	hideSpring: boolean;
	setHideSpring: (hide: boolean) => void;
};

export const SpringSummerContext = createContext<SpringSummerContextType>({
	hideSpring: false,
	setHideSpring: () => {},
});
