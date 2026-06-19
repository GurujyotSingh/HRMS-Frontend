import React, { useEffect, useState, useMemo } from 'react';
import { PageHeader, Card, Table, Badge, Btn, Input, Select } from '../components/ui';
import { auditAPI } from '../services/api';
import { 
  ChevronLeft, ChevronRight, Search, RefreshCw, X,
  Shield, Trash2, Edit3, Plus, AlertTriangle, Info, Clock, Box, FileText, User
} from 'lucide-react';

const PAGE_SIZE = 50;

// Action categorization for icons
const getActionIcon = (action) => {
  const act = (action || '').toUpperCase();
  if (act.includes('LOGIN') || act.includes('LOGOUT')) return <Shield size={14} />;
  if (act.includes('DELETE') || act.includes('REJECT')) return <Trash2 size={14} />;
  if (act.includes('UPDATE') || act.includes('CHANGE') || act.includes('REOPEN')) return <Edit3 size={14} />;
  if (act.includes('CREATE') || act.includes('APPLY') || act.includes('INITIATE')) return <Plus size={14} />;
  return <Box size={14} />;
};

const getSeverityVariant = (severity) => {
  if (severity === 'CRITICAL') return 'danger';
  if (severity === 'WARNING') return 'warning';
  return 'info';
};

const getSeverityIcon = (severity) => {
  if (severity === 'CRITICAL') return <AlertTriangle size={14} color="var(--danger-600)" />;
  if (severity === 'WARNING') return <AlertTriangle size={14} color="var(--warning-600)" />;
  return <Info size={14} color="var(--info-600)" />;
};

