import React, { useState, useEffect } from 'react';
import { Megaphone, Plus, Calendar, Clock, CheckCircle, Trash2 } from 'lucide-react';
import { PageHeader, Card, Btn, Modal, Input, Select, Textarea, Badge, toast } from '../components/ui';
import { announcementsAPI, deptAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';

export default function Announcements() {
  const { canAccess, user } = useAuth();
  const canManage = canAccess(['admin', 'hr']);

  const [announcements, setAnnouncements] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);

  const [form, setForm] = useState({
    title: '', body: '', priority: 'normal', target_roles: [], target_departments: [], expires_at: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [annData, deptsData] = await Promise.all([
        announcementsAPI.list(),
        canManage && deptAPI.list ? deptAPI.list() : Promise.resolve([])
      ]);
      setAnnouncements(annData || []);
      if (deptsData) setDepartments(deptsData);
    } catch (err) {
      toast('Failed to load announcements', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      const data = { ...form };
      if (data.expires_at) {
        data.expires_at = new Date(data.expires_at).toISOString();
      } else {
        delete data.expires_at;
      }
      
      // Convert comma separated string to arrays if needed
      if (typeof data.target_roles === 'string') {
        data.target_roles = data.target_roles.split(',').map(s => s.trim()).filter(s => s);
      }
      if (typeof data.target_departments === 'string') {
        data.target_departments = data.target_departments.split(',').map(s => s.trim()).filter(s => s);
      }

      await announcementsAPI.create(data);
      toast('Announcement published!', 'success');
      setModalOpen(false);
      setForm({ title: '', body: '', priority: 'normal', target_roles: [], target_departments: [], expires_at: '' });
      loadData();
    } catch (err) {
      toast('Failed to publish announcement', 'error');
    }
  };

  const markAsRead = async (id) => {
    try {
      await announcementsAPI.markRead(id);
      // Update local state instead of full reload for speed
      setAnnouncements(prev => prev.map(a => a.id === id ? { ...a, is_read: true } : a));
    } catch (err) {
      toast('Failed to mark as read', 'error');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this announcement?")) return;
    try {
      await announcementsAPI.delete(id);
      toast('Announcement deleted', 'success');
      loadData();
    } catch (err) {
      toast('Failed to delete', 'error');
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority?.toLowerCase()) {
      case 'urgent': return 'danger';
      case 'important': return 'warning';
      default: return 'info';
    }
  };

  return (
    <div style={{ padding: 24, maxWidth: 1000, margin: '0 auto' }}>
      <PageHeader 
        title="Notice Board" 
        subtitle="University-wide announcements and important updates."
        actions={
          canManage ? (
            <Btn onClick={() => setModalOpen(true)}>
              <Plus size={16} /> Publish Notice
            </Btn>
          ) : null
        }
      />

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {loading ? (
          <p style={{ textAlign: 'center', color: 'var(--gray-500)', marginTop: 40 }}>Loading announcements...</p>
        ) : announcements.length === 0 ? (
          <Card style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--gray-500)' }}>
            <Megaphone size={40} style={{ margin: '0 auto', opacity: 0.2, marginBottom: 16 }} />
            <p>No new announcements.</p>
          </Card>
        ) : (
          announcements.map(ann => (
            <Card key={ann.id} style={{ 
              position: 'relative', 
              borderLeft: `4px solid var(--${getPriorityColor(ann.priority)})`,
              opacity: ann.is_read ? 0.75 : 1
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                  <h3 style={{ margin: 0, fontSize: 18, color: 'var(--text-dark)' }}>{ann.title}</h3>
                  {!ann.is_read && <Badge variant="primary">New</Badge>}
                  {ann.priority && ann.priority !== 'normal' && (
                    <Badge variant={getPriorityColor(ann.priority)}>{ann.priority.toUpperCase()}</Badge>
                  )}
                </div>
                {canManage && (
                  <button 
                    onClick={() => handleDelete(ann.id)}
                    style={{ background: 'none', border: 'none', color: 'var(--gray-400)', cursor: 'pointer' }}
                    title="Delete Announcement"
                  >
                    <Trash2 size={16} />
                  </button>
                )}
              </div>

              <div style={{ fontSize: 14, color: 'var(--text-dark)', lineHeight: 1.6, whiteSpace: 'pre-wrap', marginBottom: 16 }}>
                {ann.body}
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 12, color: 'var(--gray-500)', borderTop: '1px solid var(--border-color)', paddingTop: 12 }}>
                <div style={{ display: 'flex', gap: 16 }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <Calendar size={14} /> {new Date(ann.published_at).toLocaleDateString()}
                  </span>
                  {ann.expires_at && (
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <Clock size={14} /> Expires {new Date(ann.expires_at).toLocaleDateString()}
                    </span>
                  )}
                </div>
                
                {!ann.is_read && (
                  <Btn variant="outline" size="sm" onClick={() => markAsRead(ann.id)}>
                    <CheckCircle size={14} /> Mark as Read
                  </Btn>
                )}
              </div>
            </Card>
          ))
        )}
      </div>

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Publish Announcement" width={600}>
        <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <Input 
            label="Title" 
            required 
            value={form.title}
            onChange={(e) => setForm({...form, title: e.target.value})}
          />
          <Textarea 
            label="Message Body" 
            required 
            rows={5}
            value={form.body}
            onChange={(e) => setForm({...form, body: e.target.value})}
          />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <Select 
              label="Priority" 
              value={form.priority}
              onChange={(e) => setForm({...form, priority: e.target.value})}
            >
              <option value="normal">Normal</option>
              <option value="important">Important</option>
              <option value="urgent">Urgent</option>
            </Select>
            <Input 
              label="Expiry Date (Optional)" 
              type="date" 
              value={form.expires_at}
              onChange={(e) => setForm({...form, expires_at: e.target.value})}
            />
          </div>
          
          <div style={{ padding: '12px 16px', background: 'var(--gray-50)', borderRadius: 8, fontSize: 13, color: 'var(--text-light)' }}>
            <p style={{ margin: '0 0 8px 0', fontWeight: 500 }}>Targeting Options (Leave blank for all users)</p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <Input 
                label="Target Roles (comma separated)" 
                placeholder="e.g. hr, faculty"
                value={typeof form.target_roles === 'string' ? form.target_roles : form.target_roles.join(', ')}
                onChange={(e) => setForm({...form, target_roles: e.target.value})}
                style={{ marginBottom: 0 }}
              />
              <Input 
                label="Target Dept IDs (comma separated)" 
                placeholder="e.g. uuid-1, uuid-2"
                value={typeof form.target_departments === 'string' ? form.target_departments : form.target_departments.join(', ')}
                onChange={(e) => setForm({...form, target_departments: e.target.value})}
                style={{ marginBottom: 0 }}
              />
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12, marginTop: 8 }}>
            <Btn variant="secondary" onClick={() => setModalOpen(false)}>Cancel</Btn>
            <Btn type="submit">Publish</Btn>
          </div>
        </form>
      </Modal>

    </div>
  );
}
