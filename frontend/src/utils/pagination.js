export const getPaginationItems = (totalPages, currentPage) => {
  const total = Math.max(1, Math.floor(Number(totalPages) || 1));
  const current = Math.min(total, Math.max(1, Math.floor(Number(currentPage) || 1)));

  if (total <= 7) return Array.from({ length: total }, (_, index) => index + 1);

  const pages = new Set([1, total]);
  const addRange = (start, end) => {
    for (let page = start; page <= end; page += 1) pages.add(page);
  };

  addRange(Math.max(2, current - 1), Math.min(total - 1, current + 1));
  if (current <= 4) addRange(2, Math.min(5, total - 1));
  if (current >= total - 3) addRange(Math.max(2, total - 4), total - 1);

  const sortedPages = [...pages].sort((a, b) => a - b);
  const items = [];
  sortedPages.forEach((page, index) => {
    if (index > 0 && page - sortedPages[index - 1] > 1) {
      items.push(index === 1 ? 'ellipsis-start' : 'ellipsis-end');
    }
    items.push(page);
  });
  return items;
};
