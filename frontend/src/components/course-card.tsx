import { forwardRef } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { InfoIcon } from "lucide-react";
import { Card } from "@/components/ui/card";
import { useDraggable } from "@dnd-kit/core";

interface CourseCardProps {
	id: string;
	courseCode: string;
	courseName: string;
	style?: React.CSSProperties;
	onClick?: (e: React.MouseEvent) => void;
}

// Base presentational component
export const CourseCard = forwardRef<HTMLDivElement, CourseCardProps>(
	({ id, courseCode, courseName, style, onClick, ...props }, ref) => {
		return (
			<Card
				ref={ref}
				className="p-4 cursor-pointer hover:bg-muted/50 transition-colors"
				style={style}
				onClick={onClick}
				{...props}
			>
				<div className="flex items-start justify-between gap-2">
					<div>
						<div className="font-semibold">{courseCode}</div>
						<div className="text-sm text-muted-foreground">{courseName}</div>
					</div>
					<InfoIcon className="w-4 h-4 text-muted-foreground shrink-0" />
				</div>
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

	const handleClick = (e: React.MouseEvent) => {
		// Prevent click during drag
		if (isDragging) {
			e.preventDefault();
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
}: CourseCardProps) {
	const { attributes, listeners, setNodeRef, transform } = useDraggable({
		id,
	});

	const style = transform
		? {
				transform: CSS.Translate.toString(transform),
			}
		: undefined;

	return (
		<div ref={setNodeRef} style={style} {...listeners} {...attributes}>
			<CourseCard id={id} courseCode={courseCode} courseName={courseName} />
		</div>
	);
}
