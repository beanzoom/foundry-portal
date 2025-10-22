interface SectionDividerProps {
  title: string;
  description?: string | null;
}

export function SectionDivider({ title, description }: SectionDividerProps) {
  return (
    <div className="mb-6 pb-4 border-b-2 border-purple-200">
      <h2 className="text-2xl font-bold text-gray-900 mb-2">
        {title}
      </h2>
      {description && (
        <p className="text-gray-600">{description}</p>
      )}
    </div>
  );
}
