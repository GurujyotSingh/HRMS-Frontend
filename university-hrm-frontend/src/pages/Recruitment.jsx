import React, { useState, useEffect } from 'react';
import { 
  Briefcase, Plus, Users, Search, 
  ChevronRight, Calendar, Building, FileText 
} from 'lucide-react';
import { 
  PageHeader, Card, Table, Badge, Btn, 
  Modal, Input, Select, Textarea, toast 
} from '../components/ui';
import { recruitmentAPI, deptAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function Recruitment() {
  const { canAccess } = useAuth();
  const canManage = canAccess(['admin', 'hr']);

  const [jobs, setJobs] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Modals
  const [jobModalOpen, setJobModalOpen] = useState(false);
  const [applicantModalOpen, setApplicantModalOpen] = useState(false);
  
  // Selection state
  const [selectedJob, setSelectedJob] = useState(null);
  const [applicants, setApplicants] = useState([]);
  const [loadingApplicants, setLoadingApplicants] = useState(false);

  // Form states
  const [jobForm, setJobForm] = useState({
    title: '', department_id: '', type: 'FULL_TIME', 
    description: '', closing_date: ''
  });
  
  const [applicantForm, setApplicantForm] = useState({
    name: '', email: '', phone: '', resume_url: '', notes: ''
  });
  const [showAddApplicant, setShowAddApplicant] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [jobsData, deptsData] = await Promise.all([
        recruitmentAPI.listJobs(),
        deptAPI.list ? deptAPI.list() : Promise.resolve([])
      ]);
      setJobs(jobsData || []);
      setDepartments(deptsData || []);
    } catch (err) {
      toast('Failed to load recruitment data', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateJob = async (e) => {
    e.preventDefault();
    try {
      // API expects datetime for closing_date, format appropriately
      const data = {
        ...jobForm,
        closing_date: new Date(jobForm.closing_date).toISOString()
      };
      await recruitmentAPI.createJob(data);
      toast('Job posted successfully!', 'success');
      setJobModalOpen(false);
      setJobForm({ title: '', department_id: '', type: 'FULL_TIME', description: '', closing_date: '' });
      loadData();
    } catch (err) {
      toast('Failed to post job', 'error');
    }
  };

  const viewApplicants = async (job) => {
    setSelectedJob(job);
    setApplicantModalOpen(true);
    setShowAddApplicant(false);
    setLoadingApplicants(true);
    try {
      const data = await recruitmentAPI.getApplicants(job.id);
      setApplicants(data || []);
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
      // Reload applicants
      const data = await recruitmentAPI.getApplicants(selectedJob.id);
      setApplicants(data || []);
    } catch (err) {
      toast('Failed to add applicant', 'error');
    }
  };

  const updateApplicantStatus = async (id, status) => {
    try {
      await recruitmentAPI.updateApplicant(id, { status });
      toast('Status updated', 'success');
      const data = await recruitmentAPI.getApplicants(selectedJob.id);
      setApplicants(data || []);
    } catch (err) {
      toast('Failed to update status', 'error');
    }
  };

  const getDeptName = (id) => {
    const dept = departments.find(d => d.id === id);
    return dept ? dept.name : id;
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
        const variants = { 'open': 'success', 'closed': 'danger', 'paused': 'warning' };
        return <Badge variant={variants[j.status?.toLowerCase()] || 'neutral'}>{j.status}</Badge>;
      }
    },
    { 
      key: 'closing_date', 
      label: 'Closing Date',
      render: (j) => new Date(j.closing_date).toLocaleDateString()
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

      <Card style={{ padding: 0, overflow: 'hidden' }}>
        <Table 
          cols={jobCols} 
          rows={jobs} 
          loading={loading} 
          emptyMsg="No active job postings."
        />
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
              {/* Fallback option if departments API fails/empty */}
              {departments.length === 0 && <option value="IT">IT</option>}
              {departments.length === 0 && <option value="HR">HR</option>}
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

      {/* APPLICANTS MODAL */}
      <Modal open={applicantModalOpen} onClose={() => setApplicantModalOpen(false)} title="Manage Applicants" width={700}>
        {selectedJob && (
          <div style={{ marginBottom: 20 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, fontSize: 16, color: 'var(--text-dark)' }}>{selectedJob.title} Applicants</h3>
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
                <p>Loading applicants...</p>
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
                        <Badge variant={app.status === 'hired' ? 'success' : app.status === 'rejected' ? 'danger' : 'neutral'}>
                          {app.status || 'applied'}
                        </Badge>
                        <Select 
                          value={app.status || 'applied'}
                          onChange={(e) => updateApplicantStatus(app.id, e.target.value)}
                          style={{ width: 120, padding: '4px 8px', marginBottom: 0 }}
                        >
                          <option value="applied">Applied</option>
                          <option value="screening">Screening</option>
                          <option value="interview">Interview</option>
                          <option value="offered">Offered</option>
                          <option value="hired">Hired</option>
                          <option value="rejected">Rejected</option>
                        </Select>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </Modal>

    </div>
  );
}
