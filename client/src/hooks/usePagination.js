import { useMemo, useState } from "react";

export function usePagination({ initialPage = 1, pageSize = 50 } = {}) {
  const [page, setPage] = useState(initialPage);

  const limit = pageSize;
  const offset = useMemo(() => (page - 1) * pageSize, [page, pageSize]);

  function goTo(nextPage) {
    setPage(Math.max(1, Number(nextPage) || 1));
  }

  function reset() {
    setPage(1);
  }

  return { page, pageSize, limit, offset, goTo, reset, setPage };
}
