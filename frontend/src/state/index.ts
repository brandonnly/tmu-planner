import { observable } from "@legendapp/state";
import {
	configureSyncedSupabase,
	syncedSupabase,
} from "@legendapp/state/sync-plugins/supabase";
import { ObservablePersistLocalStorage } from "@legendapp/state/persist-plugins/local-storage";
import { supabase } from "@/lib/supabase";
import type { Database } from "@/types/database.types";
import { v4 as uuidv4 } from "uuid";
import { syncObservable } from "@legendapp/state/sync";

configureSyncedSupabase({
	generateId: () => uuidv4(),
});

// Auth store - just for local state management
export const auth$ = observable({
	user: null as string | null,
	isLoading: false,
});

// Plans store with Supabase sync
export const plans$ = observable(
	syncedSupabase({
		supabase,
		collection: "user_plan",
		persist: {
			name: "plans",
			plugin: ObservablePersistLocalStorage,
		},
		// Only sync when authenticated
		waitFor: auth$.user,
	}),
);

// Selected plan ID with local storage persistence
export const selectedPlanId$ = observable(null as string | null);

// persist the selected plan id
syncObservable(selectedPlanId$, {
	persist: {
		name: "selected-plan-id",
		plugin: ObservablePersistLocalStorage,
	},
});

// All plan courses with Supabase sync
export const planCourses$ = observable(
	syncedSupabase({
		supabase,
		collection: "plan_course",
		persist: {
			name: "plan-courses",
			plugin: ObservablePersistLocalStorage,
		},
		// Only sync when authenticated
		waitFor: auth$.user,
	}),
);

// Computed observable for active plan's courses
export const activePlanCourses$ = observable(() => {
	const selectedPlanId = selectedPlanId$.get();
	const courses = planCourses$.get() ?? {};

	if (!selectedPlanId) return {};

	// Filter courses for the selected plan
	return Object.entries(courses).reduce(
		(acc, [id, course]) => {
			if (course && course.plan_id === selectedPlanId) {
				acc[id] = course;
			}
			return acc;
		},
		{} as Record<string, Database["public"]["Tables"]["plan_course"]["Row"]>,
	);
});

// Helper function to format semester IDs consistently
const formatSemesterTerm = (
	term: Database["public"]["Enums"]["term"],
): string => {
	return term.toLowerCase().replace("/", "-");
};

// Actions
export const actions = {
	// Auth actions
	initAuth() {
		auth$.isLoading.set(true);
		supabase.auth.getSession().then(({ data: { session } }) => {
			auth$.user.set(session?.user?.id ?? null);
			auth$.isLoading.set(false);
		});

		// Listen for auth changes
		supabase.auth.onAuthStateChange((_event, session) => {
			auth$.user.set(session?.user?.id ?? null);
		});
	},

	// Plan actions
	selectPlan(id: string | null) {
		selectedPlanId$.set(id);
	},

	// Course actions
	addCourseToPlan(
		courseId: string,
		semesterTerm: Database["public"]["Enums"]["term"],
		semesterYear: number,
	) {
		const planId = selectedPlanId$.get();
		if (!planId) return;

		const id = uuidv4();
		planCourses$[id].set({
			id,
			plan_id: planId,
			course_id: courseId,
			semester_term: semesterTerm,
			semester_year: semesterYear,
			note: "",
		});
	},

	removeCourseFromPlan(courseId: string) {
		if (!selectedPlanId$.get()) return;

		// Find and remove the course
		const courses = planCourses$.get();
		const courseToRemove = Object.entries(courses).find(
			([_, course]) => course.course_id === courseId,
		);
		if (courseToRemove) {
			planCourses$[courseToRemove[0]].delete();
		}
	},

	// Update course semester
	updateCourseSemester(
		courseId: string,
		semesterTerm: Database["public"]["Enums"]["term"],
		semesterYear: number,
	) {
		if (!selectedPlanId$.get()) return;

		// Find the course in the active plan
		const courses = planCourses$.get();
		const courseEntry = Object.entries(courses).find(
			([_, course]) => course.course_id === courseId,
		);

		if (courseEntry) {
			const [id, course] = courseEntry;
			// Update just the semester info
			planCourses$[id].set({
				...course,
				semester_term: semesterTerm,
				semester_year: semesterYear,
			});
		}
	},

	// Helper to handle drag and drop between semesters
	handleCourseDrop(
		courseId: string,
		targetSemesterTerm: Database["public"]["Enums"]["term"],
		targetSemesterYear: number,
		isNewCourse = false,
	) {
		if (isNewCourse) {
			// If it's a new course being dragged from the sidebar
			this.addCourseToPlan(courseId, targetSemesterTerm, targetSemesterYear);
		} else {
			// If it's an existing course being moved between semesters
			this.updateCourseSemester(
				courseId,
				targetSemesterTerm,
				targetSemesterYear,
			);
		}
	},
};
