/**
 * Keyboard-operable pagination for the completion history (inline pattern
 * from QuestListPage, not an extraction refactor). Targets are at least
 * 44px so they remain usable on narrow screens.
 */
export default function PassportPagination({
  page,
  totalPages,
  hasPreviousPage,
  hasNextPage,
  onPageChange,
}: {
  page: number;
  totalPages: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
  onPageChange: (page: number) => void;
}) {
  return (
    <div className="mt-6 flex items-center justify-center gap-4">
      <button
        aria-label="Go to previous page"
        className="btn btn-outline min-h-11 min-w-11 rounded-full"
        disabled={!hasPreviousPage}
        onClick={() => onPageChange(page - 1)}
        type="button"
      >
        Previous
      </button>
      <span className="text-sm">
        Page {page} of {totalPages}
      </span>
      <button
        aria-label="Go to next page"
        className="btn btn-outline min-h-11 min-w-11 rounded-full"
        disabled={!hasNextPage}
        onClick={() => onPageChange(page + 1)}
        type="button"
      >
        Next
      </button>
    </div>
  );
}
