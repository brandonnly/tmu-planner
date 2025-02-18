import { Moon, Sun, SunMoon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from "@/components/ui/tooltip";
import { useTheme } from "@/components/theme-provider";

export function ThemeToggle() {
	const { theme, setTheme } = useTheme();

	const nextTheme: Record<typeof theme, typeof theme> = {
		light: "dark",
		dark: "system",
		system: "light",
	};

	const icons = {
		light: <Sun className="size-5" />,
		dark: <Moon className="size-5" />,
		system: <SunMoon className="size-5" />,
	};

	return (
		<TooltipProvider>
			<Tooltip>
				<TooltipTrigger asChild>
					<Button
						variant="outline"
						size="icon"
						onClick={() => setTheme(nextTheme[theme])}
					>
						{icons[theme]}
					</Button>
				</TooltipTrigger>
				<TooltipContent>
					<p>Switch to {nextTheme[theme]} theme</p>
				</TooltipContent>
			</Tooltip>
		</TooltipProvider>
	);
}
