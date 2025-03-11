import * as React from "react";
import { Check, ChevronsUpDown, PlusCircle, Trash2 } from "lucide-react";
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
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from "@/components/ui/popover";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import type { Database } from "@/types/database.types";
import { toast } from "sonner";

import { useObservable } from "@legendapp/state/react";
import { Memo } from "@legendapp/state/react";
import { plans$, selectedPlanId$, newPlan, deletePlan } from "@/state";
import { batch } from "@legendapp/state";

type Term = Database["public"]["Enums"]["term"];

type Plan = {
	id: string;
	name: string;
	starting_semester_term: Term;
	starting_semester_year: number;
	ending_semester_term: Term;
	ending_semester_year: number;
	created_at: string;
	updated_at: string;
	user_id: string;
	notes: string | null;
};

type Plans = Record<string, Plan>;

export function PlanSelector() {
	const [open, setOpen] = React.useState(false);
	const [createDialogOpen, setCreateDialogOpen] = React.useState(false);
	const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);
	const [planToDelete, setPlanToDelete] = React.useState<string | null>(null);
	const [planNameToDelete, setPlanNameToDelete] = React.useState<string>("");
	const [searchQuery, setSearchQuery] = React.useState("");
	const plans = useObservable(plans$);
	const selectedPlanId = useObservable(selectedPlanId$);

	// Handle selecting a plan
	const handleSelectPlan = (planId: string) => {
		// Use double casting to bypass type checking
		(selectedPlanId$ as unknown as { set(value: string): void }).set(planId);
		setOpen(false);
	};

	const handleCreatePlan = (plan: {
		name: string;
		startTerm: Term;
		startYear: number;
		endTerm: Term;
		endYear: number;
	}) => {
		const newPlanId = newPlan({
			name: plan.name,
			starting_semester_term: plan.startTerm,
			starting_semester_year: plan.startYear,
			ending_semester_term: plan.endTerm,
			ending_semester_year: plan.endYear,
		});

		batch(() => {
			// Use double casting to bypass type checking
			(selectedPlanId$ as unknown as { set(value: string): void }).set(
				newPlanId,
			);
			setCreateDialogOpen(false);
		});

		toast.success(`Plan "${plan.name}" created successfully`);
	};

	// Handle opening the create plan dialog separately from the popover
	const handleOpenCreateDialog = () => {
		setOpen(false);
		// Wait for the popover to fully close before opening the dialog
		setTimeout(() => {
			setCreateDialogOpen(true);
		}, 150);
	};

	// Handle opening the delete confirmation dialog
	const handleOpenDeleteDialog = (
		planId: string,
		planName: string,
		e: React.MouseEvent,
	) => {
		e.stopPropagation(); // Prevent triggering the CommandItem onSelect
		setPlanToDelete(planId);
		setPlanNameToDelete(planName);
		setDeleteDialogOpen(true);
		setOpen(false); // Close the popover when opening the delete dialog
	};

	return (
		<>
			<Popover open={open} onOpenChange={setOpen}>
				<PopoverTrigger asChild>
					<Button
						variant="outline"
						aria-expanded={open}
						className="w-[240px] justify-between"
					>
						<Memo>
							{() => {
								const currentId = selectedPlanId.get();
								const currentPlans = plans.get();

								if (
									currentId &&
									typeof currentId === "string" &&
									currentPlans[currentId]
								) {
									const plan = currentPlans[currentId];
									const name =
										typeof plan.name === "string"
											? plan.name
											: String(plan.name);
									return `${name}`;
								}
								return "Select a plan...";
							}}
						</Memo>
						<ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
					</Button>
				</PopoverTrigger>
				<PopoverContent className="w-[300px] p-0">
					<Command
						filter={(value, search) => {
							// We're handling filtering manually, so always return 1
							return 1;
						}}
					>
						<CommandInput
							placeholder="Search plans..."
							value={searchQuery}
							onValueChange={setSearchQuery}
						/>
						<CommandList>
							<CommandGroup heading="Your Plans">
								<Memo>
									{() => {
										// Get all plans and convert to a list format with year range
										const allPlans = Object.entries(plans.get()).map(
											([id, plan]) => ({
												id,
												name:
													typeof plan.name === "string"
														? plan.name
														: String(plan.name),
												yearRange: `${plan.starting_semester_year}-${plan.ending_semester_year}`,
												startYear: plan.starting_semester_year,
												endYear: plan.ending_semester_year,
											}),
										);

										// Filter plans based on search query
										const filteredPlans = !searchQuery
											? allPlans
											: allPlans.filter(
													(plan) =>
														plan.name
															.toLowerCase()
															.includes(searchQuery.toLowerCase()) ||
														plan.yearRange.includes(searchQuery),
												);

										return (
											<>
												{filteredPlans.map((plan) => (
													<CommandItem
														key={plan.id}
														value={plan.id}
														onSelect={() => handleSelectPlan(plan.id)}
														className="flex justify-between"
													>
														<div className="flex items-center">
															<Check
																className={cn(
																	"mr-2 h-4 w-4",
																	selectedPlanId.get() === plan.id
																		? "opacity-100"
																		: "opacity-0",
																)}
															/>
															<div className="flex flex-col">
																<span>{plan.name}</span>
																<span className="text-xs text-muted-foreground">
																	{plan.yearRange}
																</span>
															</div>
														</div>
														<Button
															variant="ghost"
															size="icon"
															className="h-6 w-6 ml-2 opacity-70 hover:opacity-100"
															onClick={(e) =>
																handleOpenDeleteDialog(plan.id, plan.name, e)
															}
														>
															<Trash2 className="h-4 w-4" />
															<span className="sr-only">Delete plan</span>
														</Button>
													</CommandItem>
												))}
												{filteredPlans.length === 0 && (
													<div className="py-6 text-center text-sm text-muted-foreground">
														No plans found.
													</div>
												)}
											</>
										);
									}}
								</Memo>
							</CommandGroup>
							<CommandSeparator />
							<CommandGroup>
								<CommandItem onSelect={handleOpenCreateDialog}>
									<PlusCircle className="mr-2 h-4 w-4" />
									Create New Plan
								</CommandItem>
							</CommandGroup>
						</CommandList>
					</Command>
				</PopoverContent>
			</Popover>

			{/* Separate dialog for creating a new plan */}
			<Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
				<NewPlanDialog
					onClose={() => setCreateDialogOpen(false)}
					onCreatePlan={handleCreatePlan}
				/>
			</Dialog>

			{/* Alert dialog for confirming plan deletion */}
			<AlertDialog
				open={deleteDialogOpen}
				onOpenChange={(open) => {
					setDeleteDialogOpen(open);
					// If dialog is closing and not by the delete action, reset the plan to delete
					if (!open) {
						setPlanToDelete(null);
					}
				}}
			>
				<AlertDialogContent>
					<AlertDialogHeader>
						<AlertDialogTitle>Delete Plan</AlertDialogTitle>
						<AlertDialogDescription>
							Are you sure you want to delete "{planNameToDelete}"? This action
							cannot be undone.
						</AlertDialogDescription>
					</AlertDialogHeader>
					<AlertDialogFooter>
						<AlertDialogCancel>Cancel</AlertDialogCancel>
						<AlertDialogAction
							onClick={() => {
								if (planToDelete) {
									const planName = planNameToDelete;

									// Delete the plan
									deletePlan(planToDelete);

									// If we deleted the currently selected plan, select the top-most plan if available
									if (selectedPlanId.get() === planToDelete) {
										const remainingPlans = Object.keys(plans.get());
										if (remainingPlans.length > 0) {
											// Select the first plan in the list
											(
												selectedPlanId$ as unknown as {
													set(value: string): void;
												}
											).set(remainingPlans[0]);
										}
									}

									// Show toast notification
									toast.success(`Plan "${planName}" deleted successfully`, {
										description: "The plan has been permanently removed.",
									});
								}
							}}
						>
							Delete
						</AlertDialogAction>
					</AlertDialogFooter>
				</AlertDialogContent>
			</AlertDialog>
		</>
	);
}

