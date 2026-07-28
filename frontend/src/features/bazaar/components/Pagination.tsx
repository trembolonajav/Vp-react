interface PaginationProps {
  page: number;
  totalPages: number;
  onChange: (page: number) => void;
}

export function Pagination({ page, totalPages, onChange }: PaginationProps) {
  if (totalPages < 2) return null;

  return (
    <div className="bz-pager">
      <button type="button" disabled={page === 1} onClick={() => onChange(page - 1)}>
        ‹ Anterior
      </button>
      <span>
        Página {page} de {totalPages}
      </span>
      <button type="button" disabled={page === totalPages} onClick={() => onChange(page + 1)}>
        Próxima ›
      </button>
    </div>
  );
}
