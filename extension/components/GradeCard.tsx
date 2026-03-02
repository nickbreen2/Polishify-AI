import type { GradeResult } from "@/lib/types";

interface GradeCardProps {
  grade: GradeResult;
}

export function GradeCard({ grade }: GradeCardProps) {
  if (!grade.feedback.length) return null;

  return (
    <div className="mt-3 rounded-lg border border-gray-200 bg-gray-50 p-3 text-sm">
      <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">How to improve</span>
      <div className="mt-2 space-y-1.5">
        {grade.feedback.map((bullet, i) => (
          <p key={i} className="text-gray-600 text-xs leading-relaxed">• {bullet}</p>
        ))}
      </div>
    </div>
  );
}
