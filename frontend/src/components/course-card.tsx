import { useDraggable } from "@dnd-kit/core";
import { Card } from "@/components/ui/card";
import { InfoIcon } from "lucide-react";

interface CourseCardProps {
  courseCode: string;
  courseName: string;
  id: string;
}

export function CourseCard({ courseCode, courseName, id }: CourseCardProps) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: id,
  });

  const style = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
      }
    : undefined;

  const handleClick = (e: React.MouseEvent) => {
    // Only handle click if it's not part of a drag
    if (!isDragging) {
      console.log("Card clicked:", courseCode);
    }
  };

  return (
    <Card
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      onClick={handleClick}
      className={`relative w-64 p-4 cursor-grab active:cursor-grabbing hover:shadow-md transition-shadow ${
        isDragging ? 'opacity-50' : ''
      }`}
    >
      <div className="absolute top-2 right-2">
        <InfoIcon className="w-4 h-4 text-muted-foreground hover:text-foreground transition-colors" />
      </div>
      <div className="space-y-1">
        <h3 className="font-bold">{courseCode}</h3>
        <p className="text-sm text-muted-foreground">{courseName}</p>
      </div>
    </Card>
  );
} 