import type { TaskPriority } from "../types";

export type PriorityFilter = TaskPriority | "all";

interface FilterBarProps {
  value: PriorityFilter;
  onChange: (value: PriorityFilter) => void;
  sortByDue: boolean;
  onSortByDueChange: (sortByDue: boolean) => void;
}

const FILTERS: { value: PriorityFilter; label: string }[] = [
  { value: "all", label: "All" },
  { value: "high", label: "High" },
  { value: "medium", label: "Medium" },
  { value: "low", label: "Low" },
];

export const FilterBar = ({
  value,
  onChange,
  sortByDue,
  onSortByDueChange,
}: FilterBarProps) => {
  return (
    <div className="filter-bar" role="group" aria-label="Filter by priority">
      {FILTERS.map((filter) => (
        <button
          key={filter.value}
          type="button"
          aria-pressed={value === filter.value}
          onClick={() => onChange(filter.value)}
        >
          {filter.label}
        </button>
      ))}
      <button
        type="button"
        aria-pressed={sortByDue}
        onClick={() => onSortByDueChange(!sortByDue)}
      >
        Sort by due date
      </button>
    </div>
  );
};
