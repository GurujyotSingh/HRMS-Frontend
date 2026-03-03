import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faSave,
  faTimes,
  faPlus,
  faTrash,
  faArrowLeft,
} from '@fortawesome/free-solid-svg-icons';
import Card from '../../../components/ui/Card';
import Button from '../../../components/ui/Button';
import FormInput from '../../../components/ui/FormInput';
import { useNotification } from '../../../hooks/useNotification';
import { usePermissions } from '../../../hooks/usePermissions';
import { Employee } from '../../../types/employee';

const EditEmployee: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { showNotification } = useNotification();
  const { hasPermission } = usePermissions();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState<Partial<Employee>>({});
  const [skills, setSkills] = useState<string[]>([]);
  const [currentSkill, setCurrentSkill] = useState('');
  const [competencies, setCompetencies] = useState<string[]>([]);
  const [currentCompetency, setCurrentCompetency] = useState('');

  useEffect(() => {
    // Simulate API call to fetch employee data
    setTimeout(() => {
      setFormData({
        emp_id: Number(id),
        name: 'Dr. John Doe',
        email: 'john.doe@university.edu',
        phone: '+91 98765 43210',
        address: '123 Faculty Housing, University Campus',
        emergency_contact: 'Jane Doe: +91 98765 43211',
        department_id: 1,
        academic_rank: 'Professor',
        hire_date: '2018-08-15',
        status: 'Active',
      });
      setSkills(['Machine Learning', 'Data Science', 'Python']);
      setCompetencies(['Research', 'Teaching', 'Mentoring']);
      setLoading(false);
    }, 1000);
  }, [id]);

  const handleAddSkill = () => {
    if (currentSkill.trim() && !skills.includes(currentSkill.trim())) {
      setSkills([...skills, currentSkill.trim()]);
      setCurrentSkill('');
    }
  };

  const handleRemoveSkill = (skill: string) => {
    setSkills(skills.filter(s => s !== skill));
  };

  const handleAddCompetency = () => {
    if (currentCompetency.trim() && !competencies.includes(currentCompetency.trim())) {
      setCompetencies([...competencies, currentCompetency.trim()]);
      setCurrentCompetency('');
    }
  };

  const handleRemoveCompetency = (competency: string) => {
    setCompetencies(competencies.filter(c => c !== competency));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    // Simulate API call
    setTimeout(() => {
      showNotification('Employee updated successfully!', 'success');
      setSaving(false);
      navigate(`/admin/employees/${id}`);
    }, 1500);
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Loading employee data...</p>
      </div>
    );
  }

  return (
    <div className="edit-employee-page">
      <div className="page-header">
        <div className="header-left">
          <Button variant="outline" onClick={() => navigate(`/admin/employees/${id}`)}>
            <FontAwesomeIcon icon={faArrowLeft} /> Back
          </Button>
          <h1>Edit Employee</h1>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <Card className="form-card">
          <div className="form-section">
            <h2>Personal Information</h2>
            <div className="form-row">
              <FormInput
                label="Full Name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
              <FormInput
                label="Email Address"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
              />
            </div>

            <div className="form-row">
              <FormInput
                label="Phone Number"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                required
              />
              <FormInput
                label="Emergency Contact"
                value={formData.emergency_contact}
                onChange={(e) => setFormData({ ...formData, emergency_contact: e.target.value })}
              />
            </div>

            <FormInput
              label="Address"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
            />
          </div>

          <div className="form-section">
            <h2>Employment Details</h2>
            <div className="form-row">
              <div className="form-group">
                <label>Department</label>
                <select
                  className="form-control"
                  value={formData.department_id}
                  onChange={(e) => setFormData({ ...formData, department_id: Number(e.target.value) })}
                >
                  <option value={1}>Computer Science</option>
                  <option value={2}>Mathematics</option>
                  <option value={3}>Physics</option>
                  <option value={4}>Chemistry</option>
                </select>
              </div>

              <div className="form-group">
                <label>Academic Rank</label>
                <select
                  className="form-control"
                  value={formData.academic_rank}
                  onChange={(e) => setFormData({ ...formData, academic_rank: e.target.value })}
                >
                  <option value="Professor">Professor</option>
                  <option value="Associate Professor">Associate Professor</option>
                  <option value="Assistant Professor">Assistant Professor</option>
                  <option value="Lecturer">Lecturer</option>
                  <option value="Staff">Staff</option>
                </select>
              </div>
            </div>

            <div className="form-row">
              <FormInput
                label="Hire Date"
                type="date"
                value={formData.hire_date}
                onChange={(e) => setFormData({ ...formData, hire_date: e.target.value })}
                required
              />

              <div className="form-group">
                <label>Status</label>
                <select
                  className="form-control"
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                  <option value="OnLeave">On Leave</option>
                  <option value="Terminated">Terminated</option>
                </select>
              </div>
            </div>
          </div>

          <div className="form-section">
            <h2>Skills</h2>
            <div className="tag-input-group">
              <input
                type="text"
                className="form-control"
                value={currentSkill}
                onChange={(e) => setCurrentSkill(e.target.value)}
                placeholder="Add a skill"
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddSkill())}
              />
              <Button type="button" variant="secondary" onClick={handleAddSkill}>
                <FontAwesomeIcon icon={faPlus} /> Add
              </Button>
            </div>
            <div className="tags-list">
              {skills.map((skill, index) => (
                <span key={index} className="tag">
                  {skill}
                  <button type="button" onClick={() => handleRemoveSkill(skill)}>
                    <FontAwesomeIcon icon={faTimes} />
                  </button>
                </span>
              ))}
            </div>
          </div>

          <div className="form-section">
            <h2>Competencies</h2>
            <div className="tag-input-group">
              <input
                type="text"
                className="form-control"
                value={currentCompetency}
                onChange={(e) => setCurrentCompetency(e.target.value)}
                placeholder="Add a competency"
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddCompetency())}
              />
              <Button type="button" variant="secondary" onClick={handleAddCompetency}>
                <FontAwesomeIcon icon={faPlus} /> Add
              </Button>
            </div>
            <div className="tags-list">
              {competencies.map((comp, index) => (
                <span key={index} className="tag">
                  {comp}
                  <button type="button" onClick={() => handleRemoveCompetency(comp)}>
                    <FontAwesomeIcon icon={faTimes} />
                  </button>
                </span>
              ))}
            </div>
          </div>

          <div className="form-actions">
            <Button
              type="button"
              variant="secondary"
              onClick={() => navigate(`/admin/employees/${id}`)}
            >
              Cancel
            </Button>
            <Button type="submit" variant="primary" loading={saving}>
              <FontAwesomeIcon icon={faSave} /> Save Changes
            </Button>
          </div>
        </Card>
      </form>
    </div>
  );
};

export default EditEmployee;