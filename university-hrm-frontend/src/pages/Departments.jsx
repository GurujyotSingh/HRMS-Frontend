import React, { useEffect, useState } from 'react';
import { deptAPI } from '../services/api';
import { PageHeader, Card, Btn, Modal, Input, Textarea, Spinner, toast } from '../components/ui';
import { Plus, Edit2, Trash2, Building2 } from 'lucide-react';

export default function Departments() {
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: '', description: '' });
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
    setForm({ name: '', description: '' });
    setShowModal(true);
  };

  const openEdit = (dept) => {
    setEditing(dept);
    setForm({ name: dept.name, description: dept.description || '' });
    setShowModal(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      if (editing) {
        await deptAPI.update(editing.id, form);
        toast('Department updated', 'success');
      } else {
        await deptAPI.create(form);
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
      <div style={{ display: 'flex', justifyContent: 'center', padding: 80 }}>
        <Spinner size={32} />
      </div>
    );
  }

  return (
    <>
      <PageHeader
        title="Departments"
        subtitle="Manage organizational departments"
        actions={<Btn onClick={openCreate}><Plus size={16} /> Add Department</Btn>}
      />

      <div className="grid-3">
        {departments.map((dept) => (
          <Card key={dept.id} hover style={{ cursor: 'default' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, marginBottom: 14 }}>
              <div style={{ width: 44, height: 44, borderRadius: '10px', background: 'rgba(30, 23, 96, 0.1)', color: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Building2 size={22} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <h3 style={{ fontSize: 16, marginBottom: 4 }}>{dept.name}</h3>
                <p style={{ fontSize: 13, color: 'var(--gray-500)', margin: 0, lineHeight: 1.5 }}>{dept.description || 'No description provided'}</p>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8, paddingTop: 12, borderTop: '1px solid var(--gray-200)' }}>
              <Btn variant="secondary" size="xs" onClick={() => openEdit(dept)}><Edit2 size={13} /> Edit</Btn>
              <Btn variant="ghost" size="xs" onClick={() => setConfirmDelete(dept)} style={{ color: 'var(--danger)' }}><Trash2 size={13} /> Delete</Btn>
            </div>
          </Card>
        ))}
        {departments.length === 0 && (
          <Card style={{ gridColumn: '1 / -1', textAlign: 'center', padding: 48 }}>
            <div style={{ fontSize: 40, marginBottom: 12, opacity: 0.4 }}>🏛</div>
            <p style={{ color: 'var(--gray-500)' }}>No departments yet. Create one to get started.</p>
          </Card>
        )}
      </div>

      {/* Create/Edit Modal */}
      <Modal open={showModal} onClose={() => setShowModal(false)} title={editing ? 'Edit Department' : 'Create Department'}>
        <form onSubmit={handleSave}>
          <Input label="Department Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="e.g. Computer Science" required id="dept-name" />
          <Textarea label="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Brief description of the department" id="dept-description" />
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 8 }}>
            <Btn variant="secondary" type="button" onClick={() => setShowModal(false)}>Cancel</Btn>
            <Btn type="submit" loading={saving}>{editing ? 'Update' : 'Create'}</Btn>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation */}
      <Modal open={!!confirmDelete} onClose={() => setConfirmDelete(null)} title="Delete Department" width={400}>
        <p style={{ marginBottom: 20, color: 'var(--text-light)', fontSize: 14 }}>Are you sure you want to delete <strong>{confirmDelete?.name}</strong>? This action cannot be undone.</p>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
          <Btn variant="secondary" type="button" onClick={() => setConfirmDelete(null)}>Cancel</Btn>
          <Btn variant="danger" type="button" onClick={() => handleDelete(confirmDelete.id)}>Delete</Btn>
        </div>
      </Modal>
    </>
  );
}
