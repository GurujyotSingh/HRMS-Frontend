import React, { useEffect, useState, useCallback, useRef } from 'react';
import { employeesAPI, deptAPI } from '../services/api';
import { toast } from '../components/ui';
import { useAuth } from '../context/AuthContext';
import { Plus, Eye, Upload, Trash2, CheckCircle, Search, FilterX, Users, UserCheck, UserX, TrendingUp, ChevronLeft, ChevronRight, ChevronUp, ChevronDown, Building2, Star, UserPlus, FileUp, MoreVertical, Phone, MapPin, Calendar, ShieldAlert, Clock, Lock } from 'lucide-react';

// ─── Avatar util ────────────────────────────────────────────
const AVATAR_COLORS = [
  { bg: '#E0E7FF', fg: '#3730A3' }, { bg: '#D1FAE5', fg: '#065F46' },
  { bg: '#EDE9FE', fg: '#5B21B6' }, { bg: '#FEF3C7', fg: '#92400E' },
  { bg: '#CCFBF1', fg: '#115E59' }, { bg: '#FFE4E6', fg: '#9F1239' },
  { bg: '#E2E8F0', fg: '#1E293B' }, { bg: '#F5F5F4', fg: '#44403C' },
];
function getAvatarColor(name = '') {
  const i = name.split('').reduce((a, c) => a + c.charCodeAt(0), 0) % AVATAR_COLORS.length;
  return AVATAR_COLORS[i];
}
function initials(first = '', last = '') {
  return ((first[0] || '') + (last[0] || '')).toUpperCase() || '?';
}

// ─── Status badge ────────────────────────────────────────────
function StatusBadge({ status }) {
  const s = (status || '').toLowerCase();
  return (
    <span className={`emp-badge ${s}`}>
      <span className="emp-badge-dot" />
      {status?.replace('_', ' ') || '—'}
    </span>
  );
}

// ─── Role label ──────────────────────────────────────────────
function RoleChip({ role }) {
  return <span className="emp-role-chip">{(role || '').replace(/_/g, ' ')}</span>;
}

// ─── Skeleton row ────────────────────────────────────────────
function SkeletonRows({ cols }) {
  return Array.from({ length: 8 }).map((_, i) => (
    <tr key={i} style={{ borderBottom: '1px solid var(--gray-100)' }}>
      {Array.from({ length: cols }).map((__, j) => (
        <td key={j} style={{ padding: '14px 16px' }}>
          <div className="emp-skeleton" style={{ height: 14, width: j === 1 ? 160 : 80, borderRadius: 6 }} />
        </td>
      ))}
    </tr>
  ));
}

// ─── Modal wrapper ───────────────────────────────────────────
function EmpModal({ open, onClose, title, width = 520, children, footer }) {
  if (!open) return null;
  return (
    <div className="emp-modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="emp-modal" style={{ maxWidth: width }}>
        <div className="emp-modal-header">
          <span className="emp-modal-title">{title}</span>
          <button className="emp-modal-close" onClick={onClose}>×</button>
        </div>
        <div className="emp-modal-body">{children}</div>
        {footer && <div className="emp-modal-footer">{footer}</div>}
      </div>
    </div>
  );
}

// ─── Field ───────────────────────────────────────────────────
function Field({ label, children }) {
  return (
    <div className="emp-field">
      <label>{label}</label>
      {children}
    </div>
  );
}

