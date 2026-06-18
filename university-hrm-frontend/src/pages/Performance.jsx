import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { perfAPI, employeesAPI, aiAPI } from '../services/api';
import {
  PageHeader, Card, Table, Btn, Modal, Input, Textarea, Select, Badge, Tabs,
  StarRating, toast,
} from '../components/ui';
import AsyncEmployeeSelect from '../components/ui/AsyncEmployeeSelect';
import { Plus, Star, Send } from 'lucide-react';

const STATUS_MAP = {
  DRAFT:        { variant: 'neutral', label: 'Draft' },
  SUBMITTED:    { variant: 'info',    label: 'Submitted' },
  DIRECTOR_REVIEWED: { variant: 'blue',   label: 'Director Reviewed' },
  FINALIZED:    { variant: 'success', label: 'Finalized' },
};

export default function Performance() {
  const { hasRole } = useAuth();
  const [tab, setTab] = useState('my');
  const [cycles, setCycles] = useState([]);
  const [myGoals, setMyGoals] = useState([]);
  const [directorGoals, setDirectorGoals] = useState([]);
  const [allGoals, setAllGoals] = useState([]);
  const [loading, setLoading] = useState(true);

  const [showCreate, setShowCreate] = useState(false);
  const [showSelf, setShowSelf] = useState(null);
  const [showDirector, setShowDirector] = useState(null);
  const [showFinalize, setShowFinalize] = useState(null);

  const [showCreateCycle, setShowCreateCycle] = useState(false);
  const [cycleForm, setCycleForm] = useState({ name: '', year: new Date().getFullYear(), start_date: '', end_date: '' });
  const [showAssignGoal, setShowAssignGoal] = useState(false);
  const [assignForm, setAssignForm] = useState({ employee_id: '', cycleId: '', title: '', description: '' });
  const [teamMembers, setTeamMembers] = useState([]);

  const [goalForm, setGoalForm] = useState({ cycleId: '', title: '', description: '' });
  const [selfRating, setSelfRating] = useState(0);
  const [selfComments, setSelfComments] = useState('');
  const [directorRating, setDirectorRating] = useState(0);
  const [directorComments, setDirectorComments] = useState('');
  const [finRating, setFinRating] = useState(0);
  const [finComments, setFinComments] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const [aiLoading, setAiLoading] = useState(false);
  const [aiSuggestion, setAiSuggestion] = useState('');

  const isHR = hasRole('hr', 'admin', 'hr_manager');
  const isDirector = hasRole('director');

  const tabs = [
    { key: 'my', label: 'My Objectives' },
    ...(isDirector ? [{ key: 'director', label: 'Team Review' }] : []),
    ...(isHR ? [{ key: 'all', label: 'All Objectives' }] : []),
  ];

  const loadData = async () => {
    setLoading(true);
    try {
      try {
        const { data } = await perfAPI.cycles();
        setCycles(data?.data || data || []);
      } catch { setCycles([]); }

      try {
        const { data } = await perfAPI.myGoals();
        setMyGoals(data?.data || data || []);
      } catch { setMyGoals([]); }

      if (isDirector) {
        try {
          const { data } = await perfAPI.directorPending();
          setDirectorGoals(data?.data || data || []);
          const { data: emps } = await employeesAPI.list();
          setTeamMembers(emps?.items || emps?.data || emps || []);
        } catch { setDirectorGoals([]); setTeamMembers([]); }
      }

      if (isHR) {
        try {
          const { data } = await perfAPI.allGoals({});
          setAllGoals(data?.data || data || []);
        } catch { setAllGoals([]); }
      }
    } catch (e) {
      toast(e.response?.data?.message || 'Failed to load performance data', 'error');
    } finally {
      setLoading(false);
    }
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { loadData(); }, []);

  const handleCreateGoal = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await perfAPI.submitGoals({
        cycleId: parseInt(goalForm.cycleId),
        title: goalForm.title,
        description: goalForm.description,
      });
      toast('Goal created!', 'success');
      setShowCreate(false);
      setGoalForm({ cycleId: '', title: '', description: '' });
      loadData();
    } catch (e) {
      toast(e.response?.data?.message || 'Failed to create goal', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmitGoal = async (id) => {
    try {
      await perfAPI.submitGoal(id);
      toast('Goal submitted for review', 'success');
      loadData();
    } catch (e) {
      toast(e.response?.data?.message || 'Failed to submit goal', 'error');
    }
  };

  const handleAssignGoal = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await perfAPI.assignGoal({
        employee_id: assignForm.employee_id,
        cycleId: parseInt(assignForm.cycleId),
        title: assignForm.title,
        description: assignForm.description,
      });
      toast('Goal assigned successfully!', 'success');
      setShowAssignGoal(false);
      setAssignForm({ employee_id: '', cycleId: '', title: '', description: '' });
      loadData();
    } catch (e) {
      toast(e.response?.data?.message || 'Failed to assign goal', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEnhanceGoal = async () => {
    if (!goalForm.description) {
      toast('Please write a goal description first', 'warning');
      return;
    }
    setAiLoading(true);
    setAiSuggestion('');
    try {
      const { data } = await aiAPI.chat(`Suggest a SMART version of this performance goal: ${goalForm.description}`);
      setAiSuggestion(data?.reply || data?.message || '');
    } catch (e) {
      toast('Failed to enhance goal', 'error');
    } finally {
      setAiLoading(false);
    }
  };

  const handleCreateCycle = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await perfAPI.createCycle({
        name: cycleForm.name,
        start_date: cycleForm.start_date,
        end_date: cycleForm.end_date,
      });
      toast('Appraisal cycle created!', 'success');
      setShowCreateCycle(false);
      setCycleForm({ name: '', year: new Date().getFullYear(), start_date: '', end_date: '' });
      loadData();
    } catch (e) {
      toast(e.response?.data?.message || 'Failed to create cycle', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCloseCycle = async (id) => {
    try {
      await perfAPI.closeCycle(id);
      toast('Cycle closed successfully', 'success');
      loadData();
    } catch (e) {
      toast(e.response?.data?.message || 'Failed to close cycle', 'error');
    }
  };

  const handleSelfReview = async (e) => {
    e.preventDefault();
    if (!selfRating || selfRating < 1 || selfRating > 5) {
      toast('Rating must be between 1 and 5', 'error');
      return;
    }
    setSubmitting(true);
    try {
      await perfAPI.selfRate(showSelf.id, {
        selfRating: selfRating,
        selfComments: selfComments,
      });
      toast('Self review submitted', 'success');
      setShowSelf(null);
      loadData();
    } catch (e) {
      toast(e.response?.data?.message || 'Failed to submit self review', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDirectorReview = async (e) => {
    e.preventDefault();
    if (!directorRating || directorRating < 1 || directorRating > 5) {
      toast('Rating must be between 1 and 5', 'error');
      return;
    }
    setSubmitting(true);
    try {
      await perfAPI.directorReview(showDirector.id, {
        directorRating: directorRating,
        directorComments: directorComments,
      });
      toast('Director review submitted', 'success');
      setShowDirector(null);
      loadData();
    } catch (e) {
      toast(e.response?.data?.message || 'Failed to submit review', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleFinalize = async (e) => {
    e.preventDefault();
    if (!finRating || finRating < 1 || finRating > 5) {
      toast('Rating must be between 1 and 5', 'error');
      return;
    }
    setSubmitting(true);
    try {
      await perfAPI.hrFinalize(showFinalize.id, {
        finalRating: finRating,
        hrComments: finComments,
      });
      toast('Goal finalized', 'success');
      setShowFinalize(null);
      loadData();
    } catch (e) {
      toast(e.response?.data?.message || 'Failed to finalize', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const renderStars = (val) => (
    <StarRating value={val || 0} readOnly size={16} />
  );

  const myCols = [
    { key: 'title', label: 'Academic Objective', render: (r) => (
      <div>
        <div style={{ fontWeight: 600 }}>{r.title}</div>
        <div style={{ fontSize: 13, color: 'var(--gray-500)', maxWidth: 300 }} className="truncate">{r.description || '—'}</div>
      </div>
    )},
    { key: 'status', label: 'Status', render: (r) => {
      const s = STATUS_MAP[r.status] || STATUS_MAP.DRAFT;
      return <Badge variant={s.variant}>{s.label}</Badge>;
    }},
    { key: 'selfRating', label: 'Self', render: (r) => renderStars(r.selfRating) },
    { key: 'directorRating', label: 'Director', render: (r) => renderStars(r.directorRating) },
    { key: 'finalRating', label: 'Final', render: (r) => renderStars(r.finalRating) },
    { key: 'actions', label: '', render: (r) => (
      <div style={{ display: 'flex', gap: 6 }}>
        {r.status === 'DRAFT' && (
          <Btn variant="outline" size="xs" onClick={() => handleSubmitGoal(r.id)}>
            <Send size={13} /> Submit
          </Btn>
        )}
        {r.status === 'SUBMITTED' && !r.selfRating && (
          <Btn variant="secondary" size="xs" onClick={() => {
            setShowSelf(r);
            setSelfRating(r.selfRating || 0);
            setSelfComments(r.selfComments || '');
          }}>
            <Star size={13} /> Self Review
          </Btn>
        )}
      </div>
    )},
  ];

  const directorCols = [
    { key: 'emp', label: 'Employee', render: (r) => `${r.employee?.first_name || ''} ${r.employee?.last_name || ''}` },
    { key: 'title', label: 'Goal', render: (r) => (
      <span style={{ maxWidth: 250 }} className="truncate">{r.title || '—'}</span>
    )},
    { key: 'selfRating', label: 'Self Rating', render: (r) => renderStars(r.selfRating) },
    { key: 'actions', label: '', render: (r) => (
      <Btn variant="primary" size="xs" onClick={() => {
        setShowDirector(r);
        setDirectorRating(r.directorRating || 0);
        setDirectorComments(r.directorComments || '');
      }}>
        <Star size={13} /> Review
      </Btn>
    )},
  ];

  const allCols = [
    { key: 'emp', label: 'Employee', render: (r) => `${r.employee?.first_name || ''} ${r.employee?.last_name || ''}` },
    { key: 'title', label: 'Goal', render: (r) => (
      <span style={{ maxWidth: 200 }} className="truncate">{r.title || '—'}</span>
    )},
    { key: 'status', label: 'Status', render: (r) => {
      const s = STATUS_MAP[r.status] || STATUS_MAP.DRAFT;
      return <Badge variant={s.variant}>{s.label}</Badge>;
    }},
    { key: 'selfRating', label: 'Self', render: (r) => renderStars(r.selfRating) },
    { key: 'directorRating', label: 'Director', render: (r) => renderStars(r.directorRating) },
    { key: 'finalRating', label: 'Final', render: (r) => renderStars(r.finalRating) },
    { key: 'actions', label: '', render: (r) =>
      r.status === 'DIRECTOR_REVIEWED' ? (
        <Btn variant="success" size="xs" onClick={() => {
          setShowFinalize(r);
          setFinRating(r.finalRating || 0);
          setFinComments(r.hrComments || '');
        }}>
          <Star size={13} /> Finalize
        </Btn>
      ) : null
    },
  ];

  return (
    <>
      <PageHeader
        title="Academic Evaluations"
        subtitle="Set academic objectives, track reviews and appraisal ratings"
        actions={<Btn onClick={() => setShowCreate(true)}><Plus size={16} /> New Objective</Btn>}
      />

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h3 style={{ fontSize: 16, fontWeight: 600 }}>Evaluation Cycles</h3>
        {isHR && (
          <Btn size="sm" onClick={() => setShowCreateCycle(true)}>
            <Plus size={14} /> New Cycle
          </Btn>
        )}
      </div>
      <div className="grid-stats" style={{ marginBottom: 24 }}>
        {cycles.filter((c) => c.isActive).map((c) => (
          <Card key={c.id} style={{ padding: 16, borderLeft: '4px solid var(--primary)' }}>
            <div style={{ fontWeight: 600, fontSize: 15, marginBottom: 4 }}>{c.name}</div>
            <div style={{ fontSize: 13, color: 'var(--gray-500)' }}>
              {new Date(c.start_date).toLocaleDateString()} → {new Date(c.end_date).toLocaleDateString()}
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 12 }}>
              <Badge variant="success">Active</Badge>
              {isHR && (
                <Btn variant="danger" size="xs" onClick={() => handleCloseCycle(c.id)}>
                  Close Cycle
                </Btn>
              )}
            </div>
          </Card>
        ))}
        {cycles.filter(c => c.isActive).length === 0 && <div style={{ color: 'var(--gray-500)', fontSize: 14 }}>No active cycles</div>}
      </div>

      <Card style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ padding: '16px 20px 0' }}>
          <Tabs tabs={tabs} active={tab} onChange={setTab} />
        </div>
        {tab === 'my' && <Table cols={myCols} rows={myGoals} loading={loading} emptyMsg="No goals found" />}
        {tab === 'director' && (
          <>
            <div style={{ padding: '16px 20px', display: 'flex', justifyContent: 'flex-end', borderBottom: '1px solid var(--border-color)' }}>
              <Btn size="sm" onClick={() => setShowAssignGoal(true)}>
                <Plus size={14} /> Assign Goal to Team
              </Btn>
            </div>
            <Table cols={directorCols} rows={directorGoals} loading={loading} emptyMsg="No goals pending review" />
          </>
        )}
        {tab === 'all' && <Table cols={allCols} rows={allGoals} loading={loading} emptyMsg="No goals found" />}
      </Card>

      {/* Create Goal Modal */}
      <Modal open={showCreate} onClose={() => { setShowCreate(false); setAiSuggestion(''); }} title="Create Academic Objective" width={480}>
        <form onSubmit={handleCreateGoal}>
          <Select label="Evaluation Cycle" value={goalForm.cycleId} onChange={(e) => setGoalForm({ ...goalForm, cycleId: e.target.value })} required id="goal-cycle">
            <option value="">Select Cycle</option>
            {cycles.filter(c => c.isActive).map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </Select>
          <Input label="Objective Title (e.g. Research Paper)" value={goalForm.title} onChange={(e) => setGoalForm({ ...goalForm, title: e.target.value })} required id="goal-title" />
          <Textarea label="Description" value={goalForm.description} onChange={(e) => setGoalForm({ ...goalForm, description: e.target.value })} placeholder="Describe your publications, grants, or teaching goals" required id="goal-text" />
          
          <div style={{ margin: '12px 0' }}>
            <Btn type="button" variant="ghost" size="sm" onClick={handleEnhanceGoal} loading={aiLoading}>
              <span style={{ marginRight: 6 }}>✨</span> AI Suggest SMART Goal
            </Btn>
            {aiSuggestion && (
              <div style={{ padding: '12px 16px', background: 'var(--gray-50)', borderRadius: 8, marginTop: 12, fontSize: 13, border: '1px solid var(--border-color)', color: 'var(--text-light)', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
                <div style={{ fontWeight: 600, marginBottom: 8, color: 'var(--text-dark)' }}>💡 AI Suggestion:</div>
                {aiSuggestion}
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 12 }}>
                  <Btn size="xs" variant="outline" type="button" onClick={() => {
                    setGoalForm({ ...goalForm, description: aiSuggestion });
                    setAiSuggestion('');
                  }}>Use This Suggestion</Btn>
                </div>
              </div>
            )}
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 16 }}>
            <Btn variant="secondary" onClick={() => setShowCreate(false)} type="button">Cancel</Btn>
            <Btn type="submit" loading={submitting}>Save Goal</Btn>
          </div>
        </form>
      </Modal>

      {/* Self Review Modal */}
      <Modal open={!!showSelf} onClose={() => setShowSelf(null)} title="Self Review" width={440}>
        <form onSubmit={handleSelfReview}>
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: 'var(--text-light)', marginBottom: 8 }}>Your Rating</label>
            <StarRating value={selfRating} onChange={setSelfRating} size={28} />
          </div>
          <Textarea label="Comments" value={selfComments} onChange={(e) => setSelfComments(e.target.value)} placeholder="Describe your achievements and progress" id="self-comment" />
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 8 }}>
            <Btn variant="secondary" onClick={() => setShowSelf(null)}>Cancel</Btn>
            <Btn type="submit" loading={submitting}>Submit Review</Btn>
          </div>
        </form>
      </Modal>

      {/* Director Review Modal */}
      <Modal open={!!showDirector} onClose={() => setShowDirector(null)} title="Director Review" width={440}>
        <form onSubmit={handleDirectorReview}>
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: 'var(--text-light)', marginBottom: 8 }}>Director Rating</label>
            <StarRating value={directorRating} onChange={setDirectorRating} size={28} />
          </div>
          <Textarea label="Comments" value={directorComments} onChange={(e) => setDirectorComments(e.target.value)} placeholder="Provide feedback on the employee's performance" id="dir-comment" />
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 8 }}>
            <Btn variant="secondary" onClick={() => setShowDirector(null)}>Cancel</Btn>
            <Btn type="submit" loading={submitting}>Submit Review</Btn>
          </div>
        </form>
      </Modal>

      {/* HR Finalize Modal */}
      <Modal open={!!showFinalize} onClose={() => setShowFinalize(null)} title="Finalize Rating" width={440}>
        <form onSubmit={handleFinalize}>
          <div style={{ marginBottom: 16 }}>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: 'var(--text-light)', marginBottom: 8 }}>Final Rating</label>
            <StarRating value={finRating} onChange={setFinRating} size={28} />
          </div>
          <Textarea label="HR Comments" value={finComments} onChange={(e) => setFinComments(e.target.value)} placeholder="Final assessment comments" id="fin-comment" />
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 8 }}>
            <Btn variant="secondary" onClick={() => setShowFinalize(null)}>Cancel</Btn>
            <Btn type="submit" loading={submitting} variant="success">Finalize</Btn>
          </div>
        </form>
      </Modal>

      {/* Create Cycle Modal */}
      <Modal open={showCreateCycle} onClose={() => setShowCreateCycle(false)} title="Create Appraisal Cycle" width={480}>
        <form onSubmit={handleCreateCycle}>
          <Input label="Cycle Title" placeholder="e.g. Q1 2026 Performance" value={cycleForm.name} onChange={(e) => setCycleForm({ ...cycleForm, name: e.target.value })} required id="cycle-title" />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <Input label="Start Date" type="date" value={cycleForm.start_date} onChange={(e) => setCycleForm({ ...cycleForm, start_date: e.target.value })} required id="cycle-start" />
            <Input label="End Date" type="date" min={cycleForm.start_date} value={cycleForm.end_date} onChange={(e) => setCycleForm({ ...cycleForm, end_date: e.target.value })} required id="cycle-end" />
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 16 }}>
            <Btn variant="secondary" onClick={() => setShowCreateCycle(false)}>Cancel</Btn>
            <Btn type="submit" loading={submitting}>Create Cycle</Btn>
          </div>
        </form>
      </Modal>

      {/* Assign Goal Modal */}
      <Modal open={showAssignGoal} onClose={() => setShowAssignGoal(false)} title="Assign Goal to Team" width={480}>
        <form onSubmit={handleAssignGoal}>
          <AsyncEmployeeSelect 
            label="Employee" 
            value={assignForm.employee_id} 
            onChange={(val) => setAssignForm({ ...assignForm, employee_id: val })} 
            required 
          />
          <Select label="Appraisal Cycle" value={assignForm.cycleId} onChange={(e) => setAssignForm({ ...assignForm, cycleId: e.target.value })} required id="assign-cycle">
            <option value="">Select Cycle</option>
            {cycles.filter(c => c.isActive).map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </Select>
          <Input label="Goal Title" value={assignForm.title} onChange={(e) => setAssignForm({ ...assignForm, title: e.target.value })} required id="assign-title" />
          <Textarea label="Goal Description" value={assignForm.description} onChange={(e) => setAssignForm({ ...assignForm, description: e.target.value })} placeholder="Describe the goal objectives" required id="assign-text" />
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 16 }}>
            <Btn variant="secondary" onClick={() => setShowAssignGoal(false)}>Cancel</Btn>
            <Btn type="submit" loading={submitting}>Assign Goal</Btn>
          </div>
        </form>
      </Modal>
    </>
  );
}