export default function AuditLogs() {
  const [activeTab, setActiveTab] = useState('logs'); // 'logs' | 'analytics'
  
  // Logs State
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  
  // Filters State
  const [searchQuery, setSearchQuery] = useState('');
  const [filterAction, setFilterAction] = useState('ALL');
  const [filterResource, setFilterResource] = useState('ALL');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  
  // Analytics State
  const [analytics, setAnalytics] = useState(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(false);

  // Drawer State
  const [selectedLog, setSelectedLog] = useState(null);

  const fetchLogs = () => {
    setLoading(true);
    const params = { limit: PAGE_SIZE + 1, skip: (page - 1) * PAGE_SIZE };
    
    if (searchQuery) params.search = searchQuery;
    if (filterAction !== 'ALL') params.action = filterAction;
    if (filterResource !== 'ALL') params.resource = filterResource;
    if (fromDate) params.from_date = fromDate;
    if (toDate) params.to_date = toDate;

    auditAPI.list(params).then(res => {
      const data = res.data?.data || res.data || [];
      if (data.length > PAGE_SIZE) {
        setHasMore(true);
        setLogs(data.slice(0, PAGE_SIZE));
      } else {
        setHasMore(false);
        setLogs(data);
      }
    }).catch(err => {
      console.error(err);
      setLogs([]);
      setHasMore(false);
    }).finally(() => {
      setLoading(false);
    });
  };

  const fetchAnalytics = () => {
    setAnalyticsLoading(true);
    auditAPI.analytics().then(res => {
      setAnalytics(res.data);
    }).catch(err => {
      console.error(err);
    }).finally(() => {
      setAnalyticsLoading(false);
    });
  };

  useEffect(() => {
    if (activeTab === 'logs') {
      fetchLogs();
    } else {
      fetchAnalytics();
    }
  }, [page, activeTab]);

  const handleApplyFilters = () => {
    setPage(1);
    fetchLogs();
  };

  // ─── Logs Tab Render ────────────────────────────────────────────────────────
  
  const cols = [
    { key: 'createdAt', label: 'Timestamp', render: (r) => new Date(r.timestamp || r.created_at).toLocaleString() },
    { key: 'userEmail', label: 'Actor', render: (r) => r.userEmail || r.user_email || 'System' },
    { key: 'action', label: 'Action', render: (r) => {
      const act = (r.action || '').toUpperCase();
      return (
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: 'var(--gray-100)', padding: '4px 8px', borderRadius: 6, fontSize: 12, fontWeight: 600, color: 'var(--gray-700)', border: '1px solid var(--gray-200)' }}>
          {getActionIcon(act)}
          {act.replace(/_/g, ' ')}
        </div>
      );
    }},
    { key: 'resource', label: 'Resource', render: (r) => r.resource ? r.resource.toUpperCase() : '—' },
    { key: 'severity', label: 'Severity', render: (r) => {
      const sev = r.severity || 'INFO';
      return (
        <Badge variant={getSeverityVariant(sev)}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            {getSeverityIcon(sev)} {sev}
          </div>
        </Badge>
      );
    }},
    { key: 'status', label: 'Status', render: (r) => <Badge variant={r.status === 'success' ? 'success' : 'danger'}>{r.status}</Badge> },
  ];

  // Extracted details rendering
  const parseDetails = (detailStr) => {
    if (!detailStr) return null;
    try {
      const parsed = JSON.parse(detailStr);
      return parsed;
    } catch {
      return { description: detailStr };
    }
  };

  // ─── Analytics Tab Render ───────────────────────────────────────────────────

  const renderAnalytics = () => {
    if (analyticsLoading || !analytics) {
      return <div style={{ padding: 40, textAlign: 'center', color: 'var(--gray-500)' }}>Loading analytics...</div>;
    }

    const { kpi, activity_trend, action_distribution, recent_criticals } = analytics;

    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        {/* KPI Cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 20 }}>
          <Card style={{ borderLeft: '4px solid var(--primary-500)' }}>
            <div style={{ fontSize: 13, color: 'var(--gray-500)', fontWeight: 600 }}>Total Events</div>
            <div style={{ fontSize: 28, fontWeight: 800, color: 'var(--gray-800)', marginTop: 8 }}>{kpi.total_events.toLocaleString()}</div>
          </Card>
          <Card style={{ borderLeft: '4px solid var(--success-500)' }}>
            <div style={{ fontSize: 13, color: 'var(--gray-500)', fontWeight: 600 }}>Successful Logins</div>
            <div style={{ fontSize: 28, fontWeight: 800, color: 'var(--gray-800)', marginTop: 8 }}>{kpi.success_logins.toLocaleString()}</div>
          </Card>
          <Card style={{ borderLeft: '4px solid var(--warning-500)' }}>
            <div style={{ fontSize: 13, color: 'var(--gray-500)', fontWeight: 600 }}>Warning Events</div>
            <div style={{ fontSize: 28, fontWeight: 800, color: 'var(--gray-800)', marginTop: 8 }}>{kpi.warnings.toLocaleString()}</div>
          </Card>
          <Card style={{ borderLeft: '4px solid var(--danger-500)' }}>
            <div style={{ fontSize: 13, color: 'var(--gray-500)', fontWeight: 600 }}>Critical Events</div>
            <div style={{ fontSize: 28, fontWeight: 800, color: 'var(--gray-800)', marginTop: 8 }}>{kpi.criticals.toLocaleString()}</div>
          </Card>
        </div>

        {/* Charts Section */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
          <Card>
            <h3 style={{ margin: '0 0 16px 0', fontSize: 15, color: 'var(--gray-700)' }}>Activity Trend (Last 7 Days)</h3>
            <div style={{ height: 200, display: 'flex', alignItems: 'flex-end', gap: 12, borderBottom: '1px solid var(--gray-200)', paddingBottom: 10 }}>
              {Object.entries(activity_trend).map(([dateStr, count]) => {
                const max = Math.max(...Object.values(activity_trend), 1);
                const heightPct = (count / max) * 100;
                return (
                  <div key={dateStr} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                    <div style={{ fontSize: 11, color: 'var(--gray-500)' }}>{count}</div>
                    <div style={{ width: '100%', background: 'var(--primary-200)', borderRadius: '4px 4px 0 0', height: `${heightPct}%`, minHeight: count > 0 ? 4 : 0, transition: 'height 0.5s ease' }}>
                      <div style={{ width: '100%', height: '100%', background: 'var(--primary-500)', opacity: 0.8, borderRadius: '4px 4px 0 0' }} />
                    </div>
                    <div style={{ fontSize: 10, color: 'var(--gray-500)', transform: 'rotate(-45deg)', whiteSpace: 'nowrap', marginTop: 10 }}>
                      {dateStr.split('-').slice(1).join('/')}
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>

          <Card>
            <h3 style={{ margin: '0 0 16px 0', fontSize: 15, color: 'var(--gray-700)' }}>Action Distribution</h3>
            <div style={{ height: 200, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 12, paddingRight: 8 }}>
              {Object.entries(action_distribution).sort((a, b) => b[1] - a[1]).slice(0, 10).map(([action, count]) => {
                const total = kpi.total_events || 1;
                const pct = (count / total) * 100;
                return (
                  <div key={action}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 4 }}>
                      <span style={{ fontWeight: 600, color: 'var(--gray-700)' }}>{action}</span>
                      <span style={{ color: 'var(--gray-500)' }}>{count} ({pct.toFixed(1)}%)</span>
                    </div>
                    <div style={{ height: 6, background: 'var(--gray-100)', borderRadius: 3, overflow: 'hidden' }}>
                      <div style={{ height: '100%', width: `${pct}%`, background: 'var(--primary-500)' }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>
        </div>

        {/* Recent Criticals */}
        <Card>
          <h3 style={{ margin: '0 0 16px 0', fontSize: 15, color: 'var(--gray-700)' }}>Recent Critical Events</h3>
          <Table cols={cols} rows={recent_criticals} loading={false} emptyMsg="No critical events recently." />
        </Card>
      </div>
    );
  };

  return (
    <>
      <PageHeader
        title="Audit Logs & Compliance"
        subtitle="Enterprise monitoring dashboard for system actions and security events."
      />
      
      {/* Tabs */}
      <div style={{ display: 'flex', gap: 20, borderBottom: '2px solid var(--gray-200)', marginBottom: 24, padding: '0 24px' }}>
        <button 
          onClick={() => setActiveTab('logs')}
          style={{ padding: '12px 0', background: 'none', border: 'none', borderBottom: activeTab === 'logs' ? '2px solid var(--primary-600)' : '2px solid transparent', color: activeTab === 'logs' ? 'var(--primary-600)' : 'var(--gray-500)', fontWeight: 600, fontSize: 15, cursor: 'pointer', marginBottom: -2, transition: '0.2s' }}
        >
          Event Logs
        </button>
        <button 
          onClick={() => setActiveTab('analytics')}
          style={{ padding: '12px 0', background: 'none', border: 'none', borderBottom: activeTab === 'analytics' ? '2px solid var(--primary-600)' : '2px solid transparent', color: activeTab === 'analytics' ? 'var(--primary-600)' : 'var(--gray-500)', fontWeight: 600, fontSize: 15, cursor: 'pointer', marginBottom: -2, transition: '0.2s' }}
        >
          Analytics & Insights
        </button>
      </div>

      <div style={{ padding: '0 24px 24px 24px', maxWidth: 1400, margin: '0 auto' }}>
        {activeTab === 'analytics' ? renderAnalytics() : (
          <Card style={{ padding: 0, overflow: 'hidden', border: '1px solid rgba(0,0,0,0.08)', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
            
            {/* Filter Bar */}
            <div style={{ padding: 16, background: 'var(--gray-50)', borderBottom: '1px solid var(--gray-200)', display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'flex-end' }}>
              <div style={{ flex: 1, minWidth: 200 }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--gray-600)', marginBottom: 4 }}>Search</label>
                <div style={{ position: 'relative' }}>
                  <Search size={16} color="var(--gray-400)" style={{ position: 'absolute', left: 10, top: 10 }} />
                  <Input 
                    placeholder="Search user, action, detail..." 
                    value={searchQuery} 
                    onChange={e => setSearchQuery(e.target.value)} 
                    style={{ paddingLeft: 34, width: '100%' }}
                    onKeyDown={e => e.key === 'Enter' && handleApplyFilters()}
                  />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--gray-600)', marginBottom: 4 }}>Action</label>
                <Select value={filterAction} onChange={e => setFilterAction(e.target.value)} style={{ width: 140 }}>
                  <option value="ALL">All Actions</option>
                  <option value="LOGIN">LOGIN</option>
                  <option value="LOGOUT">LOGOUT</option>
                  <option value="CREATE">CREATE</option>
                  <option value="UPDATE">UPDATE</option>
                  <option value="DELETE">DELETE</option>
                  <option value="REOPEN">REOPEN</option>
                </Select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--gray-600)', marginBottom: 4 }}>Resource</label>
                <Select value={filterResource} onChange={e => setFilterResource(e.target.value)} style={{ width: 140 }}>
                  <option value="ALL">All Resources</option>
                  <option value="EMPLOYEE">Employee</option>
                  <option value="RECRUITMENT">Recruitment</option>
                  <option value="PAYROLL">Payroll</option>
                  <option value="ATTENDANCE">Attendance</option>
                  <option value="ONBOARDING">Onboarding</option>
                  <option value="USER">User</option>
                </Select>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--gray-600)', marginBottom: 4 }}>Date Range</label>
                <div style={{ display: 'flex', gap: 8 }}>
                  <Input type="date" value={fromDate} onChange={e => setFromDate(e.target.value)} />
                  <Input type="date" value={toDate} onChange={e => setToDate(e.target.value)} />
                </div>
              </div>

              <div style={{ display: 'flex', gap: 8 }}>
                <Btn variant="primary" onClick={handleApplyFilters}>Filter</Btn>
                <Btn variant="outline" onClick={() => {
                  setSearchQuery(''); setFilterAction('ALL'); setFilterResource('ALL'); setFromDate(''); setToDate('');
                  setTimeout(fetchLogs, 0); // Trigger fetch after state clears
                }}>Clear</Btn>
                <Btn variant="secondary" onClick={fetchLogs} style={{ padding: '0 12px' }} title="Refresh Logs">
                  <RefreshCw size={16} />
                </Btn>
              </div>
            </div>

            {/* Empty State */}
            {!loading && logs.length === 0 ? (
              <div style={{ padding: 60, textAlign: 'center' }}>
                <Box size={48} color="var(--gray-300)" style={{ marginBottom: 16 }} />
                <h3 style={{ margin: '0 0 8px 0', color: 'var(--gray-700)' }}>No audit records found</h3>
                <p style={{ color: 'var(--gray-500)', fontSize: 14, margin: 0 }}>No records match the selected filters. Try adjusting your search criteria.</p>
              </div>
            ) : (
              <Table 
                cols={cols} 
                rows={logs} 
                loading={loading} 
                onRowClick={(row) => setSelectedLog(row)} 
              />
            )}
            
            {/* Pagination Footer */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 20px', borderTop: '1px solid var(--gray-200)', fontSize: 13, background: 'var(--gray-50)' }}>
              <span style={{ color: 'var(--gray-500)' }}>
                Page <strong>{page}</strong>
              </span>
              <div style={{ display: 'flex', gap: 6 }}>
                <Btn variant="secondary" size="xs" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>
                  <ChevronLeft size={13} /> Prev
                </Btn>
                <Btn variant="secondary" size="xs" disabled={!hasMore} onClick={() => setPage(p => p + 1)}>
                  Next <ChevronRight size={13} />
                </Btn>
              </div>
            </div>
          </Card>
        )}
      </div>

      {/* Event Details Drawer */}
      {selectedLog && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(15, 23, 42, 0.4)', backdropFilter: 'blur(4px)', zIndex: 100, display: 'flex', justifyContent: 'flex-end', transition: 'all 0.3s' }}>
          <div style={{ width: '100%', maxWidth: 600, background: 'var(--light-bg)', height: '100%', boxShadow: '-8px 0 30px rgba(0,0,0,0.1)', display: 'flex', flexDirection: 'column', animation: 'slideIn 0.3s ease-out' }}>
            
            {/* Drawer Header */}
            <div style={{ background: 'linear-gradient(135deg, #1e293b, #0f172a)', padding: '24px 32px', color: 'white', position: 'relative' }}>
              <button 
                onClick={() => setSelectedLog(null)} 
                style={{ position: 'absolute', top: 20, right: 20, background: 'rgba(255,255,255,0.1)', border: 'none', color: 'white', width: 32, height: 32, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
              >
                <X size={16} />
              </button>
              
              <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginBottom: 12 }}>
                <Badge variant={getSeverityVariant(selectedLog.severity || 'INFO')}>{selectedLog.severity || 'INFO'}</Badge>
                <span style={{ fontSize: 13, color: 'var(--gray-300)', display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Clock size={14} /> {new Date(selectedLog.created_at || selectedLog.timestamp).toLocaleString()}
                </span>
              </div>
              <h2 style={{ margin: 0, fontSize: 24, fontWeight: 700 }}>{selectedLog.action}</h2>
              <div style={{ fontSize: 14, color: 'var(--gray-400)', marginTop: 4, display: 'flex', alignItems: 'center', gap: 6 }}>
                <Box size={14} /> Resource: {selectedLog.resource || 'System'} {selectedLog.resource_id && `(${selectedLog.resource_id})`}
              </div>
            </div>

            {/* Drawer Content */}
            <div style={{ padding: 32, flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 24 }}>
              
              {/* Actor Info */}
              <Card>
                <h3 style={{ margin: '0 0 12px 0', fontSize: 14, color: 'var(--gray-700)', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <User size={16} color="var(--primary-500)" /> Actor Information
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: 14 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--gray-500)' }}>Email</span>
                    <span style={{ fontWeight: 600 }}>{selectedLog.user_email || 'System'}</span>
                  </div>
                  {selectedLog.user_id && (
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--gray-500)' }}>User ID</span>
                      <span style={{ fontFamily: 'monospace', color: 'var(--gray-600)' }}>{selectedLog.user_id}</span>
                    </div>
                  )}
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span style={{ color: 'var(--gray-500)' }}>IP Address</span>
                    <span style={{ fontFamily: 'monospace' }}>{selectedLog.ip_address || 'Unknown'}</span>
                  </div>
                </div>
              </Card>

              {/* Event Details */}
              <Card>
                <h3 style={{ margin: '0 0 12px 0', fontSize: 14, color: 'var(--gray-700)', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <FileText size={16} color="var(--primary-500)" /> Event Details
                </h3>
                <div style={{ fontSize: 14 }}>
                  {(() => {
                    const parsed = parseDetails(selectedLog.detail || selectedLog.details);
                    if (!parsed) return <span style={{ color: 'var(--gray-400)' }}>No additional details provided.</span>;
                    
                    if (parsed.description && Object.keys(parsed).length === 1) {
                      return <div style={{ color: 'var(--gray-700)', lineHeight: 1.5 }}>{parsed.description}</div>;
                    }

                    return (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                        {Object.entries(parsed).map(([k, v]) => (
                          <div key={k} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                            <div style={{ fontWeight: 600, color: 'var(--gray-600)', textTransform: 'capitalize' }}>{k.replace(/_/g, ' ')}</div>
                            <div style={{ background: 'var(--gray-50)', padding: '8px 12px', borderRadius: 6, border: '1px solid var(--gray-200)', fontFamily: 'monospace', wordBreak: 'break-all' }}>
                              {typeof v === 'object' ? JSON.stringify(v, null, 2) : String(v)}
                            </div>
                          </div>
                        ))}
                      </div>
                    );
                  })()}
                </div>
              </Card>
              
            </div>
            
            {/* Drawer Footer */}
            <div style={{ padding: '16px 32px', borderTop: '1px solid var(--gray-200)', background: 'white' }}>
              <div style={{ fontSize: 12, color: 'var(--gray-400)', fontFamily: 'monospace' }}>
                Log ID: {selectedLog.id}
              </div>
            </div>

          </div>
        </div>
      )}
    </>
  );
}