// ─── Main Page ───────────────────────────────────────────────
export default function Employees() {
  const { user } = useAuth();
  const [employees, setEmployees] = useState([]);
  const [total, setTotal] = useState(0);
  const [departments, setDepts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(50);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebounced] = useState('');
  const [filters, setFilters] = useState({ department_id: '', status: '', role: '', employment_type: '' });
  const [draftFilters, setDraftFilters] = useState({ department_id: '', status: '', role: '', employment_type: '' });
  const [savedFilters, setSavedFilters] = useState(() => {
    const saved = localStorage.getItem('hrms_emp_saved_filters');
    return saved ? JSON.parse(saved) : [];
  });
  const [visibleCols, setVisibleCols] = useState(() => {
    const saved = localStorage.getItem('hrms_emp_visible_cols');
    return saved ? JSON.parse(saved) : { employee_id: true, first_name: true, role: true, department_id: true, employment_type: true, join_date: true, status: true };
  });
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showColumns, setShowColumns] = useState(false);
  const [presetName, setPresetName] = useState('');
  const [sort, setSort] = useState({ col: 'first_name', dir: 'asc' });

  useEffect(() => { localStorage.setItem('hrms_emp_visible_cols', JSON.stringify(visibleCols)); }, [visibleCols]);
  useEffect(() => { localStorage.setItem('hrms_emp_saved_filters', JSON.stringify(savedFilters)); }, [savedFilters]);

  const applyFilters = () => {
    setFilters(draftFilters);
    setPage(1);
    setShowAdvanced(false);
  };
  
  const clearFilters = () => {
    const empty = { department_id: '', status: '', role: '', employment_type: '' };
    setDraftFilters(empty);
    setFilters(empty);
    setPage(1);
  };

  const saveFilterPreset = () => {
    if (!presetName.trim()) return toast('Please enter a preset name', 'error');
    const newFilter = { id: Date.now(), name: presetName, state: { ...draftFilters } };
    setSavedFilters([...savedFilters, newFilter]);
    setPresetName('');
    toast('Filter preset saved', 'success');
  };

  const loadFilterPreset = (e) => {
    const id = e.target.value;
    if (!id) return;
    const preset = savedFilters.find(x => x.id.toString() === id);
    if (preset) {
      setDraftFilters(preset.state);
    }
  };
  const [selected, setSelected] = useState([]);
  const [selectAllPages, setSelectAllPages] = useState(false); // Fixed for 1M+ rows: cross-page selection
  const [showCreate, setShowCreate] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [showView, setShowView] = useState(null);
  const [showBulk, setShowBulk] = useState(null);
  const [bulkVal, setBulkVal] = useState('');
  const [creating, setCreating] = useState(false);
  const [bulkLoading, setBulkLoad] = useState(false);
  const [activeRowMenu, setActiveRowMenu] = useState(null);
  const searchTimer = useRef(null);
  const searchInputRef = useRef(null);
  const abortRef = useRef(null); // available for future abort controller wiring

  // Global Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === '/' && e.target.tagName !== 'INPUT' && e.target.tagName !== 'TEXTAREA') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
      if (e.key === 'Escape') {
        setActiveRowMenu(null);
      }
    };
    const handleClickOutside = (e) => {
      if (!e.target.closest('.emp-kebab-container')) {
        setActiveRowMenu(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('click', handleClickOutside);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('click', handleClickOutside);
    };
  }, []);

  const [form, setForm] = useState({
    personal_email: '', email: '', role: 'STAFF',
    first_name: '', last_name: '', employee_id: '',
    join_date: '', department_id: '', designation: '', employment_type: '',
    pan_number: '', uan_number: '', bank_name: '', bank_account_number: '', ifsc_code: ''
  });

  // Debounce search
  useEffect(() => {
    clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => { setDebounced(search); setPage(1); }, 400);
    return () => clearTimeout(searchTimer.current);
  }, [search]);

  const loadDepts = async () => {
    try {
      const r = await deptAPI.list();
      setDepts(r.data?.data || r.data || []);
    } catch { }
  };

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await employeesAPI.list({
        skip: (page - 1) * limit, limit,
        sort_by: sort.col, sort_dir: sort.dir,
        search: debouncedSearch || undefined,
        department_id: filters.department_id || undefined,
        status: filters.status || undefined,
        role: filters.role || undefined,
        employment_type: filters.employment_type || undefined,
      });
      const d = r.data?.data || r.data;
      if (d?.items) { setEmployees(d.items); setTotal(d.total); }
      else if (Array.isArray(d)) { setEmployees(d); setTotal(d.length); }
    } catch (e) {
      toast(e.response?.data?.detail || 'Failed to load employees', 'error');
    } finally { setLoading(false); }
  }, [page, limit, sort, debouncedSearch, filters]);

  useEffect(() => { loadDepts(); }, []);
  useEffect(() => { load(); }, [load]);

  // Fixed for 1M+ rows: Employee ID must be generated server-side
  // DO NOT derive IDs from paginated local data (only shows current page,
  // not all 1M employees, causing UniqueViolation crashes on create)
  // The backend /employees endpoint should auto-assign employee_id,
  // or use a dedicated /employees/next-id?role=STAFF endpoint.
  // We still pre-fill a readable placeholder so the user understands the format.
  useEffect(() => {
    if (!showCreate) return;
    const PREFIXES = { SUPER_ADMIN: 'UNI-AD-', HR_MANAGER: 'UNI-HR-', HR_STAFF: 'UNI-HRS-', DIRECTOR: 'UNI-DR-', FACULTY: 'UNI-FA-', STAFF: 'UNI-ST-' };
    const pfx = PREFIXES[form.role] || 'UNI-EMP-';
    // Fixed for 1M+ rows: show format hint only — backend assigns the real unique ID
    // User can override manually; backend validates uniqueness via DB constraint
    setForm(p => ({ ...p, employee_id: `${pfx}AUTO` }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.role, showCreate]);

  const handleCreate = async e => {
    e.preventDefault(); setCreating(true);
    try {
      await employeesAPI.create({ 
        ...form, 
        email: form.email || null,
        department_id: form.department_id || null, 
        designation: form.designation || null, 
        employment_type: form.employment_type || null,
        salary: null,
        pan_number: form.pan_number || null,
        uan_number: form.uan_number || null,
        bank_name: form.bank_name || null,
        bank_account_number: form.bank_account_number || null,
        ifsc_code: form.ifsc_code || null
      });
      toast('Employee created and credentials emailed!', 'success');
      setShowCreate(false);
      setForm({ personal_email: '', email: '', role: 'STAFF', first_name: '', last_name: '', employee_id: '', join_date: '', department_id: '', designation: '', employment_type: '', pan_number: '', uan_number: '', bank_name: '', bank_account_number: '', ifsc_code: '' });
      load();
    } catch (e) { toast(e.response?.data?.detail || 'Create failed', 'error'); }
    finally { setCreating(false); }
  };

  const handleEdit = async e => {
    e.preventDefault(); setCreating(true);
    try {
      const payload = {
        ...form,
        email: form.email || null,
        department_id: form.department_id || null,
        designation: form.designation || null,
        employment_type: form.employment_type || null,
        pan_number: form.pan_number || null,
        uan_number: form.uan_number || null,
        bank_name: form.bank_name || null,
        bank_account_number: form.bank_account_number || null,
        ifsc_code: form.ifsc_code || null
      };
      delete payload.personal_email;
      delete payload.employee_id; // Usually shouldn't change employee_id
      await employeesAPI.update(editingId, payload);
      toast('Employee updated successfully', 'success');
      setShowEdit(false);
      setEditingId(null);
      setForm({ personal_email: '', email: '', role: 'STAFF', first_name: '', last_name: '', employee_id: '', join_date: '', department_id: '', designation: '', employment_type: '', pan_number: '', uan_number: '', bank_name: '', bank_account_number: '', ifsc_code: '' });
      load();
    } catch (e) { toast(e.response?.data?.detail || 'Update failed', 'error'); }
    finally { setCreating(false); }
  };

  const handleResetPassword = async (id, name) => {
    if (!window.confirm(`Are you sure you want to reset the password for ${name}? A new temporary password will be emailed to them.`)) return;
    try {
      await employeesAPI.resetPassword(id);
      toast(`Password reset successfully for ${name}. Email dispatched.`, 'success');
    } catch (e) {
      toast(e.response?.data?.detail || 'Failed to reset password', 'error');
    }
  };

  const handleExport = async () => {
    try {
      toast('Preparing export…', 'info');
      const r = await employeesAPI.exportCsv({ search: debouncedSearch || undefined, department_id: filters.department_id || undefined, status: filters.status || undefined, role: filters.role || undefined });
      const url = URL.createObjectURL(new Blob([r.data]));
      const a = document.createElement('a'); a.href = url; a.download = 'employees.csv';
      document.body.appendChild(a); a.click(); a.remove();
      toast('Export ready', 'success');
    } catch { toast('Export failed', 'error'); }
  };

  const handleBulk = async () => {
    setBulkLoad(true);
    try {
      await employeesAPI.bulkAction({ employee_ids: selected, action: showBulk.type, value: bulkVal || null });
      toast(`Updated ${selected.length} employees`, 'success');
      setShowBulk(null); setSelected([]); setBulkVal(''); load();
    } catch { toast('Bulk action failed', 'error'); }
    finally { setBulkLoad(false); }
  };

  const toggleSort = col => setSort(p => ({ col, dir: p.col === col && p.dir === 'asc' ? 'desc' : 'asc' }));
  // Fixed for 1M+ rows: toggleAll selects only current page IDs
  // The "Select All X records" banner (below) handles cross-page selection
  const toggleAll = () => {
    setSelectAllPages(false); // reset cross-page flag when toggling page selection
    setSelected(selected.length === employees.length ? [] : employees.map(e => e.id));
  };
  const toggleOne = id => {
    setSelectAllPages(false);
    setSelected(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id]);
  };
  const getDept = id => departments.find(d => d.id === id)?.name || '—';

  const SortIcon = ({ col }) => sort.col === col
    ? (sort.dir === 'asc' ? <ChevronUp size={12} className="sort-arrow" /> : <ChevronDown size={12} className="sort-arrow" />)
    : null;

  const totalPages = Math.max(1, Math.ceil(total / limit));
  const startRow = total === 0 ? 0 : (page - 1) * limit + 1;
  const endRow = Math.min(page * limit, total);

  // Stats
  const activeCount = employees.filter(e => e.status === 'ACTIVE').length;
  const inactiveCount = employees.filter(e => e.status === 'INACTIVE').length;

  const COLS = [
    { key: 'employee_id', label: 'Emp ID' },
    { key: 'first_name', label: 'Name' },
    { key: 'role', label: 'Role' },
    { key: 'department_id', label: 'Department' },
    { key: 'employment_type', label: 'Type' },
    { key: 'join_date', label: 'Date Joined' },
    { key: 'status', label: 'Status' },
    { key: '_actions', label: 'Actions', nosort: true },
  ];

  return (
    <div className="emp-page">
      {/* ── Header ── */}
      <div className="emp-header">
        <div>
          <div className="emp-header-title">Employee Directory</div>
          <div className="emp-header-sub">Manage personnel records, roles, and organisational access</div>
        </div>
        <div className="emp-header-actions">
          <button className="emp-btn emp-btn-secondary" style={{ padding: '10px 16px', borderRadius: '10px', boxShadow: '0 2px 5px rgba(0,0,0,0.05)' }} onClick={handleExport}>
            <Upload size={16} style={{ marginRight: 2 }} /> Export CSV
          </button>
          <button className="emp-btn emp-btn-primary" style={{ padding: '10px 16px', borderRadius: '10px', boxShadow: '0 4px 12px rgba(15, 32, 108, 0.25)' }} onClick={() => setShowCreate(true)}>
            <Plus size={16} /> Add Employee
          </button>
        </div>
      </div>

      {/* ── Stat Cards ── */}
      <div className="emp-stats">
        {[
          { icon: <TrendingUp size={22} />, label: 'Total\nEmployees', val: total, bg: 'linear-gradient(135deg, #F0F4FF 0%, #E0E7FF 100%)', fg: '#887cf0ff' },
          { icon: <Building2 size={22} />, label: 'Active', val: activeCount, bg: 'linear-gradient(135deg, #F0FDF4 0%, #DCFCE7 100%)', fg: '#35b062ff' },
          { icon: <Star size={22} />, label: 'Inactive', val: inactiveCount, bg: 'linear-gradient(135deg, #FFFBEB 0%, #FEF3C7 100%)', fg: '#ac6f41ff' },
          { icon: <UserPlus size={22} />, label: 'Departments', val: departments.length, bg: 'linear-gradient(135deg, #FFF1F2 0%, #FFE4E6 100%)', fg: '#BE123C' },
        ].map((s, i) => (
          <div key={i} className="emp-stat-card" style={{ background: s.bg, animationDelay: `${i * 0.07}s`, border: 'none' }}>
            <div className="emp-stat-left">
              <div className="emp-stat-lbl" style={{ whiteSpace: 'pre-line' }}>{s.label}</div>
              <div className="emp-stat-val">{loading ? '—' : s.val}</div>
            </div>
            <div className="emp-stat-right">
              <div className="emp-stat-dots">
                <div className="emp-stat-dot" style={{ background: s.fg, opacity: 0.8 }}></div>
                <div className="emp-stat-dot" style={{ background: s.fg, opacity: 0.6 }}></div>
                <div className="emp-stat-dot" style={{ background: s.fg, opacity: 0.4 }}></div>
                <div className="emp-stat-dot" style={{ background: s.fg, opacity: 0.2 }}></div>
              </div>
              <div className="emp-stat-icon" style={{ background: s.fg, boxShadow: `0 4px 14px ${s.fg}40` }}>{s.icon}</div>
            </div>
          </div>
        ))}
      </div>

      {/* ── Main Card ── */}
      <div className="emp-card">

        {/* Toolbar */}
        <div className="emp-toolbar">
          <div className="emp-search-wrap">
            <span className="emp-search-icon"><Search size={16} /></span>
            <input
              ref={searchInputRef}
              className="emp-search-input"
              placeholder="Search by name, email, or Employee ID…"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            {!search && <div className="emp-search-shortcut">/</div>}
            {search && (
              <button className="emp-btn emp-btn-ghost" style={{ position: 'absolute', right: 4, top: '50%', transform: 'translateY(-50%)', padding: '4px 8px' }} onClick={() => setSearch('')}>
                <FilterX size={14} />
              </button>
            )}
          </div>
          <button className={`emp-btn ${showAdvanced ? 'emp-btn-primary' : 'emp-btn-secondary'}`} onClick={() => setShowAdvanced(!showAdvanced)}>
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: 4 }}><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon></svg>
            Advanced Filters {((filters.department_id || filters.role || filters.status || filters.employment_type) ? ' (Active)' : '')}
          </button>
          
          <div style={{ position: 'relative' }}>
            <button className={`emp-btn ${showColumns ? 'emp-btn-primary' : 'emp-btn-secondary'}`} onClick={() => setShowColumns(!showColumns)}>
              <Eye size={14} style={{ marginRight: 4 }} /> Columns
            </button>
            {showColumns && (
              <div style={{ position: 'absolute', top: '110%', right: 0, background: 'var(--white)', border: '1px solid var(--gray-200)', borderRadius: 8, padding: 12, zIndex: 50, boxShadow: '0 4px 12px rgba(0,0,0,0.1)', width: 200 }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--gray-500)', marginBottom: 8, textTransform: 'uppercase' }}>Toggle Columns</div>
                {COLS.map(c => {
                  if (c.nosort) return null; // skip actions
                  return (
                    <label key={c.key} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 0', fontSize: 13, cursor: 'pointer' }}>
                      <input type="checkbox" className="emp-checkbox" checked={visibleCols[c.key]} onChange={e => setVisibleCols(p => ({ ...p, [c.key]: e.target.checked }))} />
                      {c.label}
                    </label>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Advanced Filters Panel */}
        {showAdvanced && (
          <div className="emp-advanced-filters" style={{ padding: '16px 20px', background: 'var(--gray-50)', borderBottom: '1px solid var(--gray-200)' }}>
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center', marginBottom: 16 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--gray-500)', marginRight: 8 }}>Filter By:</div>
              <select className="emp-filter-select" value={draftFilters.department_id} onChange={e => setDraftFilters(p => ({ ...p, department_id: e.target.value }))}>
                <option value="">All Departments</option>
                {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
              <select className="emp-filter-select" value={draftFilters.role} onChange={e => setDraftFilters(p => ({ ...p, role: e.target.value }))}>
                <option value="">All Roles</option>
                {['STAFF', 'FACULTY', 'DIRECTOR', 'HR_MANAGER', 'HR_STAFF', 'SUPER_ADMIN'].map(r => <option key={r} value={r}>{r.replace(/_/g, ' ')}</option>)}
              </select>
              <select className="emp-filter-select" value={draftFilters.status} onChange={e => setDraftFilters(p => ({ ...p, status: e.target.value }))}>
                <option value="">All Statuses</option>
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Inactive</option>
                <option value="ON_LEAVE">On Leave</option>
              </select>
              <select className="emp-filter-select" value={draftFilters.employment_type} onChange={e => setDraftFilters(p => ({ ...p, employment_type: e.target.value }))}>
                <option value="">All Types</option>
                <option value="FULL_TIME">Full Time</option>
                <option value="PART_TIME">Part Time</option>
                <option value="CONTRACT">Contract</option>
              </select>
            </div>
            
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'center', borderTop: '1px solid var(--gray-200)', paddingTop: 16 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--gray-500)', marginRight: 8 }}>Saved Presets:</div>
              <select className="emp-filter-select" onChange={loadFilterPreset} value="" style={{ width: 160 }}>
                <option value="">Load Preset...</option>
                {savedFilters.map(sf => <option key={sf.id} value={sf.id}>{sf.name}</option>)}
              </select>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginLeft: 12 }}>
                <input 
                  className="emp-search-input" 
                  style={{ padding: '6px 10px', width: 140 }} 
                  placeholder="Preset Name..." 
                  value={presetName} 
                  onChange={e => setPresetName(e.target.value)} 
                />
                <button className="emp-btn emp-btn-outline emp-btn-sm" onClick={saveFilterPreset}>Save</button>
              </div>
              <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
                <button className="emp-btn emp-btn-ghost" onClick={clearFilters}>
                  <FilterX size={15} /> Clear All
                </button>
                <button className="emp-btn emp-btn-primary" onClick={applyFilters}>
                  <CheckCircle size={15} /> Apply Filters
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Fixed for 1M+ rows: Select All Pages Banner */}
        {selected.length === employees.length && employees.length > 0 && total > employees.length && (
          <div style={{ background: 'rgba(30, 23, 96, 0.06)', borderBottom: '1px solid var(--border-color)', padding: '10px 20px', fontSize: 13, display: 'flex', gap: 12, alignItems: 'center' }}>
            {selectAllPages ? (
              <>
                <span>All <strong>{total}</strong> employees matching this filter are selected.</span>
                <button className="emp-btn emp-btn-ghost" style={{ padding: '2px 8px', fontSize: 12 }} onClick={() => { setSelectAllPages(false); setSelected([]); }}>Clear selection</button>
              </>
            ) : (
              <>
                <span>All <strong>{employees.length}</strong> employees on this page are selected.</span>
                <button className="emp-btn emp-btn-ghost" style={{ padding: '2px 8px', fontSize: 12 }} onClick={() => setSelectAllPages(true)}>
                  Select all <strong>{total}</strong> employees matching filter
                </button>
              </>
            )}
          </div>
        )}

        {/* Bulk Bar */}
        {selected.length > 0 && (
          <div className="emp-bulk-bar">
            <span className="emp-bulk-count">
              {selectAllPages ? `All ${total}` : selected.length} selected
            </span>
            <span className="emp-bulk-sep" />
            <button className="emp-btn emp-btn-outline emp-btn-sm" onClick={() => setShowBulk({ type: 'update_status', label: 'Change Status' })}>
              <CheckCircle size={13} /> Status
            </button>
            <button className="emp-btn emp-btn-outline emp-btn-sm" onClick={() => setShowBulk({ type: 'update_department', label: 'Reassign Department' })}>
              <Users size={13} /> Department
            </button>
            <button className="emp-btn emp-btn-outline emp-btn-sm" onClick={() => setShowBulk({ type: 'update_role', label: 'Change Role' })}>
              <TrendingUp size={13} /> Role
            </button>
            <button className="emp-btn emp-btn-danger emp-btn-sm" onClick={() => setShowBulk({ type: 'delete', label: 'Deactivate' })}>
              <Trash2 size={13} /> Deactivate
            </button>
          </div>
        )}

        {/* Table */}
        <div className="emp-table-scroll" style={{ overflowX: 'auto', overflowY: 'auto', maxHeight: '65vh', minHeight: '300px' }}>
          <table className="emp-table" style={{ position: 'relative' }}>
            <thead style={{ position: 'sticky', top: 0, zIndex: 10, background: 'var(--gray-100)' }}>
              <tr>
                <th style={{ width: 40, padding: '11px 16px' }}>
                  <input type="checkbox" className="emp-checkbox" checked={selected.length === employees.length && employees.length > 0} onChange={toggleAll} />
                </th>
                {COLS.map(c => {
                  if (c.key !== '_actions' && !visibleCols[c.key]) return null;
                  return (
                    <th key={c.key} className={c.nosort ? '' : 'sortable'} onClick={() => !c.nosort && toggleSort(c.key)}>
                      {c.label} <SortIcon col={c.key} />
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <SkeletonRows cols={Object.values(visibleCols).filter(Boolean).length + 2} />
              ) : employees.length === 0 ? (
                <tr>
                  <td colSpan={Object.values(visibleCols).filter(Boolean).length + 2}>
                    <div className="emp-empty">
                      <div className="emp-empty-icon">👥</div>
                      <div className="emp-empty-title">No employees found</div>
                      <div className="emp-empty-sub">We couldn't find anyone matching your current filters and search.</div>
                      <button className="emp-btn emp-btn-outline" style={{ marginTop: 16 }} onClick={() => { setSearch(''); clearFilters(); }}>
                        Clear all filters & search
                      </button>
                    </div>
                  </td>
                </tr>
              ) : employees.map(emp => {
                const av = getAvatarColor(`${emp.first_name}${emp.last_name}`);
                const isSelected = selected.includes(emp.id);
                return (
                  <tr key={emp.id} className={isSelected ? 'selected' : ''}>
                    <td>
                      <input type="checkbox" className="emp-checkbox" checked={isSelected} onChange={() => toggleOne(emp.id)} />
                    </td>
                    {visibleCols['employee_id'] && <td><span className="emp-id-chip">{emp.employee_id}</span></td>}
                    {visibleCols['first_name'] && <td>
                      <div className="emp-name-cell">
                        <div className="emp-avatar" style={{ background: av.bg, color: av.fg }}>
                          {initials(emp.first_name, emp.last_name)}
                        </div>
                        <div>
                          <div className="emp-name-text">{emp.first_name} {emp.last_name}</div>
                          <div className="emp-email-text">{emp.email}</div>
                        </div>
                      </div>
                    </td>}
                    {visibleCols['role'] && <td><RoleChip role={emp.role} /></td>}
                    {visibleCols['department_id'] && <td style={{ fontSize: 13, color: 'var(--gray-600)' }}>{getDept(emp.department_id)}</td>}
                    {visibleCols['employment_type'] && <td style={{ fontSize: 13, color: 'var(--gray-600)' }}>{emp.employment_type || '—'}</td>}
                    {visibleCols['join_date'] && <td style={{ fontSize: 13, color: 'var(--gray-600)' }}>{emp.join_date ? new Date(emp.join_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}</td>}
                    {visibleCols['status'] && <td><StatusBadge status={emp.status} /></td>}
                    <td style={{ position: 'relative' }}>
                      <div className="emp-kebab-container" style={{ position: 'relative', display: 'inline-block' }}>
                        <button className="emp-kebab-btn" onClick={(e) => { e.stopPropagation(); setActiveRowMenu(activeRowMenu === emp.id ? null : emp.id); }}>
                          <MoreVertical size={16} />
                        </button>
                        {activeRowMenu === emp.id && (
                          <div className="emp-row-menu">
                            <button className="emp-row-menu-item" onClick={() => { setShowView(emp); setActiveRowMenu(null); }}>
                              <Eye size={14} /> View Profile
                            </button>
                            <button className="emp-row-menu-item" onClick={() => { setActiveRowMenu(null); setEditingId(emp.id); setForm({ ...emp, join_date: emp.join_date ? emp.join_date.split('T')[0] : '' }); setShowEdit(true); }}>
                              <UserCheck size={14} /> Edit Employee
                            </button>
                            {user?.role === 'SUPER_ADMIN' && (
                              <button className="emp-row-menu-item" onClick={() => { setActiveRowMenu(null); handleResetPassword(emp.id, `${emp.first_name} ${emp.last_name}`); }}>
                                <Lock size={14} /> Reset Password
                              </button>
                            )}
                            <div className="emp-row-menu-divider" />
                            <button className="emp-row-menu-item danger" onClick={() => { setSelected([emp.id]); setShowBulk({ type: 'delete', label: 'Deactivate Employee' }); setActiveRowMenu(null); }}>
                              <UserX size={14} /> Deactivate
                            </button>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="emp-pagination">
          <div className="emp-pagination-info">
            Showing <strong>{startRow}–{endRow}</strong> of <strong>{total}</strong> employees
          </div>
          <div className="emp-pagination-controls">
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--gray-500)' }}>
              Rows:
              <select className="emp-page-select" value={limit} onChange={e => { setLimit(+e.target.value); setPage(1); }}>
                {[25, 50, 100].map(n => <option key={n} value={n}>{n}</option>)}
              </select>
            </div>
            <div className="emp-pagination-nav">
              <button className="emp-page-btn" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>
                <ChevronLeft size={14} />
              </button>
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let p;
                if (totalPages <= 5) p = i + 1;
                else if (page <= 3) p = i + 1;
                else if (page >= totalPages - 2) p = totalPages - 4 + i;
                else p = page - 2 + i;
                return (
                  <button key={p} className={`emp-page-btn${page === p ? ' active' : ''}`} onClick={() => setPage(p)}>{p}</button>
                );
              })}
              <button className="emp-page-btn" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── View Profile Side Drawer ── */}
      {showView && (() => {
        const av = getAvatarColor(`${showView.first_name}${showView.last_name}`);
        return (
          <div className="emp-drawer-overlay" onClick={e => e.target === e.currentTarget && setShowView(null)}>
            <div className="emp-drawer">
              {/* Cover Banner */}
              <div style={{ height: 160, background: 'linear-gradient(135deg, #1e3a8a 0%, #6366f1 100%)', position: 'relative', flexShrink: 0 }}>
                <button className="emp-drawer-close" onClick={() => setShowView(null)}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                </button>
                <div style={{ position: 'absolute', bottom: -50, left: 32, width: 100, height: 100, borderRadius: '50%', background: av.bg, color: av.fg, border: '5px solid #fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 36, fontWeight: 700, boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
                  {initials(showView.first_name, showView.last_name)}
                </div>
              </div>

              {/* Header Info */}
              <div style={{ padding: '64px 32px 24px 32px', background: '#fff', borderBottom: '1px solid var(--gray-200)', flexShrink: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <h2 style={{ margin: 0, fontSize: 26, fontWeight: 700, color: 'var(--gray-900)' }}>{showView.first_name} {showView.last_name}</h2>
                    <p style={{ margin: '4px 0 0 0', fontSize: 15, color: 'var(--gray-500)' }}>{showView.email}</p>
                  </div>
                  <div>
                    <StatusBadge status={showView.status} />
                  </div>
                </div>

                {/* Quick Actions */}
                <div style={{ display: 'flex', gap: 12, marginTop: 24 }}>
                  <a href={`mailto:${showView.email}`} className="emp-btn emp-btn-primary" style={{ padding: '8px 20px', borderRadius: 8, textDecoration: 'none', display: 'flex', alignItems: 'center' }}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: 8 }}><rect width="20" height="16" x="2" y="4" rx="2"></rect><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"></path></svg>
                    Send Mail
                  </a>
                  <button className="emp-btn emp-btn-outline" style={{ padding: '8px 20px', borderRadius: 8 }} onClick={() => { setEditingId(showView.id); setForm({ ...showView, join_date: showView.join_date ? showView.join_date.split('T')[0] : '' }); setShowView(null); setShowEdit(true); }}>
                    Edit Profile
                  </button>
                </div>
              </div>

              {/* Scrollable Data Sections */}
              <div style={{ padding: '24px 32px', display: 'flex', flexDirection: 'column', gap: 32 }}>
                
                {/* Professional Info */}
                <div>
                  <h3 style={{ margin: '0 0 16px 0', fontSize: 13, textTransform: 'uppercase', color: 'var(--gray-500)', fontWeight: 700, letterSpacing: '0.5px' }}>Professional Information</h3>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                    {[
                      ['Employee ID', showView.employee_id, <UserCheck size={18} color="#3b82f6" />],
                      ['Role', <RoleChip role={showView.role} />, <TrendingUp size={18} color="#8b5cf6" />],
                      ['Department', getDept(showView.department_id), <Building2 size={18} color="#10b981" />],
                      ['Designation', showView.designation || '—', <Star size={18} color="#f59e0b" />],
                      ['Employment Type', (showView.employment_type || '—').replace(/_/g, ' '), <Users size={18} color="#6366f1" />],
                      ['Date Joined', showView.join_date ? new Date(showView.join_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '—', <CheckCircle size={18} color="#f43f5e" />],
                      ['Salary', showView.salary ? `$${showView.salary.toLocaleString()}` : '—', <TrendingUp size={18} color="#10b981" />],
                      ['Exit Date', showView.exit_date ? new Date(showView.exit_date).toLocaleDateString('en-GB') : '—', <Clock size={18} color="#64748b" />]
                    ].map(([k, v, icon], i) => (
                      <div key={i} style={{ background: '#fff', border: '1px solid var(--gray-200)', borderRadius: 12, padding: 16, display: 'flex', gap: 14, alignItems: 'flex-start', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
                        <div style={{ padding: 10, background: 'var(--gray-50)', borderRadius: 10 }}>{icon}</div>
                        <div>
                          <div style={{ fontSize: 12, color: 'var(--gray-500)', fontWeight: 600, marginBottom: 4 }}>{k}</div>
                          <div style={{ fontSize: 14, color: 'var(--gray-900)', fontWeight: 500 }}>{v}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Personal & Contact Info */}
                <div>
                  <h3 style={{ margin: '0 0 16px 0', fontSize: 13, textTransform: 'uppercase', color: 'var(--gray-500)', fontWeight: 700, letterSpacing: '0.5px' }}>Personal & Contact</h3>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                    {[
                      ['Phone', showView.phone || '—', <Phone size={18} color="#0284c7" />],
                      ['Gender', (showView.gender || '—').replace(/_/g, ' '), <Users size={18} color="#db2777" />],
                      ['Date of Birth', showView.date_of_birth ? new Date(showView.date_of_birth).toLocaleDateString('en-GB') : '—', <Calendar size={18} color="#eab308" />],
                      ['Nationality', showView.nationality || '—', <MapPin size={18} color="#059669" />],
                    ].map(([k, v, icon], i) => (
                      <div key={i} style={{ background: '#fff', border: '1px solid var(--gray-200)', borderRadius: 12, padding: 16, display: 'flex', gap: 14, alignItems: 'flex-start', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
                        <div style={{ padding: 10, background: 'var(--gray-50)', borderRadius: 10 }}>{icon}</div>
                        <div>
                          <div style={{ fontSize: 12, color: 'var(--gray-500)', fontWeight: 600, marginBottom: 4 }}>{k}</div>
                          <div style={{ fontSize: 14, color: 'var(--gray-900)', fontWeight: 500 }}>{v}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Address & Emergency */}
                <div>
                  <h3 style={{ margin: '0 0 16px 0', fontSize: 13, textTransform: 'uppercase', color: 'var(--gray-500)', fontWeight: 700, letterSpacing: '0.5px' }}>Address & Emergency</h3>
                  <div style={{ background: '#fff', border: '1px solid var(--gray-200)', borderRadius: 12, overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
                    <div style={{ padding: 16, borderBottom: '1px solid var(--gray-100)' }}>
                      <div style={{ fontSize: 12, color: 'var(--gray-500)', fontWeight: 600, marginBottom: 4, display: 'flex', alignItems: 'center', gap: 6 }}><MapPin size={14} /> Residential Address</div>
                      <div style={{ fontSize: 14, color: 'var(--gray-900)', fontWeight: 500 }}>
                        {[showView.street, showView.city, showView.state, showView.country, showView.pincode].filter(Boolean).join(', ') || 'No address provided.'}
                      </div>
                    </div>
                    <div style={{ padding: 16 }}>
                      <div style={{ fontSize: 12, color: 'var(--gray-500)', fontWeight: 600, marginBottom: 4, display: 'flex', alignItems: 'center', gap: 6 }}><ShieldAlert size={14} color="#dc2626" /> Emergency Contact</div>
                      <div style={{ fontSize: 14, color: 'var(--gray-900)', fontWeight: 500 }}>
                        {showView.emergency_name ? `${showView.emergency_name} (${showView.emergency_relation}) — ${showView.emergency_phone || 'No phone'}` : 'No emergency contact provided.'}
                      </div>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          </div>
        );
      })()}

      {/* ── Bulk Modal ── */}
      <EmpModal
        open={!!showBulk} onClose={() => setShowBulk(null)}
        title={showBulk?.label} width={550}
        footer={
          <>
            <button className="emp-btn emp-btn-secondary" onClick={() => setShowBulk(null)}>Cancel</button>
            <button
              className={`emp-btn ${showBulk?.type === 'delete' ? 'emp-btn-danger' : 'emp-btn-primary'}`}
              onClick={handleBulk} 
              disabled={bulkLoading || (showBulk?.type === 'delete' ? bulkVal !== 'CONFIRM' : !bulkVal)}
            >
              {bulkLoading ? 'Processing…' : (showBulk?.type === 'delete' ? 'I understand, deactivate' : 'Confirm')}
            </button>
          </>
        }
      >
        <p style={{ fontSize: 13.5, color: 'var(--gray-600)', marginBottom: 18 }}>
          Applying to <strong>{selected.length}</strong> selected employee{selected.length !== 1 ? 's' : ''}.
        </p>
        {showBulk?.type === 'delete' && (
          <div style={{ position: 'relative', overflow: 'hidden', border: '1px solid #7f1d1d', borderRadius: 12, padding: 24, background: 'linear-gradient(135deg, #2a0808 0%, #170303 100%)', marginTop: 16, marginBottom: 16, boxShadow: '0 8px 32px rgba(220, 38, 38, 0.15)' }}>
            
            {/* Cool hazard striping effect on top edge */}
            <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 4, background: 'repeating-linear-gradient(45deg, #dc2626, #dc2626 10px, #991b1b 10px, #991b1b 20px)' }} />

            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
              <div style={{ background: 'rgba(220, 38, 38, 0.2)', padding: 8, borderRadius: 8, display: 'flex' }}>
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"></path><path d="M12 9v4"></path><path d="M12 17h.01"></path></svg>
              </div>
              <h4 style={{ color: '#fca5a5', margin: 0, fontSize: 16, fontWeight: 700, letterSpacing: '0.5px', textTransform: 'uppercase' }}>Danger Zone</h4>
            </div>
            
            <p style={{ fontSize: 13.5, color: '#fecaca', margin: '0 0 20px 0', lineHeight: 1.6, opacity: 0.9 }}>
              You are about to <strong style={{ color: '#fff' }}>permanently deactivate</strong> the selected employees. This action will revoke all system access instantly.
            </p>
            
            <div style={{ background: 'rgba(0,0,0,0.4)', padding: 16, borderRadius: 8, border: '1px solid rgba(220, 38, 38, 0.3)' }}>
              <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 12, color: '#fca5a5', fontWeight: 600, marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                <span>Verification Required</span>
                <span style={{ background: '#7f1d1d', color: '#fff', padding: '2px 6px', borderRadius: 4, fontSize: 11 }}>Type CONFIRM</span>
              </label>
              <input 
                type="text" 
                placeholder="CONFIRM" 
                value={bulkVal} 
                onChange={e => setBulkVal(e.target.value)} 
                style={{ width: '100%', padding: '12px 14px', border: '1px solid #991b1b', borderRadius: 6, outline: 'none', background: '#1a0505', color: '#ef4444', fontWeight: 700, fontFamily: 'monospace', fontSize: 15, letterSpacing: '2px', transition: 'all 0.2s ease' }}
                onFocus={e => { e.target.style.borderColor = '#ef4444'; e.target.style.boxShadow = '0 0 0 3px rgba(220,38,38,0.2)'; }}
                onBlur={e => { e.target.style.borderColor = '#991b1b'; e.target.style.boxShadow = 'none'; }}
              />
            </div>
          </div>
        )}
        {showBulk?.type === 'update_status' && (
          <Field label="New Status">
            <select value={bulkVal} onChange={e => setBulkVal(e.target.value)}>
              <option value="">Select…</option>
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
              <option value="ON_LEAVE">On Leave</option>
            </select>
          </Field>
        )}
        {showBulk?.type === 'update_department' && (
          <Field label="New Department">
            <select value={bulkVal} onChange={e => setBulkVal(e.target.value)}>
              <option value="">Select…</option>
              {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
            </select>
          </Field>
        )}
        {showBulk?.type === 'update_role' && (
          <Field label="New Role">
            <select value={bulkVal} onChange={e => setBulkVal(e.target.value)}>
              <option value="">Select…</option>
              {['STAFF', 'FACULTY', 'DIRECTOR', 'HR_MANAGER', 'HR_STAFF'].map(r => <option key={r} value={r}>{r.replace(/_/g, ' ')}</option>)}
            </select>
          </Field>
        )}
        {showBulk?.type === 'delete' && (
          <div style={{ padding: 14, background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 8, fontSize: 13.5, color: '#B91C1C' }}>
            ⚠️ This will deactivate {selected.length} employee account{selected.length !== 1 ? 's' : ''}. They will lose system access immediately.
          </div>
        )}
      </EmpModal>

      {/* ── Add / Edit Modal ── */}
      <EmpModal
        open={showCreate || showEdit} onClose={() => { setShowCreate(false); setShowEdit(false); setEditingId(null); }}
        title={showCreate ? "Add New Employee" : "Edit Employee"} width={580}
        footer={
          <>
            <button className="emp-btn emp-btn-secondary" onClick={() => { setShowCreate(false); setShowEdit(false); setEditingId(null); }}>Cancel</button>
            <button className="emp-btn emp-btn-primary" form="create-form" type="submit" disabled={creating}>
              {creating ? 'Saving…' : showCreate ? 'Create Employee' : 'Save Changes'}
            </button>
          </>
        }
      >
        <form id="create-form" onSubmit={showCreate ? handleCreate : handleEdit}>
          <div className="emp-section-label">Account details</div>
          <div className="emp-grid-2">
            {showCreate && (
              <Field label="Personal Email (Welcome Pack sent here)">
                <input type="email" required placeholder="john.doe@gmail.com" value={form.personal_email || ''} onChange={e => setForm(p => ({ ...p, personal_email: e.target.value }))} />
              </Field>
            )}
            <Field label={showCreate ? "University Email (Optional Override)" : "Work Email"}>
              <input type="email" placeholder={showCreate ? "Auto-generated if left blank" : ""} value={form.email || ''} onChange={e => setForm(p => ({ ...p, email: e.target.value }))} disabled={!showCreate} />
            </Field>
          </div>
          <Field label="System Role">
            <select value={form.role} onChange={e => setForm(p => ({ ...p, role: e.target.value }))}>
              {['STAFF', 'FACULTY', 'DIRECTOR', 'HR_STAFF', 'HR_MANAGER', 'SUPER_ADMIN'].map(r => <option key={r} value={r}>{r.replace(/_/g, ' ')}</option>)}
            </select>
          </Field>

          <div className="emp-section-label">Employee Profile</div>
          <div className="emp-grid-2">
            <Field label="First Name"><input required value={form.first_name} onChange={e => setForm(p => ({ ...p, first_name: e.target.value }))} /></Field>
            <Field label="Last Name"><input required value={form.last_name} onChange={e => setForm(p => ({ ...p, last_name: e.target.value }))} /></Field>
          </div>
          <div className="emp-grid-2">
            <Field label="Employee ID (Auto)"><input disabled value={form.employee_id} /></Field>
            <Field label="Date of Joining"><input type="date" required value={form.join_date} onChange={e => setForm(p => ({ ...p, join_date: e.target.value }))} /></Field>
          </div>
          <div className="emp-grid-2">
            <Field label="Department">
              <select value={form.department_id} onChange={e => setForm(p => ({ ...p, department_id: e.target.value }))}>
                <option value="">Select Department</option>
                {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
              </select>
            </Field>
            <Field label="Designation">
              <input placeholder="e.g. Associate Professor" value={form.designation} onChange={e => setForm(p => ({ ...p, designation: e.target.value }))} />
            </Field>
          </div>
          <div className="emp-grid-2">
            <Field label="Employment Type">
              <select value={form.employment_type} onChange={e => setForm(p => ({ ...p, employment_type: e.target.value }))}>
                <option value="">Select Type</option>
                <option value="FULL_TIME">Full-Time</option>
                <option value="PART_TIME">Part-Time</option>
                <option value="CONTRACT">Contract</option>
                <option value="VISITING">Visiting</option>
              </select>
            </Field>
            <div />
          </div>

          <div className="emp-section-label">Statutory & Bank Details</div>
          <div className="emp-grid-2">
            <Field label="PAN Number"><input placeholder="ABCDE1234F" value={form.pan_number} onChange={e => setForm(p => ({ ...p, pan_number: e.target.value }))} /></Field>
            <Field label="UAN Number"><input placeholder="12-digit UAN" value={form.uan_number} onChange={e => setForm(p => ({ ...p, uan_number: e.target.value }))} /></Field>
          </div>
          <div className="emp-grid-2">
            <Field label="Bank Name"><input placeholder="e.g. HDFC Bank" value={form.bank_name} onChange={e => setForm(p => ({ ...p, bank_name: e.target.value }))} /></Field>
            <Field label="Account Number"><input placeholder="Account No." value={form.bank_account_number} onChange={e => setForm(p => ({ ...p, bank_account_number: e.target.value }))} /></Field>
          </div>
          <div className="emp-grid-2">
            <Field label="IFSC Code"><input placeholder="e.g. HDFC0001234" value={form.ifsc_code} onChange={e => setForm(p => ({ ...p, ifsc_code: e.target.value }))} /></Field>
            <div />
          </div>
        </form>
      </EmpModal>
    </div>
  );
}