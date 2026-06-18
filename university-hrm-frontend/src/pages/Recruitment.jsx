import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Plus, Users, Search, ChevronLeft, ChevronRight
} from 'lucide-react';
import {
  PageHeader, Card, Table, Badge, Btn,
  Modal, Input, Select, Textarea, toast, Skeleton
} from '../components/ui';
import { recruitmentAPI, deptAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import JobPostingWizard from '../components/recruitment/JobPostingWizard';
import RecruitmentPipeline from '../components/RecruitmentPipeline';

// Fixed for 1M+ rows scalability:
// - Job listings are now server-side paginated (never loads all jobs)
// - Applicants per job are paginated
// - AbortController cancels stale requests on filter/page changes
// - Debounced job search to prevent API hammering

const PAGE_SIZE = 25;

export default function Recruitment() {
  const { canAccess } = useAuth();
  const canManage = canAccess('admin', 'hr');

  const [jobs, setJobs] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [jobSearch, setJobSearch] = useState('');

  // Fixed for 1M+ rows: pagination state
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  const abortRef = useRef(null);
  const searchRef = useRef(null); // Fixed: debounce timer ref

  // Modals
  const [jobModalOpen, setJobModalOpen] = useState(false);
  const [applicantModalOpen, setApplicantModalOpen] = useState(false);

  // Selection state
  const [selectedJob, setSelectedJob] = useState(null);
  const [applicants, setApplicants] = useState([]);
  const [loadingApplicants, setLoadingApplicants] = useState(false);
  const [appPage, setAppPage] = useState(1);
  const [appTotal, setAppTotal] = useState(0);

  // Form states
  const [applicantForm, setApplicantForm] = useState({
    name: '', email: '', phone: '', resume_url: '', notes: ''
  });
  const [showAddApplicant, setShowAddApplicant] = useState(false);
  const [sendEmail, setSendEmail] = useState(true);

  // Fixed for 1M+ rows: paginated job loading with AbortController
  const loadJobs = useCallback(async () => {
    if (abortRef.current) abortRef.current.abort();
    abortRef.current = new AbortController();

    setLoading(true);
    try {
      const data = await recruitmentAPI.listJobs({
        limit: PAGE_SIZE,
        skip: (page - 1) * PAGE_SIZE,
        search: jobSearch || undefined,
      }, abortRef.current.signal);
      const items = data?.data?.items || data?.items || data?.data || (Array.isArray(data) ? data : []);
      setJobs(items);
      setTotal(data?.data?.total || data?.total || items.length);
    } catch (e) {
      if (e.name !== 'CanceledError' && e.code !== 'ERR_CANCELED') {
        toast('Failed to load recruitment data', 'error');
      }
    } finally {
      setLoading(false);
    }
  }, [page, jobSearch]);

  const loadDepts = async () => {
    try {
      const { data } = await deptAPI.list();
      setDepartments(data?.data || data || []);
    } catch { /* non-critical */ }
  };

  useEffect(() => { loadDepts(); }, []);
  useEffect(() => { loadJobs(); }, [loadJobs]);

  // Fixed: debounce job search — wait 400ms after typing before hitting API
  const handleSearchChange = (e) => {
    const val = e.target.value;
    clearTimeout(searchRef.current);
    searchRef.current = setTimeout(() => {
      setJobSearch(val);
      setPage(1);
    }, 400);
  };

  // handleCreateJob moved to JobPostingWizard

  // Fixed for 1M+ rows: applicants are paginated per job
  const viewApplicants = (job) => {
    setSelectedJob(job);
  };

  const updateJobStatus = async (id, status) => {
    try {
      await recruitmentAPI.updateJob(id, { status });
      toast('Job status updated successfully', 'success');
      loadJobs(page);
    } catch (err) {
      toast('Failed to update job status', 'error');
    }
  };

  const getDeptName = (id) => {
    const dept = departments.find(d => d.id === id);
    return dept ? dept.name : id || '—';
  };

  const jobCols = [
    {
      key: 'title',
      label: 'Job Title',
      render: (j) => (
        <div style={{ fontWeight: 500, color: 'var(--primary)' }}>
          {j.title}
        </div>
      )
    },
    {
      key: 'department',
      label: 'Department',
      render: (j) => getDeptName(j.department_id)
    },
    {
      key: 'type',
      label: 'Type',
      render: (j) => (
        <Badge variant="neutral">{j.type?.replace('_', ' ') || 'FULL TIME'}</Badge>
      )
    },
    {
      key: 'status',
      label: 'Status',
      render: (j) => {
        const variants = { 'OPEN': 'success', 'CLOSED': 'danger', 'PAUSED': 'warning' };
        let normalizedStatus = j.status?.toUpperCase() || 'OPEN';
        if (j.closing_date && new Date(j.closing_date).getTime() < new Date().setHours(0, 0, 0, 0) && normalizedStatus === 'OPEN') {
          normalizedStatus = 'CLOSED';
        }
        return <Badge variant={variants[normalizedStatus] || 'neutral'}>{normalizedStatus}</Badge>;
      }
    },
    {
      key: 'closing_date',
      label: 'Closing Date',
      render: (j) => j.closing_date ? new Date(j.closing_date).toLocaleDateString() : '—'
    },
    {
      key: 'actions',
      label: 'Actions',
      render: (j) => (
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          {canManage && (
            <Select
              value={j.status?.toUpperCase() || 'OPEN'}
              onChange={(e) => updateJobStatus(j.id, e.target.value)}
              style={{ width: 100, padding: '4px 8px', marginBottom: 0, fontSize: '0.75rem' }}
            >
              <option value="OPEN">Open</option>
              <option value="PAUSED">Paused</option>
              <option value="CLOSED">Closed</option>
            </Select>
          )}
          <Btn variant="secondary" size="sm" onClick={() => viewApplicants(j)}>
            <Users size={14} /> Applicants
          </Btn>
        </div>
      )
    }
  ];

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  if (selectedJob) {
    return <RecruitmentPipeline job={selectedJob} onClose={() => setSelectedJob(null)} />;
  }

  return (
    <div style={{ padding: 24, maxWidth: 1200, margin: '0 auto' }}>
      <PageHeader
        title="Recruitment"
        subtitle="Manage job postings and track applicant pipelines."
        actions={
          canManage ? (
            <Btn onClick={() => setJobModalOpen(true)}>
              <Plus size={16} /> Post New Job
            </Btn>
          ) : null
        }
      />

      {/* Fixed: search bar with debounce — prevents API hammering on every keystroke */}
      <div style={{ marginBottom: 16, display: 'flex', gap: 12 }}>
        <div style={{ position: 'relative', flex: 1, maxWidth: 400 }}>
          <Search size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--gray-400)' }} />
          <input
            style={{ width: '100%', padding: '8px 12px 8px 36px', borderRadius: 8, border: '1px solid var(--border-color)', fontSize: 13, fontFamily: 'var(--font-body)', background: 'var(--white)', color: 'var(--text-dark)', outline: 'none' }}
            placeholder="Search job titles… (debounced)"
            onChange={handleSearchChange}
          />
        </div>
        {total > 0 && (
          <span style={{ fontSize: 13, color: 'var(--gray-500)', display: 'flex', alignItems: 'center' }}>
            {total} job{total !== 1 ? 's' : ''} total
          </span>
        )}
      </div>

      {/* Jobs Grid replaces Table */}
      {loading && jobs.length === 0 ? (
        <div style={{ padding: 40, textAlign: 'center' }}>
          <Skeleton width="100%" height="300px" />
        </div>
      ) : jobs.length === 0 ? (
        <div style={{ padding: '80px 20px', textAlign: 'center', background: 'var(--white)', borderRadius: 16, border: '1px solid var(--gray-200)', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05)' }}>
          <div style={{ width: 72, height: 72, background: 'var(--gray-50)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', color: 'var(--gray-400)' }}>
            <Search size={32} />
          </div>
          <h3 style={{ margin: '0 0 8px 0', fontSize: 20, color: 'var(--gray-800)', fontWeight: 600 }}>No jobs found</h3>
          <p style={{ margin: 0, color: 'var(--gray-500)', fontSize: 15 }}>{jobSearch ? 'Try adjusting your search terms.' : 'Create a new job posting to get started.'}</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 24, position: 'relative' }}>
          {loading && (
            <div style={{ position: 'absolute', inset: -10, background: 'rgba(255,255,255,0.4)', backdropFilter: 'blur(2px)', zIndex: 10, borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ padding: '10px 20px', background: 'var(--white)', borderRadius: 30, boxShadow: '0 10px 25px rgba(0,0,0,0.1)', fontSize: 14, fontWeight: 600, color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ width: 16, height: 16, borderRadius: '50%', border: '2px solid var(--primary)', borderTopColor: 'transparent', animation: 'spin 1s linear infinite' }}></div>
                Refreshing...
              </span>
            </div>
          )}
          {jobs.map(j => {
            const variants = { 'OPEN': 'success', 'CLOSED': 'danger', 'PAUSED': 'warning' };
            let normalizedStatus = j.status?.toUpperCase() || 'OPEN';
            if (j.closing_date && new Date(j.closing_date).getTime() < new Date().setHours(0, 0, 0, 0) && normalizedStatus === 'OPEN') {
              normalizedStatus = 'CLOSED';
            }
            return (
              <div key={j.id} style={{ background: 'var(--white)', borderRadius: 16, border: '1px solid var(--gray-200)', overflow: 'hidden', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05), 0 2px 4px -1px rgba(0,0,0,0.03)', transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)', display: 'flex', flexDirection: 'column' }} onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -2px rgba(0,0,0,0.05)'; e.currentTarget.style.borderColor = 'var(--gray-300)'; }} onMouseLeave={(e) => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0,0,0,0.05), 0 2px 4px -1px rgba(0,0,0,0.03)'; e.currentTarget.style.borderColor = 'var(--gray-200)'; }}>
                <div style={{ padding: '24px', borderBottom: '1px solid var(--gray-100)', background: 'linear-gradient(to bottom right, #ffffff, #f8fafc)', position: 'relative' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
                    <Badge variant={variants[normalizedStatus] || 'neutral'} style={{ padding: '6px 12px', fontSize: 11 }}>{normalizedStatus}</Badge>
                    <span style={{ fontSize: 11, color: 'var(--gray-500)', fontWeight: 600, background: 'var(--gray-100)', padding: '4px 10px', borderRadius: 12, letterSpacing: '0.05em' }}>{j.type?.replace('_', ' ') || 'FULL TIME'}</span>
                  </div>
                  <h3 style={{ margin: '0 0 12px 0', fontSize: 18, fontWeight: 700, color: 'var(--text-dark)', lineHeight: 1.3, letterSpacing: '-0.01em' }}>{j.title}</h3>
                  <div style={{ fontSize: 13, color: 'var(--gray-600)', display: 'flex', alignItems: 'center', gap: 8, fontWeight: 500 }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--secondary)' }}></div>
                    {getDeptName(j.department_id)}
                  </div>
                </div>

                <div style={{ padding: '20px 24px', flex: 1, display: 'flex', flexDirection: 'column', gap: 16, background: '#ffffff' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                    <div style={{ display: 'flex', flexDirection: 'column' }}>
                      <span style={{ fontSize: 11, textTransform: 'uppercase', color: 'var(--gray-400)', fontWeight: 700, letterSpacing: '0.05em' }}>Closing Date</span>
                      <span style={{ fontSize: 14, color: 'var(--gray-800)', fontWeight: 600, marginTop: 4 }}>{j.closing_date ? new Date(j.closing_date).toLocaleDateString() : 'Continuous'}</span>
                    </div>
                    <Btn variant="primary" onClick={() => viewApplicants(j)} style={{ borderRadius: 8, padding: '8px 16px', fontWeight: 600, boxShadow: '0 4px 10px rgba(30, 23, 96, 0.15)' }}>
                      <Users size={16} /> Pipeline
                    </Btn>
                  </div>
                </div>

                {canManage && (
                  <div style={{ padding: '12px 24px', background: 'var(--gray-50)', borderTop: '1px solid var(--gray-200)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ fontSize: 12, color: 'var(--gray-500)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Update Status</span>
                    <Select
                      value={j.status?.toUpperCase() || 'OPEN'}
                      onChange={(e) => updateJobStatus(j.id, e.target.value)}
                      style={{ width: 120, padding: '6px 10px', marginBottom: 0, fontSize: '0.75rem', background: 'white', fontWeight: 600, borderRadius: 6, borderColor: 'var(--gray-300)' }}
                    >
                      <option value="OPEN">Open</option>
                      <option value="PAUSED">Paused</option>
                      <option value="CLOSED">Closed</option>
                    </Select>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {/* Fixed for 1M+ rows: pagination controls */}
      {totalPages > 1 && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 20px', borderTop: '1px solid var(--gray-200)', fontSize: 13 }}>
          <span style={{ color: 'var(--gray-500)' }}>
            Page <strong>{page}</strong> of <strong>{totalPages}</strong>
            {total > 0 && <> &nbsp;({total} total)</>}
          </span>
          <div style={{ display: 'flex', gap: 6 }}>
            <Btn variant="secondary" size="xs" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>
              <ChevronLeft size={13} /> Prev
            </Btn>
            <Btn variant="secondary" size="xs" disabled={page >= totalPages} onClick={() => setPage(p => p + 1)}>
              Next <ChevronRight size={13} />
            </Btn>
          </div>
        </div>
      )}

      {/* JOB CREATION WIZARD */}
      <JobPostingWizard
        open={jobModalOpen}
        onClose={() => setJobModalOpen(false)}
        onSuccess={() => {
          setJobModalOpen(false);
          setPage(1);
          loadJobs();
        }}
      />

    </div>
  );
}
