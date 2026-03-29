import React, { useCallback, useEffect, useState } from 'react';
import { Building2 } from 'lucide-react';
import { deptAPI } from '../services/api';
import { Btn, Card, Input, Modal, PageHeader, toast } from '../components/ui';

export default function Departments() {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await deptAPI.list();
      setList(data);
    } catch (e) {
      toast(e.response?.data?.detail || 'Failed to load departments', 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const save = async () => {
    try {
      await deptAPI.create({ name, description: description || null });
      toast('Department created', 'success');
      setOpen(false);
      setName('');
      setDescription('');
      load();
    } catch (e) {
      toast(e.response?.data?.detail || 'Failed to create', 'error');
    }
  };

  if (loading) {
    return (
      <div>
        <PageHeader title="Departments" />
        <p style={{ color: 'var(--text-muted)' }}>Loading…</p>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        title="Departments"
        subtitle="University organisational units"
        actions={<Btn onClick={() => setOpen(true)}>+ New Department</Btn>}
      />
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
          gap: 20,
        }}
      >
        {list.map((d) => (
          <Card key={d.id}>
            <div style={{ display: 'flex', gap: 14, marginBottom: 12 }}>
              <div
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: 'var(--radius)',
                  background: 'var(--accent-light)',
                  color: 'var(--accent)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Building2 size={24} />
              </div>
              <div style={{ flex: 1 }}>
                <h3 style={{ fontFamily: 'var(--font-display)', fontSize: 20, marginBottom: 6 }}>
                  {d.name}
                </h3>
                <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: 14, lineHeight: 1.5 }}>
                  {d.description || 'No description'}
                </p>
              </div>
            </div>
            <p style={{ fontSize: 12, color: 'var(--text-muted)' }}>
              API supports create & list only — edit/delete requires backend routes.
            </p>
          </Card>
        ))}
      </div>

      <Modal open={open} onClose={() => setOpen(false)} title="New department">
        <Input label="Name" value={name} onChange={(e) => setName(e.target.value)} />
        <label style={{ display: 'block', marginBottom: 12 }}>
          <span
            style={{
              display: 'block',
              fontSize: 13,
              fontWeight: 600,
              color: 'var(--text-secondary)',
              marginBottom: 6,
            }}
          >
            Description
          </span>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            style={{
              width: '100%',
              padding: '10px 12px',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border)',
              fontFamily: 'var(--font-body)',
              fontSize: 14,
              resize: 'vertical',
            }}
          />
        </label>
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 10 }}>
          <Btn variant="secondary" onClick={() => setOpen(false)}>
            Cancel
          </Btn>
          <Btn onClick={save}>Create</Btn>
        </div>
      </Modal>
    </div>
  );
}
