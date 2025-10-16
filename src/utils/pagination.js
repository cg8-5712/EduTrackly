// src/utils/pagination.js
export function getPagination(page = 1, size = 20) {
  page = parseInt(page);
  size = parseInt(size);
  const offset = (page - 1) * size;
  return { page, size, offset };
}

export function getPagingData(rows, total, page, size) {
  const pages = Math.ceil(total / size);
  return { rows, pagination: { page, size, total, pages } };
}