function NewPlanDialog({
	onClose,
	onCreatePlan,
}: {
	onClose: () => void;
	onCreatePlan: (plan: {
		name: string;
		startTerm: Term;
		startYear: number;
		endTerm: Term;
		endYear: number;
	}) => void;
}) {
	const [name, setName] = React.useState("");
	const [startTerm, setStartTerm] = React.useState<Term>("Fall");
	const [startYear, setStartYear] = React.useState(new Date().getFullYear());
	const [endTerm, setEndTerm] = React.useState<Term>("Winter");
	const [endYear, setEndYear] = React.useState(new Date().getFullYear() + 4);

	const handleCreatePlan = () => {
		onCreatePlan({
			name,
			startTerm,
			startYear,
			endTerm,
			endYear,
		});

		onClose();
	};

	return (
		<DialogContent className="sm:max-w-[425px]">
			<DialogHeader>
				<DialogTitle>Create New Degree Plan</DialogTitle>
				<DialogDescription>
					Create a new plan for your academic journey.
				</DialogDescription>
			</DialogHeader>
			<div className="grid gap-4 py-4">
				<div className="grid grid-cols-4 items-center gap-4">
					<Label htmlFor="name" className="text-right">
						Plan Name
					</Label>
					<Input
						id="name"
						value={name}
						onChange={(e) => setName(e.target.value)}
						className="col-span-3"
						placeholder="My Degree Plan"
					/>
				</div>
				<div className="grid grid-cols-4 items-center gap-4">
					<Label className="text-right">Start</Label>
					<div className="col-span-3 flex gap-2">
						<Select
							value={startTerm}
							onValueChange={(value) => setStartTerm(value as Term)}
						>
							<SelectTrigger className="w-[180px]">
								<SelectValue placeholder="Term" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="Fall">Fall</SelectItem>
								<SelectItem value="Winter">Winter</SelectItem>
								<SelectItem value="Spring/Summer">Spring/Summer</SelectItem>
							</SelectContent>
						</Select>
						<Input
							type="number"
							value={startYear}
							onChange={(e) => setStartYear(Number.parseInt(e.target.value))}
							className="w-24"
						/>
					</div>
				</div>
				<div className="grid grid-cols-4 items-center gap-4">
					<Label className="text-right">End</Label>
					<div className="col-span-3 flex gap-2">
						<Select
							value={endTerm}
							onValueChange={(value) => setEndTerm(value as Term)}
						>
							<SelectTrigger className="w-[180px]">
								<SelectValue placeholder="Term" />
							</SelectTrigger>
							<SelectContent>
								<SelectItem value="Fall">Fall</SelectItem>
								<SelectItem value="Winter">Winter</SelectItem>
								<SelectItem value="Spring/Summer">Spring/Summer</SelectItem>
							</SelectContent>
						</Select>
						<Input
							type="number"
							value={endYear}
							onChange={(e) => setEndYear(Number.parseInt(e.target.value))}
							className="w-24"
						/>
					</div>
				</div>
			</div>
			<DialogFooter>
				<Button variant="outline" onClick={onClose}>
					Cancel
				</Button>
				<Button type="submit" onClick={handleCreatePlan} disabled={!name}>
					Create Plan
				</Button>
			</DialogFooter>
		</DialogContent>
	);
}
