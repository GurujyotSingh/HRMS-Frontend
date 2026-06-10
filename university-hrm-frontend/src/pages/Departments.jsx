import React, { useEffect, useState } from 'react';
import { deptAPI } from '../services/api';
import { PageHeader, Card, Btn, Modal, Input, Skeleton, toast, Badge } from '../components/ui';
import { Plus, Edit2, Trash2, Building2, Mail } from 'lucide-react';

export default function Departments() {
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: '', code: '', director_id: '' });
  const [confirmDelete, setConfirmDelete] = useState(null);

  const load = async () => {
    setLoading(true);
    try {
      const { data } = await deptAPI.list();
      setDepartments(data?.data || data || []);
    } catch (e) {
      toast(e.response?.data?.message || 'Failed to load departments', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const openCreate = () => {
    setEditing(null);
    setForm({ name: '', code: '', director_id: '' });
    setShowModal(true);
  };

  const openEdit = (dept) => {
    setEditing(dept);
    setForm({ name: dept.name, code: dept.code || '', director_id: dept.director_id || '' });
    setShowModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      // Remove empty director_id to allow backend to handle it as null if needed
      const payload = { ...form };
      if (!payload.director_id) delete payload.director_id;

      if (editing) {
        await deptAPI.update(editing.id, payload);
        toast('Department updated', 'success');
      } else {
        await deptAPI.create(payload);
        toast('Department created', 'success');
      }
      setShowModal(false);
      load();
    } catch (e) {
      toast(e.response?.data?.message || 'Failed to save department', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await deptAPI.delete(id);
      toast('Department deleted', 'success');
      setConfirmDelete(null);
      load();
    } catch (e) {
      toast(e.response?.data?.message || 'Failed to delete department', 'error');
    }
  };

  if (loading) {
    return (
      <div style={{ padding: '0 24px', maxWidth: 1400, margin: '0 auto' }}>
        <PageHeader
          title="Departments"
          subtitle="Manage organizational departments and faculty structures"
          actions={<Btn disabled style={{ background: 'linear-gradient(135deg, #4f46e5 0%, #3730a3 100%)', color: '#fff', border: 'none', padding: '10px 18px', borderRadius: '8px' }}><Plus size={16} /> Add Department</Btn>}
        />

        {/* Grid Skeletons */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 24, marginTop: 24 }}>
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} style={{ borderRadius: 22, padding: 24, border: '1px solid var(--border-color)', boxShadow: '0 4px 12px rgba(0,0,0,0.03)' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16, marginBottom: 20 }}>
                <Skeleton width="48px" height="48px" style={{ borderRadius: 14 }} />
                <div style={{ flex: 1 }}>
                  <Skeleton width="120px" height="18px" style={{ marginBottom: 8 }} />
                  <Skeleton width="80px" height="24px" style={{ borderRadius: 12 }} />
                </div>
              </div>
              <Skeleton width="100%" height="40px" style={{ marginBottom: 24 }} />
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: '0 24px', maxWidth: 1400, margin: '0 auto', animation: 'fadeIn 0.3s ease-out' }}>
      <PageHeader
        title={<span style={{ fontSize: 28, fontWeight: 700, color: 'var(--text-dark)', letterSpacing: '-0.02em' }}>Departments</span>}
        subtitle="Manage organizational departments and faculty structures"
        actions={
          <Btn 
            onClick={openCreate} 
            style={{ 
              background: 'linear-gradient(135deg, #4f46e5 0%, #3730a3 100%)', 
              color: '#fff', 
              border: 'none', 
              padding: '10px 18px', 
              borderRadius: '8px',
              fontWeight: 500,
              boxShadow: '0 4px 12px rgba(79, 70, 229, 0.25)'
            }}
          >
            <Plus size={16} /> Add Department
          </Btn>
        }
      />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 24, marginTop: 24 }}>
        {departments.map((dept) => (
          <div 
            key={dept.id} 
            style={{ 
              background: '#fff', 
              borderRadius: 22, 
              border: '1px solid var(--border-color)', 
              padding: 24,
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.03)',
              transition: 'transform 0.2s cubic-bezier(0.4, 0, 0.2, 1), box-shadow 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
              cursor: 'default',
              position: 'relative'
            }}
            onMouseEnter={e => {
              e.currentTarget.style.transform = 'translateY(-4px)';
              e.currentTarget.style.boxShadow = '0 12px 24px rgba(0, 0, 0, 0.06)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.03)';
            }}
          >
            {/* Action buttons absolute top right */}
            <div style={{ position: 'absolute', top: 20, right: 20, display: 'flex', gap: 4 }}>
              <button onClick={() => openEdit(dept)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 6, color: 'var(--text-light)', borderRadius: 6, transition: 'background 0.2s' }} onMouseEnter={e => e.currentTarget.style.background = 'var(--gray-100)'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                <Edit2 size={16} />
              </button>
              <button onClick={() => setConfirmDelete(dept)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 6, color: 'var(--text-light)', borderRadius: 6, transition: 'background 0.2s' }} onMouseEnter={e => { e.currentTarget.style.background = '#fef2f2'; e.currentTarget.style.color = 'var(--danger)'; }} onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-light)'; }}>
                <Trash2 size={16} />
              </button>
            </div>

            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16, marginBottom: 16 }}>
              <div style={{ 
                width: 48, height: 48, borderRadius: 14, 
                background: 'linear-gradient(135deg, #eef2ff 0%, #e0e7ff 100%)', 
                color: '#4f46e5', 
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 
              }}>
                <Building2 size={24} />
              </div>
              <div style={{ flex: 1, minWidth: 0, paddingRight: 60 }}>
                <h3 style={{ fontSize: 17, fontWeight: 600, color: 'var(--text-dark)', marginBottom: 6, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {dept.name}
                </h3>
                <Badge variant="success" style={{ fontSize: 11, padding: '2px 8px' }}>Active</Badge>
              </div>
            </div>

            <div style={{ fontSize: 13, color: 'var(--text-light)', margin: 0, lineHeight: 1.6, minHeight: 42 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                <strong style={{ color: 'var(--text-dark)', width: 80 }}>Code:</strong> 
                <span style={{ fontFamily: 'monospace', background: 'var(--gray-100)', padding: '2px 6px', borderRadius: 4 }}>{dept.code}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <strong style={{ color: 'var(--text-dark)', width: 80 }}>Director:</strong> 
                  <span>{dept.director_name || 'Not Assigned'}</span>
                </div>
                {dept.director_email && (
                  <a href={`mailto:${dept.director_email}`} title="Email Director" style={{ color: 'var(--primary)', padding: 4, display: 'flex', borderRadius: 4, transition: 'background 0.2s' }} onMouseEnter={e => e.currentTarget.style.background = 'var(--gray-100)'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                    <Mail size={16} />
                  </a>
                )}
              </div>
            </div>
          </div>
        ))}

        {departments.length === 0 && (
          <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: 60, background: '#fff', borderRadius: 22, border: '1px dashed var(--border-color)' }}>
            <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'var(--gray-100)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', color: 'var(--gray-400)' }}>
              <Building2 size={32} />
            </div>
            <h3 style={{ fontSize: 18, fontWeight: 600, color: 'var(--text-dark)', marginBottom: 8 }}>No Departments Found</h3>
            <p style={{ color: 'var(--text-light)', fontSize: 14, maxWidth: 400, margin: '0 auto 20px' }}>
              Your organization currently has no departments. Create your first department to start organizing your workforce.
            </p>
            <Btn onClick={openCreate} style={{ background: '#4f46e5', border: 'none' }}><Plus size={16} /> Create Department</Btn>
          </div>
        )}
      </div>

      {/* Create/Edit Modal */}
      <Modal open={showModal} onClose={() => setShowModal(false)} title={editing ? 'Edit Department' : 'Create Department'} width={480}>
        <form onSubmit={handleSave}>
          <Input label="Department Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Computer Science" required id="dept-name" />
          <Input label="Department Code" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} placeholder="e.g. CS" required id="dept-code" />
          <Input label="Director ID (Optional)" value={form.director_id} onChange={(e) => setForm({ ...form, director_id: e.target.value })} placeholder="UUID of the director" id="dept-director" />
          
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 16 }}>
            <Btn variant="secondary" type="button" onClick={() => setShowModal(false)}>Cancel</Btn>
            <Btn type="submit" loading={saving} style={{ background: '#4f46e5', border: 'none' }}>{editing ? 'Save Changes' : 'Create Department'}</Btn>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation */}
      <Modal open={!!confirmDelete} onClose={() => setConfirmDelete(null)} title="Delete Department" width={400}>
        <p style={{ marginBottom: 20, color: 'var(--text-light)', fontSize: 14, lineHeight: 1.5 }}>
          Are you sure you want to permanently delete the <strong>{confirmDelete?.name}</strong> department? This action cannot be undone and may affect associated employee records.
        </p>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
          <Btn variant="secondary" type="button" onClick={() => setConfirmDelete(null)}>Cancel</Btn>
          <Btn variant="danger" type="button" onClick={() => handleDelete(confirmDelete.id)}>Delete Department</Btn>
        </div>
      </Modal>
    </div>
  );
}
