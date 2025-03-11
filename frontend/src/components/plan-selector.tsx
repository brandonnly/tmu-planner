import * as React from "react";
import { Check, ChevronsUpDown, Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
	Command,
	CommandEmpty,
	CommandGroup,
	CommandInput,
	CommandItem,
	CommandList,
	CommandSeparator,
} from "@/components/ui/command";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import { useObservable } from "@legendapp/state/react";
import { plans$, selectedPlanId$, actions } from "@/state";
import { toast } from "sonner";
import type { Database } from "@/types/database.types";
import { auth$ } from "@/state";

type Plan = Database["public"]["Tables"]["user_plan"]["Row"];

export function PlanSelector() {
	const [open, setOpen] = React.useState(false);
	const plans = useObservable(plans$);
	const selectedId = useObservable(selectedPlanId$);
	const userId = useObservable(auth$.user);

	// Convert plans object to array and sort by name
	const plansList = React.useMemo(() => {
		const plansData = plans.get() ?? {};
		return Object.entries(plansData)
			.map(([id, plan]) => ({
				id,
				name: plan?.name ?? "Untitled Plan",
				starting_semester_term: plan?.starting_semester_term,
				ending_semester_term: plan?.ending_semester_term,
				starting_semester_year: plan?.starting_semester_year,
				ending_semester_year: plan?.ending_semester_year,
				notes: plan?.notes ?? "",
				created_at: plan?.created_at,
				updated_at: plan?.updated_at,
			}))
			.sort((a, b) => (a.name ?? "").localeCompare(b.name ?? ""));
	}, [plans]);

	const selectedPlan = React.useMemo(() => {
		const currentId = selectedId.get();
		return plansList.find((plan) => plan.id === currentId);
	}, [plansList, selectedId]);

	const handleCreateNewPlan = React.useCallback(async () => {
		const name = `New Plan ${plansList.length + 1}`;
		const currentYear = new Date().getFullYear();
		const planId = crypto.randomUUID();
		const currentUserId = userId.get();

		try {
			const newPlan: Database["public"]["Tables"]["user_plan"]["Row"] = {
				id: planId,
				user_id: currentUserId ?? crypto.randomUUID(), // Use a random UUID for anonymous users
				name,
				starting_semester_term: "Fall",
				ending_semester_term: "Winter",
				starting_semester_year: currentYear,
				ending_semester_year: currentYear + 4,
				notes: null,
				created_at: new Date().toISOString(),
				updated_at: new Date().toISOString(),
			};

			// Add to plans observable - we'll handle Supabase sync when they log in
			plans$[planId].set(newPlan);

			// Select the new plan
			actions.selectPlan(planId);
			setOpen(false);

			toast.success("Created new plan", {
				description: "You can now start adding courses to your plan.",
			});
		} catch (error) {
			console.error("Error creating plan:", error);
			toast.error("Failed to create plan");
		}
	}, [plansList.length, userId]);

	return (
		<Popover open={open} onOpenChange={setOpen}>
			<PopoverTrigger asChild>
				<Button
					variant="outline"
					role="combobox"
					aria-expanded={open}
					className="w-[300px] justify-between"
				>
					{selectedPlan ? (
						<span>
							{selectedPlan.name} ({selectedPlan.starting_semester_year}-
							{selectedPlan.ending_semester_year})
						</span>
					) : (
						"Select a plan..."
					)}
					<ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
				</Button>
			</PopoverTrigger>
			<PopoverContent className="w-[300px] p-0">
				<Command>
					<CommandInput placeholder="Search plans..." />
					<CommandList>
						<CommandEmpty>No plans found.</CommandEmpty>
						<CommandGroup heading="Your Plans">
							{plansList.map((plan) => (
								<CommandItem
									key={plan.id}
									value={plan.id}
									onSelect={() => {
										actions.selectPlan(plan.id);
										setOpen(false);
									}}
								>
									<Check
										className={cn(
											"mr-2 h-4 w-4",
											selectedId.get() === plan.id
												? "opacity-100"
												: "opacity-0",
										)}
									/>
									<span>
										{plan.name} ({plan.starting_semester_year}-
										{plan.ending_semester_year})
									</span>
								</CommandItem>
							))}
						</CommandGroup>
						<CommandSeparator />
						<CommandGroup>
							<CommandItem onSelect={handleCreateNewPlan}>
								<Plus className="mr-2 h-4 w-4" />
								Create New Plan
							</CommandItem>
						</CommandGroup>
					</CommandList>
				</Command>
			</PopoverContent>
		</Popover>
	);
}
