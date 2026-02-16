import type { GradeTier, GradeResult } from "@/lib/types";

const PROMPT_DIMENSIONS = ["Clarity", "Specificity", "Structure", "Conciseness", "Task Definition"];
const WRITING_DIMENSIONS = ["Grammar", "Clarity", "Tone", "Structure", "Word Choice"];

const tierColors: Record<GradeTier, string> = {
  "Excellent": "bg-green-100 text-green-800",
  "Good": "bg-yellow-100 text-yellow-800",
  "Needs Work": "bg-red-100 text-red-800",
};

interface GradeCardProps {
  grade: GradeResult;
  detectedMode: "prompt" | "general";
}

export function GradeCard({ grade, detectedMode }: GradeCardProps) {
  const orderedDimensions = detectedMode === "prompt" ? PROMPT_DIMENSIONS : WRITING_DIMENSIONS;

  return (
    <div className="mt-3 rounded-lg border border-gray-200 bg-gray-50 p-3 text-sm">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">Grade</span>
        <span
          className={`px-2 py-0.5 rounded-full text-xs font-semibold ${tierColors[grade.overall]}`}
        >
          {grade.overall}
        </span>
      </div>

      <div className="border-t border-gray-200 my-2" />

      <div className="space-y-1.5 mb-2">
        {orderedDimensions.map((dim) => {
          const tier = (grade.dimensions[dim] as GradeTier) ?? "Good";
          return (
            <div key={dim} className="flex items-center justify-between">
              <span className="text-gray-600 text-xs">{dim}</span>
              <span
                className={`px-2 py-0.5 rounded-full text-[11px] font-medium ${tierColors[tier]}`}
              >
                {tier}
              </span>
            </div>
          );
        })}
      </div>

      {grade.feedback.length > 0 && (
        <>
          <div className="border-t border-gray-200 my-2" />
          <div className="space-y-1.5">
            {grade.feedback.map((bullet, i) => (
              <p key={i} className="text-gray-600 text-xs leading-relaxed">
                {bullet}
              </p>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
