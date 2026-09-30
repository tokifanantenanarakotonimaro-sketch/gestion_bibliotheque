type TablePaginationProps = { total: number; page: number; pageSize?: number; itemLabel?: string; onPageChange: (page: number) => void };

export function TablePagination({ total, page, pageSize = 5, itemLabel = 'élément', onPageChange }: TablePaginationProps) {
  const pages = Math.max(1, Math.ceil(total / pageSize));
  return <div className="pagination table-pagination"><span>Total : {total} {itemLabel}{total !== 1 ? 's' : ''}</span><span className="pagination-controls"><button type="button" disabled={page === 1} onClick={() => onPageChange(page - 1)}>‹</button>{Array.from({ length: pages }, (_, index) => index + 1).map(number => <button type="button" key={number} className={number === page ? 'current' : ''} onClick={() => onPageChange(number)}>{number}</button>)}<button type="button" disabled={page === pages} onClick={() => onPageChange(page + 1)}>›</button></span></div>;
}
