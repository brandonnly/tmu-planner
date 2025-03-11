import { supabase } from "@/lib/supabase";
import { observable } from "@legendapp/state";
import {
	configureSyncedSupabase,
	syncedSupabase,
} from "@legendapp/state/sync-plugins/supabase";
import { ObservablePersistLocalStorage } from "@legendapp/state/persist-plugins/local-storage";
import { v4 as uuidv4 } from "uuid";
import { synced } from "@legendapp/state/sync";
import type { Database } from "@/types/database.types";

// provide a function to generate ids locally
const generateId = () => uuidv4();
configureSyncedSupabase({
	generateId,
});

export const auth$ = observable({
	userId: null as string | null,
});

export const plans$ = observable(
	syncedSupabase({
		supabase,
		collection: "user_plan",
		waitFor: auth$.userId,
		waitForSet: auth$.userId,
		persist: {
			name: "plans",
			plugin: ObservablePersistLocalStorage,
		},
	}),
);

export const selectedPlanId$ = observable(
	synced({
		initial: null,
		persist: {
			name: "selected-plan-id",
			plugin: ObservablePersistLocalStorage,
		},
	}),
);

export const planCourses$ = observable(
	syncedSupabase({
		supabase,
		collection: "plan_course",
		waitFor: auth$.userId,
		waitForSet: auth$.userId,
		persist: {
			name: "plan-courses",
			plugin: ObservablePersistLocalStorage,
		},
	}),
);

export function newPlan({
	name,
	starting_semester_term,
	starting_semester_year,
	ending_semester_term,
	ending_semester_year,
	notes = null,
}: Omit<
	Database["public"]["Tables"]["user_plan"]["Insert"],
	"id" | "created_at" | "updated_at" | "user_id"
>) {
	const id = generateId();
	const now = new Date().toISOString();

	const newPlan = {
		id,
		name,
		starting_semester_term,
		starting_semester_year,
		ending_semester_term,
		ending_semester_year,
		notes,
		created_at: now,
		updated_at: now,
		user_id: auth$.userId.get(),
	} as Database["public"]["Tables"]["user_plan"]["Insert"];

	plans$[id].assign(newPlan);
	return id;
}

export function updatePlan({
	id,
	name,
	starting_semester_term,
	starting_semester_year,
	ending_semester_term,
	ending_semester_year,
	notes,
}: Database["public"]["Tables"]["user_plan"]["Update"] & { id: string }) {
	if (!id) throw new Error("Missing plan id");

	const updateData: Partial<
		Database["public"]["Tables"]["user_plan"]["Update"]
	> = {
		name,
		starting_semester_term,
		starting_semester_year,
		ending_semester_term,
		ending_semester_year,
		notes,
		updated_at: new Date().toISOString(),
	};

	// Remove undefined values
	for (const key of Object.keys(updateData)) {
		if (updateData[key as keyof typeof updateData] === undefined) {
			delete updateData[key as keyof typeof updateData];
		}
	}

	plans$[id].assign(updateData);
	return id;
}

export function deletePlan(id: string) {
	if (!id) throw new Error("Missing plan id");

	// Delete the plan
	plans$[id].delete();

	// Delete all associated plan courses
	const planCourseIds = Object.keys(planCourses$.get()).filter(
		(courseId) => planCourses$[courseId].plan_id.get() === id,
	);

	for (const courseId of planCourseIds) {
		planCourses$[courseId].delete();
	}

	// If the deleted plan was selected, clear the selection
	if (selectedPlanId$.get() === id) {
		selectedPlanId$.set(null);
	}

	return id;
}

export function addPlanCourse({
	course_id,
	plan_id,
	semester_term,
	semester_year,
	note = "",
}: Omit<Database["public"]["Tables"]["plan_course"]["Insert"], "id">) {
	const id = generateId();

	const newPlanCourse = {
		id,
		course_id,
		plan_id,
		semester_term,
		semester_year,
		note,
	} as Database["public"]["Tables"]["plan_course"]["Insert"];

	planCourses$[id].assign(newPlanCourse);
	return id;
}

export function updatePlanCourse({
	id,
	course_id,
	plan_id,
	semester_term,
	semester_year,
	note,
}: Database["public"]["Tables"]["plan_course"]["Update"] & { id: string }) {
	if (!id) throw new Error("Missing plan course id");

	const updateData: Partial<
		Database["public"]["Tables"]["plan_course"]["Update"]
	> = {
		course_id,
		plan_id,
		semester_term,
		semester_year,
		note,
	};

	// Remove undefined values
	for (const key of Object.keys(updateData)) {
		if (updateData[key as keyof typeof updateData] === undefined) {
			delete updateData[key as keyof typeof updateData];
		}
	}

	planCourses$[id].assign(updateData);
	return id;
}

export function deletePlanCourse(id: string) {
	if (!id) throw new Error("Missing plan course id");

	planCourses$[id].delete();
	return id;
}
