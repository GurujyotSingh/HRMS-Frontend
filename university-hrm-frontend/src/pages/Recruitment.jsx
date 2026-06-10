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

// Fixed for 1M+ rows scalability:
// - Job listings are now server-side paginated (never loads all jobs)
// - Applicants per job are paginated
// - AbortController cancels stale requests on filter/page changes
// - Debounced job search to prevent API hammering

const PAGE_SIZE = 25;

export default function Recruitment() {
  const { canAccess } = useAuth();
  const canManage = canAccess(['admin', 'hr']);

  const [jobs, setJobs] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [jobSearch, setJobSearch] = useState('');

  // Fixed for 1M+ rows: pagination state
  const [page, setPage]   = useState(1);
  const [total, setTotal] = useState(0);

  const abortRef  = useRef(null);
  const searchRef = useRef(null); // Fixed: debounce timer ref

  // Modals
  const [jobModalOpen, setJobModalOpen] = useState(false);
  const [applicantModalOpen, setApplicantModalOpen] = useState(false);
  
  // Selection state
  const [selectedJob, setSelectedJob] = useState(null);
  const [applicants, setApplicants] = useState([]);
  const [loadingApplicants, setLoadingApplicants] = useState(false);
  const [appPage, setAppPage]   = useState(1);
  const [appTotal, setAppTotal] = useState(0);

  // Form states
  const [jobForm, setJobForm] = useState({
    title: '', department_id: '', type: 'FULL_TIME', 
    description: '', closing_date: ''
  });
  
  const [applicantForm, setApplicantForm] = useState({
    name: '', email: '', phone: '', resume_url: '', notes: ''
  });
  const [showAddApplicant, setShowAddApplicant] = useState(false);

  // Fixed for 1M+ rows: paginated job loading with AbortController
  const loadJobs = useCallback(async () => {
    if (abortRef.current) abortRef.current.abort();
    abortRef.current = new AbortController();

    setLoading(true);
    try {
      const { data } = await recruitmentAPI.listJobs({
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

  const handleCreateJob = async (e) => {
    e.preventDefault();
    try {
      const data = {
        ...jobForm,
        closing_date: new Date(jobForm.closing_date).toISOString()
      };
      await recruitmentAPI.createJob(data);
      toast('Job posted successfully!', 'success');
      setJobModalOpen(false);
      setJobForm({ title: '', department_id: '', type: 'FULL_TIME', description: '', closing_date: '' });
      setPage(1);
      loadJobs();
    } catch (err) {
      toast('Failed to post job', 'error');
    }
  };

  // Fixed for 1M+ rows: applicants are paginated per job
  const viewApplicants = async (job, newAppPage = 1) => {
    setSelectedJob(job);
    setApplicantModalOpen(true);
    setShowAddApplicant(false);
    setLoadingApplicants(true);
    setAppPage(newAppPage);
    try {
      const { data } = await recruitmentAPI.getApplicants(job.id, {
        limit: 20,
        skip: (newAppPage - 1) * 20,
      });
      const items = data?.data?.items || data?.items || data?.data || (Array.isArray(data) ? data : []);
      setApplicants(items);
      setAppTotal(data?.data?.total || data?.total || items.length);
    } catch (err) {
      toast('Failed to load applicants', 'error');
    } finally {
      setLoadingApplicants(false);
    }
  };

  const handleAddApplicant = async (e) => {
    e.preventDefault();
    try {
      await recruitmentAPI.addApplicant(selectedJob.id, applicantForm);
      toast('Applicant added successfully!', 'success');
      setShowAddApplicant(false);
      setApplicantForm({ name: '', email: '', phone: '', resume_url: '', notes: '' });
      viewApplicants(selectedJob, 1);
    } catch (err) {
      toast('Failed to add applicant', 'error');
    }
  };

  const updateApplicantStatus = async (id, status) => {
    try {
      await recruitmentAPI.updateApplicant(id, { status });
      toast('Status updated', 'success');
      viewApplicants(selectedJob, appPage);
    } catch (err) {
      toast('Failed to update status', 'error');
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
        return <Badge variant={variants[j.status] || 'neutral'}>{j.status}</Badge>;
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
        <Btn variant="secondary" size="sm" onClick={() => viewApplicants(j)}>
          <Users size={14} /> Applicants
        </Btn>
      )
    }
  ];

  const totalPages  = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const appTotalPages = Math.max(1, Math.ceil(appTotal / 20));

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

      <Card style={{ padding: 0, overflow: 'hidden' }}>
        {/* Fixed: overlay spinner keeps old data visible instead of full table flicker */}
        <div style={{ position: 'relative' }}>
          {loading && jobs.length > 0 && (
            <div style={{ position: 'absolute', inset: 0, background: 'rgba(255,255,255,0.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 10 }}>
              <span style={{ fontSize: 13, color: 'var(--gray-500)' }}>Loading…</span>
            </div>
          )}
          <Table 
            cols={jobCols} 
            rows={jobs} 
            loading={loading && jobs.length === 0} 
            emptyMsg="No active job postings."
          />
        </div>

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
      </Card>

      {/* JOB CREATION MODAL */}
      <Modal open={jobModalOpen} onClose={() => setJobModalOpen(false)} title="Post New Job">
        <form onSubmit={handleCreateJob} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <Input 
            label="Job Title" 
            required 
            value={jobForm.title}
            onChange={(e) => setJobForm({...jobForm, title: e.target.value})}
          />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <Select 
              label="Department" 
              required
              value={jobForm.department_id}
              onChange={(e) => setJobForm({...jobForm, department_id: e.target.value})}
            >
              <option value="">Select Department</option>
              {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
            </Select>
            <Select 
              label="Employment Type" 
              value={jobForm.type}
              onChange={(e) => setJobForm({...jobForm, type: e.target.value})}
            >
              <option value="FULL_TIME">Full Time</option>
              <option value="PART_TIME">Part Time</option>
              <option value="CONTRACT">Contract</option>
              <option value="VISITING">Visiting</option>
            </Select>
          </div>
          <Input 
            label="Closing Date" 
            type="date" 
            required 
            value={jobForm.closing_date}
            onChange={(e) => setJobForm({...jobForm, closing_date: e.target.value})}
          />
          <Textarea 
            label="Job Description" 
            required 
            rows={4}
            value={jobForm.description}
            onChange={(e) => setJobForm({...jobForm, description: e.target.value})}
          />
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 8 }}>
            <Btn variant="secondary" onClick={() => setJobModalOpen(false)}>Cancel</Btn>
            <Btn type="submit">Post Job</Btn>
          </div>
        </form>
      </Modal>

      {/* APPLICANTS MODAL — Fixed: paginated per job */}
      <Modal open={applicantModalOpen} onClose={() => setApplicantModalOpen(false)} title="Manage Applicants" width={700}>
        {selectedJob && (
          <div style={{ marginBottom: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, fontSize: 16, color: 'var(--text-dark)' }}>
                {selectedJob.title} Applicants
                {appTotal > 0 && <span style={{ fontSize: 13, color: 'var(--gray-500)', fontWeight: 400, marginLeft: 8 }}>({appTotal} total)</span>}
              </h3>
              <Btn size="sm" variant="outline" onClick={() => setShowAddApplicant(!showAddApplicant)}>
                {showAddApplicant ? 'Cancel' : 'Add Applicant'}
              </Btn>
            </div>
            
            {showAddApplicant && (
              <Card style={{ marginTop: 16, background: 'var(--gray-50)', padding: 16 }}>
                <form onSubmit={handleAddApplicant} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    <Input label="Name" required value={applicantForm.name} onChange={e => setApplicantForm({...applicantForm, name: e.target.value})} />
                    <Input label="Email" type="email" required value={applicantForm.email} onChange={e => setApplicantForm({...applicantForm, email: e.target.value})} />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    <Input label="Phone" value={applicantForm.phone} onChange={e => setApplicantForm({...applicantForm, phone: e.target.value})} />
                    <Input label="Resume URL" value={applicantForm.resume_url} onChange={e => setApplicantForm({...applicantForm, resume_url: e.target.value})} />
                  </div>
                  <Textarea label="Notes" rows={2} value={applicantForm.notes} onChange={e => setApplicantForm({...applicantForm, notes: e.target.value})} />
                  <Btn type="submit" style={{ alignSelf: 'flex-end' }}>Submit Applicant</Btn>
                </form>
              </Card>
            )}

            <div style={{ marginTop: 24 }}>
              {loadingApplicants ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {[1, 2].map((i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 12, border: '1px solid var(--border-color)', borderRadius: 8 }}>
                      <div>
                        <Skeleton width="120px" height="16px" style={{ marginBottom: 6 }} />
                        <Skeleton width="180px" height="12px" />
                      </div>
                      <Skeleton width="80px" height="24px" />
                    </div>
                  ))}
                </div>
              ) : applicants.length === 0 ? (
                <p style={{ color: 'var(--gray-500)', fontStyle: 'italic' }}>No applicants yet.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {applicants.map(app => (
                    <div key={app.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 12, border: '1px solid var(--border-color)', borderRadius: 8 }}>
                      <div>
                        <div style={{ fontWeight: 600 }}>{app.name}</div>
                        <div style={{ fontSize: 12, color: 'var(--gray-500)' }}>{app.email} {app.phone ? `• ${app.phone}` : ''}</div>
                      </div>
                      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                        <Badge variant={app.status === 'HIRED' ? 'success' : app.status === 'REJECTED' ? 'danger' : 'neutral'}>
                          {app.status || 'APPLIED'}
                        </Badge>
                        <Select 
                          value={app.status || 'APPLIED'}
                          onChange={(e) => updateApplicantStatus(app.id, e.target.value)}
                          style={{ width: 120, padding: '4px 8px', marginBottom: 0 }}
                        >
                          <option value="APPLIED">Applied</option>
                          <option value="SCREENING">Screening</option>
                          <option value="INTERVIEW">Interview</option>
                          <option value="OFFERED">Offered</option>
                          <option value="HIRED">Hired</option>
                          <option value="REJECTED">Rejected</option>
                        </Select>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Fixed for 1M+ rows: applicant pagination */}
              {appTotalPages > 1 && (
                <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 16 }}>
                  <Btn variant="secondary" size="xs" disabled={appPage <= 1} onClick={() => viewApplicants(selectedJob, appPage - 1)}>
                    <ChevronLeft size={13} /> Prev
                  </Btn>
                  <span style={{ fontSize: 13, color: 'var(--gray-500)', display: 'flex', alignItems: 'center' }}>
                    {appPage} / {appTotalPages}
                  </span>
                  <Btn variant="secondary" size="xs" disabled={appPage >= appTotalPages} onClick={() => viewApplicants(selectedJob, appPage + 1)}>
                    Next <ChevronRight size={13} />
                  </Btn>
                </div>
              )}
            </div>
          </div>
        )}
      </Modal>

    </div>
  );
}
