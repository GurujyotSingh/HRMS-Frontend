// src/pages/admin/Employees/AddEmployee.tsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faSave,
  faTimes,
  faPlus,
  faTrash,
  faUpload,
  faUser,
  faEnvelope,
  faPhone,
  faMapMarkerAlt,
  faBriefcase,
  faCalendarAlt,
  faGraduationCap,
  faIdCard,
} from '@fortawesome/free-solid-svg-icons';
import Card from '../../../components/ui/Card';
import Button from '../../../components/ui/Button';
import { useNotification } from '../../../hooks/useNotification';
import { usePermissions } from '../../../hooks/usePermissions';
import { Employee } from '../../../types/employee';

const AddEmployee: React.FC = () => {
  const navigate = useNavigate();
  const { showNotification } = useNotification();
  const { hasPermission } = usePermissions();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    emergency_contact: '',
    department_id: '',
    manager_id: '',
    academic_rank: 'Lecturer',
    hire_date: '',
    status: 'Active',
    skills: [] as string[],
    competencies: [] as string[],
  });
  const [currentSkill, setCurrentSkill] = useState('');
  const [currentCompetency, setCurrentCompetency] = useState('');

  const departments = [
    { id: 1, name: 'Computer Science' },
    { id: 2, name: 'Mathematics' },
    { id: 3, name: 'Physics' },
    { id: 4, name: 'Chemistry' },
    { id: 5, name: 'Biology' },
    { id: 6, name: 'Administration' },
  ];

  const managers = [
    { id: 5, name: 'Dr. Amit Patel' },
    { id: 6, name: 'Dr. Neha Gupta' },
    { id: 7, name: 'Dr. Rajesh Kumar' },
  ];

  const academicRanks = [
    'Professor',
    'Associate Professor',
    'Assistant Professor',
    'Lecturer',
    'Staff',
  ];

  const handleAddSkill = () => {
    if (currentSkill.trim() && !formData.skills.includes(currentSkill.trim())) {
      setFormData({
        ...formData,
        skills: [...formData.skills, currentSkill.trim()]
      });
      setCurrentSkill('');
    }
  };

  const handleRemoveSkill = (skill: string) => {
    setFormData({
      ...formData,
      skills: formData.skills.filter(s => s !== skill)
    });
  };

  const handleAddCompetency = () => {
    if (currentCompetency.trim() && !formData.competencies.includes(currentCompetency.trim())) {
      setFormData({
        ...formData,
        competencies: [...formData.competencies, currentCompetency.trim()]
      });
      setCurrentCompetency('');
    }
  };

  const handleRemoveCompetency = (competency: string) => {
    setFormData({
      ...formData,
      competencies: formData.competencies.filter(c => c !== competency)
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // Validate required fields
    if (!formData.name || !formData.email || !formData.phone || !formData.department_id) {
      showNotification('Please fill in all required fields', 'error');
      setLoading(false);
      return;
    }

    // Simulate API call
    setTimeout(() => {
      showNotification('Employee added successfully!', 'success');
      setLoading(false);
      navigate('/admin/employees');
    }, 1500);
  };

  return (
    <div className="employee-form-page">
      <div className="form-header">
        <h1>Add New Employee</h1>
        <p>Enter the details of the new faculty/staff member</p>
      </div>

      <form onSubmit={handleSubmit}>
        <Card className="form-card">
          {/* Personal Information */}
          <div className="form-section">
            <h2>
              <FontAwesomeIcon icon={faUser} />
              Personal Information
            </h2>
            <div className="form-row">
              <div className="form-group">
                <label>Full Name *</label>
                <div className="input-with-icon">
                  <FontAwesomeIcon icon={faUser} className="input-icon" />
                  <input
                    type="text"
                    className="form-control"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Enter full name"
                    required
                  />
                </div>
              </div>
              <div className="form-group">
                <label>Email Address *</label>
                <div className="input-with-icon">
                  <FontAwesomeIcon icon={faEnvelope} className="input-icon" />
                  <input
                    type="email"
                    className="form-control"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="name@university.edu"
                    required
                  />
                </div>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Phone Number *</label>
                <div className="input-with-icon">
                  <FontAwesomeIcon icon={faPhone} className="input-icon" />
                  <input
                    type="tel"
                    className="form-control"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+91 98765 43210"
                    required
                  />
                </div>
              </div>
              <div className="form-group">
                <label>Emergency Contact</label>
                <input
                  type="text"
                  className="form-control"
                  value={formData.emergency_contact}
                  onChange={(e) => setFormData({ ...formData, emergency_contact: e.target.value })}
                  placeholder="Name: Phone"
                />
              </div>
            </div>

            <div className="form-group">
              <label>Address</label>
              <div className="input-with-icon">
                <FontAwesomeIcon icon={faMapMarkerAlt} className="input-icon" />
                <input
                  type="text"
                  className="form-control"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="Residential address"
                />
              </div>
            </div>
          </div>

          {/* Employment Details */}
          <div className="form-section">
            <h2>
              <FontAwesomeIcon icon={faBriefcase} />
              Employment Details
            </h2>
            <div className="form-row">
              <div className="form-group">
                <label>Department *</label>
                <select
                  className="form-control"
                  value={formData.department_id}
                  onChange={(e) => setFormData({ ...formData, department_id: e.target.value })}
                  required
                >
                  <option value="">Select Department</option>
                  {departments.map(dept => (
                    <option key={dept.id} value={dept.id}>{dept.name}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Academic Rank *</label>
                <select
                  className="form-control"
                  value={formData.academic_rank}
                  onChange={(e) => setFormData({ ...formData, academic_rank: e.target.value })}
                  required
                >
                  {academicRanks.map(rank => (
                    <option key={rank} value={rank}>{rank}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Hire Date *</label>
                <div className="input-with-icon">
                  <FontAwesomeIcon icon={faCalendarAlt} className="input-icon" />
                  <input
                    type="date"
                    className="form-control"
                    value={formData.hire_date}
                    onChange={(e) => setFormData({ ...formData, hire_date: e.target.value })}
                    required
                  />
                </div>
              </div>
              <div className="form-group">
                <label>Reporting Manager</label>
                <select
                  className="form-control"
                  value={formData.manager_id}
                  onChange={(e) => setFormData({ ...formData, manager_id: e.target.value })}
                >
                  <option value="">Select Manager</option>
                  {managers.map(mgr => (
                    <option key={mgr.id} value={mgr.id}>{mgr.name}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form-group">
              <label>Employment Status</label>
              <select
                className="form-control"
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              >
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
                <option value="OnLeave">On Leave</option>
                <option value="Terminated">Terminated</option>
              </select>
            </div>
          </div>

          {/* Skills */}
          <div className="form-section">
            <h2>
              <FontAwesomeIcon icon={faGraduationCap} />
              Skills & Competencies
            </h2>
            <div className="form-group">
              <label>Skills</label>
              <div className="tag-input-group">
                <input
                  type="text"
                  className="form-control"
                  value={currentSkill}
                  onChange={(e) => setCurrentSkill(e.target.value)}
                  placeholder="Enter a skill (e.g., Machine Learning)"
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddSkill())}
                />
                <Button type="button" variant="secondary" onClick={handleAddSkill}>
                  <FontAwesomeIcon icon={faPlus} /> Add
                </Button>
              </div>
              <div className="tags-list">
                {formData.skills.map((skill, index) => (
                  <span key={index} className="tag">
                    {skill}
                    <button type="button" onClick={() => handleRemoveSkill(skill)}>
                      <FontAwesomeIcon icon={faTimes} />
                    </button>
                  </span>
                ))}
              </div>
            </div>

            <div className="form-group">
              <label>Competencies</label>
              <div className="tag-input-group">
                <input
                  type="text"
                  className="form-control"
                  value={currentCompetency}
                  onChange={(e) => setCurrentCompetency(e.target.value)}
                  placeholder="Enter a competency (e.g., Leadership)"
                  onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddCompetency())}
                />
                <Button type="button" variant="secondary" onClick={handleAddCompetency}>
                  <FontAwesomeIcon icon={faPlus} /> Add
                </Button>
              </div>
              <div className="tags-list">
                {formData.competencies.map((comp, index) => (
                  <span key={index} className="tag">
                    {comp}
                    <button type="button" onClick={() => handleRemoveCompetency(comp)}>
                      <FontAwesomeIcon icon={faTimes} />
                    </button>
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Documents */}
          <div className="form-section">
            <h2>
              <FontAwesomeIcon icon={faIdCard} />
              Documents
            </h2>
            <div className="upload-area">
              <FontAwesomeIcon icon={faUpload} className="upload-icon" />
              <p>Drag and drop files here or click to upload</p>
              <small>Supported formats: PDF, JPG, PNG (Max size: 5MB)</small>
              <input type="file" multiple className="file-input" />
            </div>
          </div>

          {/* Form Actions */}
          <div className="form-actions">
            <Button type="button" variant="secondary" onClick={() => navigate('/admin/employees')}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" loading={loading}>
              <FontAwesomeIcon icon={faSave} /> Save Employee
            </Button>
          </div>
        </Card>
      </form>
    </div>
  );
};

export default AddEmployee;