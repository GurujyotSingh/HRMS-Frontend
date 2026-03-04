import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faUser,
  faEnvelope,
  faPhone,
  faMapMarkerAlt,
  faBriefcase,
  faCalendarAlt,
  faGraduationCap,
  faEdit,
  faSave,
  faTimes,
  faCamera,
  faIdCard,
  faDownload,
  faPrint,
} from '@fortawesome/free-solid-svg-icons';
import Card from '../../components/ui/Card';
import Button from '../../components/ui/Button';
// import FormInput from '../../components/ui/FormInput';
import Modal from '../../components/ui/Modal';
import { useNotification } from '../../hooks/useNotification';
import { useAuth } from '../../hooks/useAuth';
import type { Employee } from '../../types/employee';
import { formatDate } from '../../utils/formatters';

const Profile: React.FC = () => {
  const { showNotification } = useNotification();
  const { user } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [profile, setProfile] = useState<Employee | null>(null);
  const [showPhotoModal, setShowPhotoModal] = useState(false);
  const [formData, setFormData] = useState({
    phone: '',
    address: '',
    emergency_contact: '',
  });

  useEffect(() => {
    // Simulate API call
    setTimeout(() => {
      const mockProfile: Employee = {
        emp_id: 1,
        name: 'Dr. John Doe',
        email: 'john.doe@university.edu',
        department_id: 1,
        department: { dept_id: 1, name: 'Computer Science', code: 'CS', budget: 5000000 },
        manager_id: 5,
        manager: { emp_id: 5, name: 'Dr. Jane Smith' },
        academic_rank: 'Professor',
        hire_date: '2018-08-15',
        status: 'Active',
        phone: '+91 98765 43210',
        address: '123 Faculty Housing, University Campus',
        emergency_contact: 'Jane Doe: +91 98765 43211',
        skills: ['Machine Learning', 'Data Science', 'Python', 'AI'],
        competencies: ['Research', 'Teaching', 'Mentoring', 'Leadership'],
      };
      setProfile(mockProfile);
      setFormData({
        phone: mockProfile.phone || '',
        address: mockProfile.address || '',
        emergency_contact: mockProfile.emergency_contact || '',
      });
      setLoading(false);
    }, 1000);
  }, []);

  const handleSave = () => {
    // Simulate API call
    setTimeout(() => {
      showNotification('Profile updated successfully', 'success');
      setEditing(false);
    }, 1000);
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Handle photo upload
      showNotification('Photo uploaded successfully', 'success');
      setShowPhotoModal(false);
    }
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Loading profile...</p>
      </div>
    );
  }

  if (!profile) return null;

  return (
    <div className="profile-page">
      <div className="page-header">
        <div className="header-left">
          <h1>My Profile</h1>
          <p>View and manage your personal information</p>
        </div>
        <div className="header-actions">
          {!editing ? (
            <Button variant="primary" onClick={() => setEditing(true)}>
              <FontAwesomeIcon icon={faEdit} /> Edit Profile
            </Button>
          ) : (
            <>
              <Button variant="secondary" onClick={() => setEditing(false)}>
                <FontAwesomeIcon icon={faTimes} /> Cancel
              </Button>
              <Button variant="success" onClick={handleSave}>
                <FontAwesomeIcon icon={faSave} /> Save Changes
              </Button>
            </>
          )}
          <Button variant="secondary" onClick={() => window.print()}>
            <FontAwesomeIcon icon={faPrint} /> Print
          </Button>
        </div>
      </div>

      <div className="profile-grid">
        {/* Left Column - Photo & Basic Info */}
        <div className="profile-left">
          <Card className="photo-card">
            <div className="profile-photo">
              <div className="photo-placeholder">
                <FontAwesomeIcon icon={faUser} />
              </div>
              <button className="photo-edit" onClick={() => setShowPhotoModal(true)}>
                <FontAwesomeIcon icon={faCamera} />
              </button>
            </div>
            <h2>{profile.name}</h2>
            <p className="designation">{profile.academic_rank}</p>
            <p className="department">{profile.department?.name}</p>
            <div className="employee-id">
              <FontAwesomeIcon icon={faIdCard} />
              <span>Employee ID: {profile.emp_id}</span>
            </div>
          </Card>

          <Card className="stats-card" title="Quick Stats">
            <div className="stat-item">
              <span className="label">Years of Service</span>
              <span className="value">
                {new Date().getFullYear() - new Date(profile.hire_date).getFullYear()} years
              </span>
            </div>
            <div className="stat-item">
              <span className="label">Leave Balance</span>
              <span className="value">15 days</span>
            </div>
            <div className="stat-item">
              <span className="label">Attendance Rate</span>
              <span className="value">95%</span>
            </div>
            <div className="stat-item">
              <span className="label">Performance Rating</span>
              <span className="value">4.5/5</span>
            </div>
          </Card>
        </div>

        {/* Right Column - Detailed Info */}
        <div className="profile-right">
          <Card className="info-card" title="Personal Information">
            <div className="info-grid">
              <div className="info-item">
                <span className="label">Full Name</span>
                {editing ? (
                  <input
                    type="text"
                    className="form-control"
                    value={profile.name}
                    disabled
                  />
                ) : (
                  <span className="value">{profile.name}</span>
                )}
              </div>

              <div className="info-item">
                <span className="label">
                  <FontAwesomeIcon icon={faEnvelope} /> Email
                </span>
                {editing ? (
                  <input
                    type="email"
                    className="form-control"
                    value={profile.email}
                    disabled
                  />
                ) : (
                  <span className="value">{profile.email}</span>
                )}
              </div>

              <div className="info-item">
                <span className="label">
                  <FontAwesomeIcon icon={faPhone} /> Phone
                </span>
                {editing ? (
                  <input
                    type="tel"
                    className="form-control"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  />
                ) : (
                  <span className="value">{profile.phone}</span>
                )}
              </div>

              <div className="info-item full-width">
                <span className="label">
                  <FontAwesomeIcon icon={faMapMarkerAlt} /> Address
                </span>
                {editing ? (
                  <textarea
                    className="form-control"
                    rows={2}
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  />
                ) : (
                  <span className="value">{profile.address}</span>
                )}
              </div>

              <div className="info-item full-width">
                <span className="label">Emergency Contact</span>
                {editing ? (
                  <input
                    type="text"
                    className="form-control"
                    value={formData.emergency_contact}
                    onChange={(e) => setFormData({ ...formData, emergency_contact: e.target.value })}
                  />
                ) : (
                  <span className="value">{profile.emergency_contact}</span>
                )}
              </div>
            </div>
          </Card>

          <Card className="info-card" title="Employment Details">
            <div className="info-grid">
              <div className="info-item">
                <span className="label">
                  <FontAwesomeIcon icon={faBriefcase} /> Department
                </span>
                <span className="value">{profile.department?.name}</span>
              </div>

              <div className="info-item">
                <span className="label">
                  <FontAwesomeIcon icon={faGraduationCap} /> Academic Rank
                </span>
                <span className="value">{profile.academic_rank}</span>
              </div>

              <div className="info-item">
                <span className="label">
                  <FontAwesomeIcon icon={faUser} /> Reporting Manager
                </span>
                <span className="value">{profile.manager?.name || 'N/A'}</span>
              </div>

              <div className="info-item">
                <span className="label">
                  <FontAwesomeIcon icon={faCalendarAlt} /> Date of Joining
                </span>
                <span className="value">{formatDate(profile.hire_date)}</span>
              </div>

              <div className="info-item">
                <span className="label">Employment Status</span>
                <span className={`status-badge status-${profile.status.toLowerCase()}`}>
                  {profile.status}
                </span>
              </div>
            </div>
          </Card>

          <Card className="info-card" title="Skills & Competencies">
            <div className="skills-section">
              <h4>Skills</h4>
              <div className="skills-list">
                {profile.skills?.map((skill, index) => (
                  <span key={index} className="skill-tag">{skill}</span>
                ))}
              </div>
            </div>

            <div className="competencies-section">
              <h4>Competencies</h4>
              <div className="competencies-list">
                {profile.competencies?.map((comp, index) => (
                  <span key={index} className="competency-tag">{comp}</span>
                ))}
              </div>
            </div>
          </Card>

          <Card className="info-card" title="Documents">
            <div className="documents-list">
              <div className="document-item">
                <FontAwesomeIcon icon={faIdCard} />
                <span>ID Proof</span>
                <span className="status verified">Verified</span>
                <Button variant="secondary" size="small">
                  <FontAwesomeIcon icon={faDownload} /> Download
                </Button>
              </div>
              <div className="document-item">
                <FontAwesomeIcon icon={faGraduationCap} />
                <span>Educational Certificates</span>
                <span className="status pending">Pending</span>
                <Button variant="secondary" size="small">
                  Upload
                </Button>
              </div>
              <div className="document-item">
                <FontAwesomeIcon icon={faFileInvoice} />
                <span>Employment Contract</span>
                <span className="status verified">Verified</span>
                <Button variant="secondary" size="small">
                  <FontAwesomeIcon icon={faDownload} /> Download
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Photo Upload Modal */}
      <Modal
        isOpen={showPhotoModal}
        onClose={() => setShowPhotoModal(false)}
        title="Update Profile Photo"
        size="small"
      >
        <div className="photo-upload-modal">
          <div className="current-photo">
            <div className="photo-preview">
              <FontAwesomeIcon icon={faUser} />
            </div>
          </div>

          <div className="upload-options">
            <input
              type="file"
              id="photo-upload"
              accept="image/*"
              onChange={handlePhotoUpload}
              style={{ display: 'none' }}
            />
            <label htmlFor="photo-upload" className="btn btn-primary">
              <FontAwesomeIcon icon={faCamera} /> Choose Photo
            </label>
            <p className="hint">
              Supported formats: JPG, PNG, GIF. Max size: 5MB
            </p>
          </div>

          <div className="modal-footer">
            <Button variant="secondary" onClick={() => setShowPhotoModal(false)}>
              Cancel
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default Profile;