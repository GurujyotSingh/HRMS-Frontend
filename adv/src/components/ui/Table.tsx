import React from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faSort, faSortUp, faSortDown } from '@fortawesome/free-solid-svg-icons';

interface Column<T = any> {
  key: string;
  title: string;
  render?: (row: T) => React.ReactNode;
  sortable?: boolean;
  width?: string | number;
}

interface TableProps<T = any> {
  columns: Column<T>[];
  data: T[];
  loading?: boolean;
  onSort?: (key: string) => void;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  onRowClick?: (row: T) => void;
  emptyMessage?: string;
}

const Table = <T extends Record<string, any>>({
  columns,
  data,
  loading = false,
  onSort,
  sortBy,
  sortOrder,
  onRowClick,
  emptyMessage = 'No data available',
}: TableProps<T>) => {
  const getSortIcon = (key: string) => {
    if (sortBy !== key) return faSort;
    return sortOrder === 'asc' ? faSortUp : faSortDown;
  };

  if (loading) {
    return (
      <div className="table-loading">
        <div className="spinner"></div>
        <p>Loading data...</p>
      </div>
    );
  }

  return (
    <div className="table-responsive">
      <table className="data-table">
        <thead>
          <tr>
            {columns.map((column) => (
              <th
                key={column.key}
                style={{ width: column.width }}
                onClick={() => column.sortable && onSort?.(column.key)}
                className={column.sortable ? 'sortable' : ''}
              >
                <div className="th-content">
                  {column.title}
                  {column.sortable && (
                    <FontAwesomeIcon icon={getSortIcon(column.key)} className="sort-icon" />
                  )}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.length > 0 ? (
            data.map((row, index) => (
              <tr
                key={index}
                onClick={() => onRowClick?.(row)}
                className={onRowClick ? 'clickable' : ''}
              >
                {columns.map((column) => (
                  <td key={column.key}>
                    {column.render ? column.render(row) : row[column.key]}
                  </td>
                ))}
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={columns.length} className="empty-message">
                {emptyMessage}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default Table;