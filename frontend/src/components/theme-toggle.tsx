import {
	Moon,
	Sun,
	SunMoon,
	LogOut,
	Settings,
	Check,
	Database,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
	DropdownMenuSeparator,
	DropdownMenuSub,
	DropdownMenuSubContent,
	DropdownMenuSubTrigger,
	DropdownMenuPortal,
} from "@/components/ui/dropdown-menu";
import { useTheme } from "@/components/theme-provider";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useContext, useState } from "react";
import { SpringSummerContext } from "@/contexts";
import { Input } from "@/components/ui/input";

export function ThemeToggle() {
	const { theme, setTheme } = useTheme();
	const { hideSpring, setHideSpring } = useContext(SpringSummerContext);
	const [supabaseUrl, setSupabaseUrl] = useState(
		localStorage.getItem("devtools_supabase_url") || "",
	);
	const [supabaseKey, setSupabaseKey] = useState(
		localStorage.getItem("devtools_supabase_key") || "",
	);

	// Get current environment values for placeholders
	const currentSupabaseUrl = import.meta.env.VITE_SUPABASE_URL;
	const currentSupabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

	const handleSignOut = async () => {
		const { error } = await supabase.auth.signOut();
		if (error) {
			console.error("Error signing out:", error.message);
			toast.error("Failed to sign out");
		} else {
			toast.success("Signed out successfully");
		}
	};

	const handleSaveSupabaseConfig = () => {
		// Save to localStorage
		localStorage.setItem("devtools_supabase_url", supabaseUrl);
		localStorage.setItem("devtools_supabase_key", supabaseKey);

		// Show success message
		toast.success("Supabase configuration saved", {
			description:
				"Please refresh the page for the changes to take effect. Note that this is for development purposes only.",
		});
	};

	const themeIcons = {
		light: Sun,
		dark: Moon,
		system: SunMoon,
	};

	const ThemeIcon = themeIcons[theme];

	return (
		<DropdownMenu>
			<DropdownMenuTrigger asChild>
				<Button variant="ghost" size="icon">
					<Settings className="h-5 w-5" />
				</Button>
			</DropdownMenuTrigger>
			<DropdownMenuContent align="end" className="min-w-[220px]">
				<DropdownMenuSub>
					<DropdownMenuSubTrigger className="flex w-full items-center justify-between">
						<div className="flex items-center gap-2">
							<ThemeIcon className="h-4 w-4" />
							<span>Theme</span>
						</div>
						<span className="ml-4 text-xs capitalize text-muted-foreground">
							{theme}
						</span>
					</DropdownMenuSubTrigger>
					<DropdownMenuPortal>
						<DropdownMenuSubContent>
							<DropdownMenuItem onClick={() => setTheme("light")}>
								<Sun className="mr-2 h-4 w-4" />
								<span>Light</span>
								{theme === "light" && (
									<span className="absolute right-2 flex h-3.5 w-3.5 items-center justify-center">
										<span className="absolute h-2 w-2 rounded-full bg-primary/20" />
										<span className="absolute h-1.5 w-1.5 rounded-full bg-primary" />
									</span>
								)}
							</DropdownMenuItem>
							<DropdownMenuItem onClick={() => setTheme("dark")}>
								<Moon className="mr-2 h-4 w-4" />
								<span>Dark</span>
								{theme === "dark" && (
									<span className="absolute right-2 flex h-3.5 w-3.5 items-center justify-center">
										<span className="absolute h-2 w-2 rounded-full bg-primary/20" />
										<span className="absolute h-1.5 w-1.5 rounded-full bg-primary" />
									</span>
								)}
							</DropdownMenuItem>
							<DropdownMenuItem onClick={() => setTheme("system")}>
								<SunMoon className="mr-2 h-4 w-4" />
								<span>System</span>
								{theme === "system" && (
									<span className="absolute right-2 flex h-3.5 w-3.5 items-center justify-center">
										<span className="absolute h-2 w-2 rounded-full bg-primary/20" />
										<span className="absolute h-1.5 w-1.5 rounded-full bg-primary" />
									</span>
								)}
							</DropdownMenuItem>
						</DropdownMenuSubContent>
					</DropdownMenuPortal>
				</DropdownMenuSub>
				<DropdownMenuItem
					onClick={() => setHideSpring(!hideSpring)}
					className="flex items-center justify-between"
				>
					<div className="flex items-center gap-2">
						<Sun className="h-4 w-4 text-yellow-500" />
						<span>Hide Spring/Summer</span>
					</div>
					{hideSpring && <Check className="h-4 w-4 text-primary" />}
				</DropdownMenuItem>
				<DropdownMenuSeparator />
				<DropdownMenuSub>
					<DropdownMenuSubTrigger className="flex w-full items-center justify-between">
						<div className="flex items-center gap-2">
							<Database className="h-4 w-4" />
							<span>DevTools</span>
						</div>
					</DropdownMenuSubTrigger>
					<DropdownMenuPortal>
						<DropdownMenuSubContent className="w-[300px]">
							<div className="p-2 space-y-2">
								<div className="space-y-1">
									<label
										htmlFor="supabase-url"
										className="text-xs font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
									>
										Supabase URL
									</label>
									<Input
										id="supabase-url"
										value={supabaseUrl}
										onChange={(e) => setSupabaseUrl(e.target.value)}
										placeholder={
											currentSupabaseUrl || "https://your-project.supabase.co"
										}
										className="h-8 text-xs"
									/>
								</div>
								<div className="space-y-1">
									<label
										htmlFor="supabase-key"
										className="text-xs font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
									>
										Supabase Anon Key
									</label>
									<Input
										id="supabase-key"
										value={supabaseKey}
										onChange={(e) => setSupabaseKey(e.target.value)}
										placeholder={currentSupabaseKey || "your-anon-key"}
										type="password"
										className="h-8 text-xs"
									/>
								</div>
								<DropdownMenuItem
									className="w-full justify-center cursor-pointer"
									onClick={handleSaveSupabaseConfig}
								>
									Save Supabase Config
								</DropdownMenuItem>
							</div>
						</DropdownMenuSubContent>
					</DropdownMenuPortal>
				</DropdownMenuSub>
				<DropdownMenuSeparator />
				<DropdownMenuItem
					onClick={handleSignOut}
					className="text-destructive focus:bg-destructive focus:text-destructive-foreground"
				>
					<LogOut className="mr-2 h-4 w-4" />
					Sign out
				</DropdownMenuItem>
			</DropdownMenuContent>
		</DropdownMenu>
	);
}
