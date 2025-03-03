import { forwardRef, useState, useRef, useEffect } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { X } from "lucide-react";
import { Card } from "@/components/ui/card";
import { useDraggable } from "@dnd-kit/core";
import { Button } from "@/components/ui/button";

interface CourseCardProps {
	id: string;
	courseCode: string;
	courseName: string;
	style?: React.CSSProperties;
	onClick?: (e: React.MouseEvent) => void;
	onDelete?: (id: string) => void;
}

// Base presentational component
export const CourseCard = forwardRef<HTMLDivElement, CourseCardProps>(
	({ id, courseCode, courseName, style, onClick, onDelete, ...props }, ref) => {
		const handleDelete = (e: React.MouseEvent) => {
			e.stopPropagation(); // Prevent triggering onClick
			if (onDelete) {
				onDelete(id);
			}
		};

		return (
			<Card
				ref={ref}
				className="p-4 cursor-pointer hover:bg-muted/50 transition-colors relative group"
				style={style}
				onClick={onClick}
				{...props}
			>
				<div className="flex items-start justify-between gap-2">
					<div>
						<div className="font-semibold">{courseCode}</div>
						<div className="text-sm text-muted-foreground">{courseName}</div>
					</div>
				</div>
				{onDelete && (
					<Button
						variant="ghost"
						size="icon"
						className="h-6 w-6 p-0 absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity"
						onClick={handleDelete}
						aria-label="Delete course"
					>
						<X className="h-4 w-4" />
					</Button>
				)}
			</Card>
		);
	},
);

CourseCard.displayName = "CourseCard";

// Sortable wrapper component
export function SortableCourseCard(props: CourseCardProps) {
	const {
		attributes,
		listeners,
		setNodeRef,
		transform,
		transition,
		isDragging,
	} = useSortable({
		id: props.id,
		data: {
			type: "course-card",
			isDraggable: true,
			isDroppable: false,
		},
	});

	const style = {
		transform: CSS.Transform.toString(transform),
		transition,
		opacity: isDragging ? 0.5 : undefined,
		width: "100%",
		...props.style,
	};

	// Track if we're in a drag operation
	const [dragStarted, setDragStarted] = useState(false);
	const dragTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

	// Handle drag start
	useEffect(() => {
		if (isDragging && !dragStarted) {
			setDragStarted(true);
		}
	}, [isDragging, dragStarted]);

	// Reset drag state after drag ends
	useEffect(() => {
		if (!isDragging && dragStarted) {
			// Use a small timeout to ensure click doesn't trigger immediately after drag
			if (dragTimeoutRef.current) {
				clearTimeout(dragTimeoutRef.current);
			}

			dragTimeoutRef.current = setTimeout(() => {
				setDragStarted(false);
			}, 100);
		}

		return () => {
			if (dragTimeoutRef.current) {
				clearTimeout(dragTimeoutRef.current);
			}
		};
	}, [isDragging, dragStarted]);

	const handleClick = (e: React.MouseEvent) => {
		// Prevent click during or immediately after drag
		if (isDragging || dragStarted) {
			e.preventDefault();
			e.stopPropagation();
			return;
		}

		if (props.onClick) {
			props.onClick(e);
		}
	};

	return (
		<CourseCard
			{...props}
			ref={setNodeRef}
			style={style}
			onClick={handleClick}
			{...attributes}
			{...listeners}
			data-sortable="course-card"
		/>
	);
}

export function DraggableCourseCard({
	id,
	courseCode,
	courseName,
	onDelete,
	onClick,
}: CourseCardProps) {
	const { attributes, listeners, setNodeRef, transform, isDragging } =
		useDraggable({
			id,
		});

	const style = transform
		? {
				transform: CSS.Translate.toString(transform),
			}
		: undefined;

	// Track if we're in a drag operation
	const [dragStarted, setDragStarted] = useState(false);
	const dragTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

	// Handle drag start
	useEffect(() => {
		if (isDragging && !dragStarted) {
			setDragStarted(true);
		}
	}, [isDragging, dragStarted]);

	// Reset drag state after drag ends
	useEffect(() => {
		if (!isDragging && dragStarted) {
			// Use a small timeout to ensure click doesn't trigger immediately after drag
			if (dragTimeoutRef.current) {
				clearTimeout(dragTimeoutRef.current);
			}

			dragTimeoutRef.current = setTimeout(() => {
				setDragStarted(false);
			}, 100);
		}

		return () => {
			if (dragTimeoutRef.current) {
				clearTimeout(dragTimeoutRef.current);
			}
		};
	}, [isDragging, dragStarted]);

	const handleClick = (e: React.MouseEvent) => {
		// Prevent click during or immediately after drag
		if (isDragging || dragStarted) {
			e.preventDefault();
			e.stopPropagation();
			return;
		}

		if (onClick) {
			onClick(e);
		}
	};

	return (
		<div ref={setNodeRef} style={style} {...listeners} {...attributes}>
			<CourseCard
				id={id}
				courseCode={courseCode}
				courseName={courseName}
				onDelete={onDelete}
				onClick={handleClick}
			/>
		</div>
	);
}
