import React, { useEffect, useState } from 'react';

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
      }, 3500);
    };
    toastListeners.add(onToast);
    return () => toastListeners.delete(onToast);
  }, []);

  const border = {
    success: 'var(--success)',
    error: 'var(--danger)',
    info: 'var(--info)',
    warning: 'var(--warning)',
  };

  return (
    <div
      style={{
        position: 'fixed',
        right: 20,
        bottom: 20,
        zIndex: 20000,
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
        maxWidth: 360,
      }}
    >
      {items.map((t) => (
        <div
          key={t.id}
          style={{
            animation: 'fadeIn 0.25s ease-out',
            background: 'var(--soil)',
            color: 'var(--white)',
            padding: '12px 16px',
            borderRadius: 'var(--radius)',
            borderLeft: `4px solid ${border[t.type] || border.info}`,
            fontSize: 14,
            boxShadow: 'var(--shadow-lg)',
          }}
        >
          {t.msg}
        </div>
      ))}
    </div>
  );
}

export function Spinner({ size = 20, color = 'var(--accent)' }) {
  return (
    <span
      style={{
        display: 'inline-block',
        width: size,
        height: size,
        border: `2px solid ${color}`,
        borderTopColor: 'transparent',
        borderRadius: '50%',
        animation: 'spin 0.7s linear infinite',
        verticalAlign: 'middle',
      }}
    />
  );
}

const btnBase = {
  border: 'none',
  borderRadius: 'var(--radius-sm)',
  fontFamily: 'var(--font-body)',
  fontWeight: 600,
  cursor: 'pointer',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: 8,
  transition: 'opacity 0.15s, transform 0.1s',
};

const variants = {
  primary: { background: 'var(--accent)', color: 'var(--white)' },
  secondary: {
    background: 'var(--surface-2)',
    color: 'var(--text-primary)',
    border: '1px solid var(--border)',
  },
  ghost: { background: 'transparent', color: 'var(--text-primary)' },
  danger: { background: 'var(--danger)', color: 'var(--white)' },
  success: { background: 'var(--success)', color: 'var(--white)' },
};

const sizes = {
  sm: { padding: '6px 12px', fontSize: 13 },
  md: { padding: '10px 18px', fontSize: 14 },
  lg: { padding: '12px 24px', fontSize: 15 },
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
        opacity: dim ? 0.65 : 1,
        cursor: dim ? 'not-allowed' : 'pointer',
        ...style,
      }}
      disabled={dim}
      {...rest}
    >
      {loading && <Spinner size={16} color="currentColor" />}
      {children}
    </button>
  );
}

export function Card({ children, style, ...rest }) {
  return (
    <div
      style={{
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-lg)',
        padding: 24,
        boxShadow: 'var(--shadow-sm)',
        ...style,
      }}
      {...rest}
    >
      {children}
    </div>
  );
}

