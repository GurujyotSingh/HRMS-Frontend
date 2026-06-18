import React, { useEffect, useState } from 'react';

/* ═══════════════════════════════════════════════════════════════════════════
   TOAST SYSTEM
   ═══════════════════════════════════════════════════════════════════════════ */

const toastListeners = new Set();
let toastId = 0;

export function toast(msg, type = 'info') {
  const id = ++toastId;
  const item = { id, msg, type };
  toastListeners.forEach((fn) => fn(item));
}

export function ToastContainer() {
  const [items, setItems] = useState([]);

  useEffect(() => {
    const onToast = (t) => {
      setItems((prev) => [...prev, t]);
      setTimeout(() => {
        setItems((prev) => prev.filter((x) => x.id !== t.id));
      }, 4000);
    };
    toastListeners.add(onToast);
    return () => toastListeners.delete(onToast);
  }, []);

  const iconMap = {
    success: '✓',
    error: '✕',
    info: 'ℹ',
    warning: '⚠',
  };

  const colorMap = {
    success: { bg: 'var(--success)', accent: 'rgba(16, 185, 129, 0.1)' },
    error:   { bg: 'var(--danger)',  accent: 'rgba(239, 68, 68, 0.1)' },
    info:    { bg: 'var(--primary)', accent: 'rgba(30, 23, 96, 0.1)' },
    warning: { bg: 'var(--warning)', accent: 'rgba(255, 172, 12, 0.1)' },
  };

  return (
    <div
      style={{
        position: 'fixed',
        top: 16,
        right: 16,
        zIndex: 20000,
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
        maxWidth: 400,
        pointerEvents: 'none',
      }}
    >
      {items.map((t) => {
        const c = colorMap[t.type] || colorMap.info;
        return (
          <div
            key={t.id}
            style={{
              animation: 'slideInRight 0.3s ease-out',
              background: 'var(--white)',
              color: 'var(--text-dark)',
              padding: '12px 16px',
              borderRadius: '10px',
              borderLeft: `3px solid ${c.bg}`,
              fontSize: 13,
              boxShadow: 'var(--shadow)',
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              pointerEvents: 'auto',
              border: '1px solid var(--gray-200)',
            }}
          >
            <span
              style={{
                width: 26,
                height: 26,
                borderRadius: '50%',
                background: c.accent,
                color: c.bg,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 700,
                fontSize: 12,
                flexShrink: 0,
              }}
            >
              {iconMap[t.type] || iconMap.info}
            </span>
            <span style={{ flex: 1, lineHeight: 1.4, fontWeight: 500 }}>{t.msg}</span>
            <button
              onClick={() => setItems((prev) => prev.filter((x) => x.id !== t.id))}
              style={{
                background: 'none',
                border: 'none',
                color: 'var(--gray-500)',
                cursor: 'pointer',
                fontSize: 16,
                lineHeight: 1,
                padding: 4,
                flexShrink: 0,
                borderRadius: '4px',
                transition: 'all 0.15s',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--gray-100)')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'none')}
            >
              ×
            </button>
          </div>
        );
      })}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   SPINNER
   ═══════════════════════════════════════════════════════════════════════════ */

export function Spinner({ size = 20, color = 'var(--primary)' }) {
  return (
    <span
      style={{
        display: 'inline-block',
        width: size,
        height: size,
        border: `2px solid ${color}20`,
        borderTopColor: color,
        borderRadius: '50%',
        animation: 'spin 0.6s linear infinite',
        verticalAlign: 'middle',
      }}
    />
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   BUTTON
   ═══════════════════════════════════════════════════════════════════════════ */

const btnBase = {
  border: 'none',
  borderRadius: '6px',
  fontFamily: 'var(--font-body)',
  fontWeight: 500,
  cursor: 'pointer',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 6,
  transition: 'all 0.15s ease',
  outline: 'none',
  letterSpacing: '-0.01em',
  position: 'relative',
  whiteSpace: 'nowrap',
};

const variants = {
  primary: {
    background: 'var(--primary)',
    color: 'var(--white)',
    boxShadow: '0 1px 3px rgba(27, 110, 243, 0.25)',
  },
  secondary: {
    background: 'var(--white)',
    color: 'var(--text-dark)',
    border: '1px solid var(--border-color)',
    boxShadow: 'var(--shadow)',
  },
  ghost: {
    background: 'transparent',
    color: 'var(--text-light)',
  },
  danger: {
    background: 'var(--danger)',
    color: 'var(--white)',
    boxShadow: '0 1px 3px rgba(220, 38, 38, 0.25)',
  },
  success: {
    background: 'var(--success)',
    color: 'var(--white)',
    boxShadow: '0 1px 3px rgba(5, 150, 105, 0.25)',
  },
  outline: {
    background: 'transparent',
    color: 'var(--primary)',
    border: '1px solid var(--primary)',
  },
};

const sizes = {
  xs: { padding: '4px 10px', fontSize: 12 },
  sm: { padding: '6px 14px', fontSize: 13 },
  md: { padding: '8px 16px', fontSize: 13 },
  lg: { padding: '10px 22px', fontSize: 14 },
};

export function Btn({
  variant = 'primary',
  size = 'md',
  loading,
  disabled,
  onClick,
  type = 'button',
  style,
  children,
  ...rest
}) {
  const dim = disabled || loading;
  return (
    <button
      type={type}
      onClick={dim ? undefined : onClick}
      style={{
        ...btnBase,
        ...variants[variant],
        ...sizes[size],
        opacity: dim ? 0.55 : 1,
        cursor: dim ? 'not-allowed' : 'pointer',
        ...style,
      }}
      disabled={dim}
      onMouseEnter={(e) => {
        if (!dim) {
          e.currentTarget.style.transform = 'translateY(-1px)';
          e.currentTarget.style.filter = 'brightness(1.05)';
        }
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.filter = 'brightness(1)';
      }}
      {...rest}
    >
      {loading && <Spinner size={14} color="currentColor" />}
      {children}
    </button>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   CARD
   ═══════════════════════════════════════════════════════════════════════════ */

export function Card({ children, style, hover, ...rest }) {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      onMouseEnter={() => hover && setHovered(true)}
      onMouseLeave={() => hover && setHovered(false)}
      style={{
        background: 'var(--white)',
        border: '1px solid var(--border-color)',
        borderRadius: '10px',
        padding: 24,
        boxShadow: hovered ? '0 10px 15px rgba(0, 0, 0, 0.1)' : 'var(--shadow)',
        transition: 'box-shadow 0.25s ease, transform 0.25s ease',
        transform: hovered ? 'translateY(-2px)' : 'none',
        ...style,
      }}
      {...rest}
    >
      {children}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   INPUT
   ═══════════════════════════════════════════════════════════════════════════ */

export function Input({ label, error, style, ...props }) {
  return (
    <label style={{ display: 'block', marginBottom: 14, ...style }}>
      {label && (
        <span
          style={{
            display: 'block',
            fontSize: 13,
            fontWeight: 500,
            color: 'var(--text-light)',
            marginBottom: 5,
            letterSpacing: '-0.01em',
          }}
        >
          {label}
        </span>
      )}
      <input
        {...props}
        style={{
          width: '100%',
          padding: '8px 12px',
          borderRadius: '6px',
          border: `1px solid ${error ? 'var(--danger)' : 'var(--border-color)'}`,
          fontFamily: 'var(--font-body)',
          fontSize: 13,
          outline: 'none',
          background: 'var(--white)',
          color: 'var(--text-dark)',
          transition: 'border-color 0.15s ease, box-shadow 0.15s ease',
          letterSpacing: '-0.01em',
        }}
        onFocus={(e) => {
          e.target.style.borderColor = 'var(--primary)';
          e.target.style.boxShadow = '0 0 0 3px rgba(30, 23, 96, 0.1)';
          props.onFocus?.(e);
        }}
        onBlur={(e) => {
          e.target.style.borderColor = error ? 'var(--danger)' : 'var(--border-color)';
          e.target.style.boxShadow = 'none';
          props.onBlur?.(e);
        }}
      />
      {error && (
        <span style={{ color: 'var(--danger)', fontSize: 12, marginTop: 4, display: 'block' }}>
          {error}
        </span>
      )}
    </label>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   SELECT
   ═══════════════════════════════════════════════════════════════════════════ */

export function Select({ label, error, children, style, ...props }) {
  return (
    <label style={{ display: 'block', marginBottom: 14, ...style }}>
      {label && (
        <span
          style={{
            display: 'block',
            fontSize: 13,
            fontWeight: 500,
            color: 'var(--text-light)',
            marginBottom: 5,
            letterSpacing: '-0.01em',
          }}
        >
          {label}
        </span>
      )}
      <select
        {...props}
        style={{
          width: '100%',
          padding: '8px 12px',
          borderRadius: '6px',
          border: `1px solid ${error ? 'var(--danger)' : 'var(--border-color)'}`,
          fontFamily: 'var(--font-body)',
          fontSize: 13,
          background: 'var(--white)',
          color: 'var(--text-dark)',
          cursor: 'pointer',
          outline: 'none',
          transition: 'border-color 0.15s ease, box-shadow 0.15s ease',
          appearance: 'none',
          backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
          backgroundPosition: 'right 8px center',
          backgroundRepeat: 'no-repeat',
          backgroundSize: '18px',
          paddingRight: 32,
        }}
      >
        {children}
      </select>
      {error && (
        <span style={{ color: 'var(--danger)', fontSize: 12, marginTop: 4, display: 'block' }}>
          {error}
        </span>
      )}
    </label>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   TEXTAREA
   ═══════════════════════════════════════════════════════════════════════════ */

export function Textarea({ label, error, style, ...props }) {
  return (
    <label style={{ display: 'block', marginBottom: 14, ...style }}>
      {label && (
        <span
          style={{
            display: 'block',
            fontSize: 13,
            fontWeight: 500,
            color: 'var(--text-light)',
            marginBottom: 5,
          }}
        >
          {label}
        </span>
      )}
      <textarea
        {...props}
        style={{
          width: '100%',
          padding: '8px 12px',
          borderRadius: '6px',
          border: `1px solid ${error ? 'var(--danger)' : 'var(--border-color)'}`,
          fontFamily: 'var(--font-body)',
          fontSize: 13,
          outline: 'none',
          background: 'var(--white)',
          color: 'var(--text-dark)',
          resize: 'vertical',
          minHeight: 80,
          transition: 'border-color 0.15s ease, box-shadow 0.15s ease',
          lineHeight: 1.5,
        }}
        onFocus={(e) => {
          e.target.style.borderColor = 'var(--primary)';
          e.target.style.boxShadow = '0 0 0 3px rgba(30, 23, 96, 0.1)';
          props.onFocus?.(e);
        }}
        onBlur={(e) => {
          e.target.style.borderColor = error ? 'var(--danger)' : 'var(--border-color)';
          e.target.style.boxShadow = 'none';
          props.onBlur?.(e);
        }}
      />
      {error && (
        <span style={{ color: 'var(--danger)', fontSize: 12, marginTop: 4, display: 'block' }}>
          {error}
        </span>
      )}
    </label>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   MODAL
   ═══════════════════════════════════════════════════════════════════════════ */

export function Modal({ open, onClose, title, children, width = 500 }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === 'Escape' && onClose?.();
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', onKey);
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      role="presentation"
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0, 0, 0, 0.45)',
        backdropFilter: 'blur(6px)',
        WebkitBackdropFilter: 'blur(6px)',
        zIndex: 10000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
        animation: 'fadeIn 0.15s ease-out',
      }}
      onClick={onClose}
    >
      <div
        role="dialog"
        onClick={(e) => e.stopPropagation()}
        style={{
          animation: 'fadeInScale 0.25s ease-out',
          background: 'var(--white)',
          borderRadius: '16px',
          width: '100%',
          maxWidth: width,
          maxHeight: '90vh',
          overflow: 'auto',
          boxShadow: 'var(--shadow)',
          border: '1px solid var(--gray-200)',
        }}
      >
        <div
          style={{
            padding: '16px 20px',
            borderBottom: '1px solid var(--border-color)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            position: 'sticky',
            top: 0,
            background: 'var(--white)',
            zIndex: 1,
            borderRadius: '16px 16px 0 0',
          }}
        >
          <h2 style={{ fontSize: 16, fontWeight: 600 }}>{title}</h2>
          <button
            type="button"
            onClick={onClose}
            style={{
              border: 'none',
              background: 'transparent',
              width: 30,
              height: 30,
              borderRadius: '6px',
              fontSize: 18,
              cursor: 'pointer',
              color: 'var(--gray-500)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.15s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)';
              e.currentTarget.style.color = 'var(--danger)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'transparent';
              e.currentTarget.style.color = 'var(--gray-500)';
            }}
          >
            ×
          </button>
        </div>
        <div style={{ padding: 20 }}>{children}</div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   TABLE
   ═══════════════════════════════════════════════════════════════════════════ */

export function Table({ 
  cols, 
  rows, 
  loading, 
  emptyMsg = 'No data found',
  selectable = false,
  selectedRows = [],
  onSelectionChange = () => {},
  sortColumn = null,
  sortDirection = 'asc',
  onSort = () => {}
}) {
  if (loading) {
    const fakeRows = Array.from({ length: 5 });
    return (
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ background: 'var(--gray-100)' }}>
              {selectable && (
                <th style={{ width: 40, padding: '10px 16px', borderBottom: '1px solid var(--border-color)' }}>
                  <input type="checkbox" disabled style={{ cursor: 'not-allowed', opacity: 0.3 }} />
                </th>
              )}
              {cols.map((c) => (
                <th
                  key={c.key}
                  style={{
                    textAlign: 'left',
                    padding: '10px 16px',
                    fontSize: 11,
                    textTransform: 'uppercase',
                    letterSpacing: '0.06em',
                    fontWeight: 600,
                    color: 'var(--gray-500)',
                    borderBottom: '1px solid var(--border-color)',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {c.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {fakeRows.map((_, i) => (
              <tr key={i} style={{ background: 'var(--white)' }}>
                {selectable && (
                  <td style={{ padding: '10px 16px', borderBottom: '1px solid var(--gray-200)', verticalAlign: 'middle' }}>
                    <Skeleton width="16px" height="16px" />
                  </td>
                )}
                {cols.map((c, j) => (
                  <td
                    key={c.key}
                    style={{
                      padding: '10px 16px',
                      borderBottom: '1px solid var(--gray-200)',
                      verticalAlign: 'middle',
                    }}
                  >
                    <Skeleton width={j === 0 ? "100px" : j === 1 ? "140px" : "80px"} height="16px" />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }
  if (!rows?.length) {
    return <EmptyState title={emptyMsg} message="Records will appear here when available" />;
  }

  const allSelected = rows.length > 0 && selectedRows.length === rows.length;

  const toggleAll = () => {
    if (allSelected) {
      onSelectionChange([]);
    } else {
      onSelectionChange(rows.map(r => r.id));
    }
  };

  const toggleRow = (id) => {
    if (selectedRows.includes(id)) {
      onSelectionChange(selectedRows.filter(rId => rId !== id));
    } else {
      onSelectionChange([...selectedRows, id]);
    }
  };

  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
        <thead>
          <tr style={{ background: 'var(--gray-100)' }}>
            {selectable && (
              <th style={{ width: 40, padding: '10px 16px', borderBottom: '1px solid var(--border-color)' }}>
                <input 
                  type="checkbox" 
                  checked={allSelected} 
                  onChange={toggleAll}
                  style={{ cursor: 'pointer' }}
                />
              </th>
            )}
            {cols.map((c) => (
              <th
                key={c.key}
                onClick={() => c.sortable !== false && onSort(c.key)}
                style={{
                  textAlign: 'left',
                  padding: '10px 16px',
                  fontSize: 11,
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                  fontWeight: 600,
                  color: 'var(--gray-500)',
                  borderBottom: '1px solid var(--border-color)',
                  whiteSpace: 'nowrap',
                  cursor: c.sortable !== false ? 'pointer' : 'default',
                  userSelect: 'none'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                  {c.label}
                  {c.sortable !== false && sortColumn === c.key && (
                    <span style={{ fontSize: 14, color: 'var(--primary)' }}>
                      {sortDirection === 'asc' ? '↑' : '↓'}
                    </span>
                  )}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => {
            const isSelected = selectedRows.includes(row.id);
            return (
              <tr
                key={row.key ?? row.id ?? i}
                style={{
                  background: isSelected ? 'rgba(30, 23, 96, 0.04)' : 'var(--white)',
                  transition: 'background 0.1s',
                }}
                onMouseEnter={(e) => {
                  if (!isSelected) e.currentTarget.style.background = 'var(--gray-100)';
                }}
                onMouseLeave={(e) => {
                  if (!isSelected) e.currentTarget.style.background = 'var(--white)';
                }}
              >
                {selectable && (
                  <td style={{ padding: '10px 16px', borderBottom: '1px solid var(--gray-200)', verticalAlign: 'middle' }}>
                    <input 
                      type="checkbox" 
                      checked={isSelected}
                      onChange={() => toggleRow(row.id)}
                      style={{ cursor: 'pointer' }}
                    />
                  </td>
                )}
                {cols.map((c) => (
                  <td
                    key={c.key}
                    style={{
                      padding: '10px 16px',
                      borderBottom: '1px solid var(--gray-200)',
                      verticalAlign: 'middle',
                      color: 'var(--text-dark)',
                      lineHeight: 1.5,
                    }}
                  >
                    {c.render ? c.render(row) : row[c.key]}
                  </td>
                ))}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   STAT CARD
   ═══════════════════════════════════════════════════════════════════════════ */

export function StatCard({ label, value, icon, color = 'var(--primary)', sub }) {
  return (
    <Card style={{ padding: 18 }} hover>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
        <div
          style={{
            width: 44,
            height: 44,
            borderRadius: '10px',
            background: `${color}10`,
            color,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 20,
            flexShrink: 0,
            transition: 'transform 0.2s ease',
          }}
        >
          {icon}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontSize: 26,
              fontWeight: 700,
              color: 'var(--text-dark)',
              lineHeight: 1.1,
              letterSpacing: '-0.03em',
            }}
          >
            {value}
          </div>
          <div style={{ fontSize: 12, color: 'var(--gray-500)', marginTop: 3, fontWeight: 500 }}>
            {label}
          </div>
          {sub && (
            <div style={{ fontSize: 11, color: 'var(--text-light)', marginTop: 4 }}>{sub}</div>
          )}
        </div>
      </div>
    </Card>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   PAGE HEADER
   ═══════════════════════════════════════════════════════════════════════════ */

export function PageHeader({ title, subtitle, actions }) {
  return (
    <div
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        gap: 14,
        marginBottom: 24,
      }}
    >
      <div>
        <h1 style={{ fontSize: 22, fontWeight: 700, marginBottom: subtitle ? 4 : 0, letterSpacing: '-0.025em' }}>{title}</h1>
        {subtitle && (
          <p style={{ margin: 0, color: 'var(--gray-500)', fontSize: 13, fontWeight: 400 }}>{subtitle}</p>
        )}
      </div>
      {actions && <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>{actions}</div>}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   BADGE
   ═══════════════════════════════════════════════════════════════════════════ */

export function Badge({ children, variant = 'neutral', style }) {
  return (
    <span className={`badge badge--${variant}`} style={style}>
      {children}
    </span>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   TABS
   ═══════════════════════════════════════════════════════════════════════════ */

export function Tabs({ tabs, active, onChange }) {
  return (
    <div className="tab-bar">
      {tabs.map((t) => (
        <button
          key={t.key}
          className={`tab-btn ${active === t.key ? 'active' : ''}`}
          onClick={() => onChange(t.key)}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   STAR RATING
   ═══════════════════════════════════════════════════════════════════════════ */

export function StarRating({ value = 0, onChange, readOnly = false, size = 20 }) {
  const [hover, setHover] = useState(0);
  return (
    <div className="star-rating">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          className={star <= (hover || value) ? 'filled' : ''}
          onClick={() => !readOnly && onChange?.(star)}
          onMouseEnter={() => !readOnly && setHover(star)}
          onMouseLeave={() => !readOnly && setHover(0)}
          style={{
            cursor: readOnly ? 'default' : 'pointer',
            fontSize: size,
          }}
        >
          ★
        </button>
      ))}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   AVATAR
   ═══════════════════════════════════════════════════════════════════════════ */

export function Avatar({ name, size = 36, style }) {
  const initials = (name || '?')
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const colors = [
    { bg: '#EFF6FF', fg: '#2563EB' },
    { bg: '#ECFDF5', fg: 'var(--success)' },
    { bg: '#FEF2F2', fg: 'var(--danger)' },
    { bg: '#F5F3FF', fg: '#7C3AED' },
    { bg: '#FFF7ED', fg: '#EA580C' },
    { bg: '#F0FDFA', fg: '#0D9488' },
  ];
  const idx = (name || '').split('').reduce((a, c) => a + c.charCodeAt(0), 0) % colors.length;
  const c = colors[idx];

  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        background: c.bg,
        color: c.fg,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontWeight: 600,
        fontSize: size * 0.38,
        flexShrink: 0,
        letterSpacing: '-0.02em',
        border: `1px solid ${c.fg}18`,
        ...style,
      }}
    >
      {initials}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   EMPTY STATE
   ═══════════════════════════════════════════════════════════════════════════ */

export function EmptyState({ icon = '📋', title = 'No data', message }) {
  return (
    <div style={{ textAlign: 'center', padding: '48px 24px' }}>
      <div style={{ fontSize: 44, marginBottom: 12, opacity: 0.4 }}>{icon}</div>
      <h3 style={{ color: 'var(--text-light)', marginBottom: 6, fontSize: 16 }}>{title}</h3>
      {message && <p style={{ color: 'var(--gray-500)', fontSize: 13 }}>{message}</p>}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   PAGINATION
   ═══════════════════════════════════════════════════════════════════════════ */

export function Pagination({
  totalCount,
  pageSize,
  currentPage,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [25, 50, 100],
}) {
  const totalPages = Math.ceil(totalCount / pageSize) || 1;
  const startRow = (currentPage - 1) * pageSize + 1;
  const endRow = Math.min(currentPage * pageSize, totalCount);

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '16px 24px',
      borderTop: '1px solid var(--border-color)',
      background: 'var(--white)',
      fontSize: 13,
      flexWrap: 'wrap',
      gap: 16
    }}>
      <div style={{ color: 'var(--gray-500)' }}>
        Showing <span style={{ fontWeight: 600, color: 'var(--text-dark)' }}>{totalCount === 0 ? 0 : startRow}-{endRow}</span> of <span style={{ fontWeight: 600, color: 'var(--text-dark)' }}>{totalCount}</span> records
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ color: 'var(--gray-500)' }}>Rows per page:</span>
          <select
            value={pageSize}
            onChange={(e) => onPageSizeChange(Number(e.target.value))}
            style={{
              padding: '4px 8px',
              border: '1px solid var(--border-color)',
              borderRadius: 6,
              background: 'var(--white)',
              outline: 'none',
              cursor: 'pointer'
            }}
          >
            {pageSizeOptions.map(size => (
              <option key={size} value={size}>{size}</option>
            ))}
          </select>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 1}
            style={{
              padding: '6px 12px',
              border: '1px solid var(--border-color)',
              background: currentPage === 1 ? 'var(--gray-100)' : 'var(--white)',
              color: currentPage === 1 ? 'var(--gray-400)' : 'var(--text-dark)',
              borderRadius: 6,
              cursor: currentPage === 1 ? 'not-allowed' : 'pointer'
            }}
          >
            Prev
          </button>
          
          <span style={{ margin: '0 8px', color: 'var(--gray-500)' }}>
            Page <strong style={{ color: 'var(--text-dark)' }}>{currentPage}</strong> of {totalPages}
          </span>
          
          <button
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage >= totalPages}
            style={{
              padding: '6px 12px',
              border: '1px solid var(--border-color)',
              background: currentPage >= totalPages ? 'var(--gray-100)' : 'var(--white)',
              color: currentPage >= totalPages ? 'var(--gray-400)' : 'var(--text-dark)',
              borderRadius: 6,
              cursor: currentPage >= totalPages ? 'not-allowed' : 'pointer'
            }}
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   SKELETON SHIMMER LOADER
   ═══════════════════════════════════════════════════════════════════════════ */

export function Skeleton({ width = '100%', height = '16px', variant = 'text', style = {}, className = '' }) {
  const borderRadius = variant === 'circular' ? '50%' : variant === 'text' ? '6px' : '10px';
  
  return (
    <div
      className={`skeleton-box ${className}`}
      style={{
        width,
        height,
        borderRadius,
        display: 'inline-block',
        ...style
      }}
    />
  );
}

