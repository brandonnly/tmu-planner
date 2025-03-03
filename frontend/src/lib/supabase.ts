import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/types/database.types";

// Get devtools values if they exist
const devtoolsUrl =
	typeof window !== "undefined"
		? localStorage.getItem("devtools_supabase_url")
		: null;
const devtoolsKey =
	typeof window !== "undefined"
		? localStorage.getItem("devtools_supabase_key")
		: null;

// Use devtools values if they exist, otherwise use environment variables
const supabaseUrl = devtoolsUrl || import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = devtoolsKey || import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);