export function Input({ label, error, style, ...props }) {
  return (
    <label style={{ display: 'block', marginBottom: 12, ...style }}>
      {label && (
        <span
          style={{
            display: 'block',
            fontSize: 13,
            fontWeight: 600,
            color: 'var(--text-secondary)',
            marginBottom: 6,
          }}
        >
          {label}
        </span>
      )}
      <input
        {...props}
        style={{
          width: '100%',
          padding: '10px 12px',
          borderRadius: 'var(--radius-sm)',
          border: `1px solid ${error ? 'var(--danger)' : 'var(--border)'}`,
          fontFamily: 'var(--font-body)',
          fontSize: 14,
          outline: 'none',
          background: 'var(--surface)',
        }}
        onFocus={(e) => {
          e.target.style.borderColor = 'var(--accent)';
          props.onFocus?.(e);
        }}
        onBlur={(e) => {
          e.target.style.borderColor = error ? 'var(--danger)' : 'var(--border)';
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

export function Select({ label, error, children, style, ...props }) {
  return (
    <label style={{ display: 'block', marginBottom: 12, ...style }}>
      {label && (
        <span
          style={{
            display: 'block',
            fontSize: 13,
            fontWeight: 600,
            color: 'var(--text-secondary)',
            marginBottom: 6,
          }}
        >
          {label}
        </span>
      )}
      <select
        {...props}
        style={{
          width: '100%',
          padding: '10px 12px',
          borderRadius: 'var(--radius-sm)',
          border: `1px solid ${error ? 'var(--danger)' : 'var(--border)'}`,
          fontFamily: 'var(--font-body)',
          fontSize: 14,
          background: 'var(--surface)',
          cursor: 'pointer',
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

export function Modal({ open, onClose, title, children, width = 480 }) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === 'Escape' && onClose?.();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      role="presentation"
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(44,26,14,0.45)',
        backdropFilter: 'blur(2px)',
        zIndex: 10000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
      }}
      onClick={onClose}
    >
      <div
        role="dialog"
        onClick={(e) => e.stopPropagation()}
        style={{
          animation: 'fadeIn 0.2s ease-out',
          background: 'var(--surface)',
          borderRadius: 'var(--radius-lg)',
          width: '100%',
          maxWidth: width,
          maxHeight: '90vh',
          overflow: 'auto',
          boxShadow: 'var(--shadow-lg)',
          border: '1px solid var(--border)',
        }}
      >
        <div
          style={{
            padding: '18px 22px',
            borderBottom: '1px solid var(--border)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 20 }}>{title}</h2>
          <button
            type="button"
            onClick={onClose}
            style={{
              border: 'none',
              background: 'transparent',
              fontSize: 22,
              cursor: 'pointer',
              color: 'var(--text-muted)',
              lineHeight: 1,
            }}
          >
            ×
          </button>
        </div>
        <div style={{ padding: 22 }}>{children}</div>
      </div>
    </div>
  );
}

export function Table({ cols, rows, loading, emptyMsg = 'No data' }) {
  if (loading) {
    return (
      <div style={{ padding: 48, textAlign: 'center' }}>
        <Spinner size={32} />
      </div>
    );
  }
  if (!rows?.length) {
    return (
      <div style={{ padding: 32, textAlign: 'center', color: 'var(--text-muted)' }}>{emptyMsg}</div>
    );
  }
  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 14 }}>
        <thead>
          <tr style={{ background: 'var(--surface-2)' }}>
            {cols.map((c) => (
              <th
                key={c.key}
                style={{
                  textAlign: 'left',
                  padding: '12px 14px',
                  fontSize: 11,
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                  color: 'var(--text-muted)',
                  borderBottom: '1px solid var(--border)',
                }}
              >
                {c.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr
              key={row.key ?? i}
              style={{
                background: i % 2 === 0 ? 'var(--surface)' : 'var(--linen)',
                transition: 'background 0.15s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'var(--accent-light)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = i % 2 === 0 ? 'var(--surface)' : 'var(--linen)';
              }}
            >
              {cols.map((c) => (
                <td
                  key={c.key}
                  style={{
                    padding: '12px 14px',
                    borderBottom: '1px solid var(--border)',
                    verticalAlign: 'middle',
                  }}
                >
                  {c.render ? c.render(row) : row[c.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function StatCard({ label, value, icon, color = 'var(--accent)', sub }) {
  return (
    <Card style={{ padding: 20 }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
        <div
          style={{
            width: 48,
            height: 48,
            borderRadius: 'var(--radius)',
            background: `${color}22`,
            color,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 22,
          }}
        >
          {icon}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontFamily: 'var(--font-display)',
              fontSize: 28,
              fontWeight: 700,
              color: 'var(--text-primary)',
              lineHeight: 1.1,
            }}
          >
            {value}
          </div>
          <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>{label}</div>
          {sub && <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 6 }}>{sub}</div>}
        </div>
      </div>
    </Card>
  );
}

export function PageHeader({ title, subtitle, actions }) {
  return (
    <div
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        gap: 16,
        marginBottom: 24,
      }}
    >
      <div>
        <h1 style={{ fontSize: 28, marginBottom: subtitle ? 8 : 0 }}>{title}</h1>
        {subtitle && <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: 15 }}>{subtitle}</p>}
      </div>
      {actions && <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>{actions}</div>}
    </div>
  );
}
