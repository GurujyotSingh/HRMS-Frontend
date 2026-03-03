import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faArrowLeft,
  faSave,
  faStar,
  faStar as faStarSolid,
  
} from '@fortawesome/free-solid-svg-icons';
import Card from '../../../components/ui/Card';
import Button from '../../../components/ui/Button';
import FormInput from '../../../components/ui/FormInput';
import { useNotification } from '../../../hooks/useNotification';
import { usePermissions } from '../../../hooks/usePermissions';

interface Rating {
  criteria: string;
  rating: number;
  weight: number;
  comments: string;
}

const ReviewForm: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { showNotification } = useNotification();
  const { hasPermission } = usePermissions();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    employee_id: '',
    reviewer_id: '1',
    review_period: 'Q2 2024',
    review_date: new Date().toISOString().split('T')[0],
    goals: '',
    achievements: '',
    areas_for_improvement: '',
    comments: '',
    status: 'InProgress' as 'Draft' | 'InProgress' | 'Completed',
  });

  const [ratings, setRatings] = useState<Rating[]>([
    { criteria: 'Teaching Quality', rating: 0, weight: 30, comments: '' },
    { criteria: 'Research Output', rating: 0, weight: 30, comments: '' },
    { criteria: 'Student Feedback', rating: 0, weight: 20, comments: '' },
    { criteria: 'Department Contribution', rating: 0, weight: 10, comments: '' },
    { criteria: 'Professional Development', rating: 0, weight: 10, comments: '' },
  ]);

  useEffect(() => {
    // Simulate API call to fetch review data if editing
    setTimeout(() => {
      if (id && id !== 'new') {
        // Mock existing review data
        setFormData({
          employee_id: '1',
          reviewer_id: '5',
          review_period: 'Q1 2024',
          review_date: '2024-03-15',
          goals: 'Complete research paper, Mentor 2 junior faculty',
          achievements: 'Published paper in top journal, Student feedback improved by 20%',
          areas_for_improvement: 'Could improve time management',
          comments: 'Excellent performance this quarter.',
          status: 'Completed',
        });
        setRatings([
          { criteria: 'Teaching Quality', rating: 4, weight: 30, comments: 'Good teaching skills' },
          { criteria: 'Research Output', rating: 5, weight: 30, comments: 'Excellent research output' },
          { criteria: 'Student Feedback', rating: 4, weight: 20, comments: 'Positive feedback' },
          { criteria: 'Department Contribution', rating: 4, weight: 10, comments: 'Active participation' },
          { criteria: 'Professional Development', rating: 4, weight: 10, comments: 'Attended workshops' },
        ]);
      }
      setLoading(false);
    }, 1000);
  }, [id]);

  const calculateOverallRating = () => {
    const totalWeight = ratings.reduce((sum, r) => sum + r.weight, 0);
    const weightedSum = ratings.reduce((sum, r) => sum + (r.rating * r.weight), 0);
    return totalWeight > 0 ? (weightedSum / totalWeight).toFixed(1) : '0.0';
  };

  const handleRatingChange = (index: number, field: keyof Rating, value: any) => {
    const updatedRatings = [...ratings];
    updatedRatings[index] = { ...updatedRatings[index], [field]: value };
    setRatings(updatedRatings);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    // Validate
    if (!formData.employee_id) {
      showNotification('Please select an employee', 'warning');
      setSaving(false);
      return;
    }

    // Simulate API call
    setTimeout(() => {
      showNotification('Review saved successfully', 'success');
      setSaving(false);
      navigate('/admin/performance');
    }, 1500);
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Loading review form...</p>
      </div>
    );
  }

  if (!hasPermission('EditPerformance') && id !== 'new') {
    return (
      <div className="unauthorized">
        <h2>Unauthorized Access</h2>
        <p>You don't have permission to edit this review.</p>
        <Button variant="primary" onClick={() => navigate('/admin/performance')}>
          Back to Reviews
        </Button>
      </div>
    );
  }

  const overallRating = calculateOverallRating();

  return (
    <div className="review-form-page">
      <div className="page-header">
        <div className="header-left">
          <Button variant="outline" onClick={() => navigate('/admin/performance')}>
            <FontAwesomeIcon icon={faArrowLeft} /> Back
          </Button>
          <h1>{id === 'new' ? 'New Performance Review' : 'Edit Performance Review'}</h1>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="form-grid">
          {/* Left Column - Main Form */}
          <div className="form-main">
            <Card className="form-card">
              <h2>Review Information</h2>

              <div className="form-row">
                <div className="form-group">
                  <label>Employee *</label>
                  <select
                    className="form-control"
                    value={formData.employee_id}
                    onChange={(e) => setFormData({ ...formData, employee_id: e.target.value })}
                    disabled={id !== 'new'}
                  >
                    <option value="">Select Employee</option>
                    <option value="1">John Doe (Computer Science)</option>
                    <option value="2">Jane Smith (Mathematics)</option>
                    <option value="3">Rahul Kumar (Physics)</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Review Period</label>
                  <select
                    className="form-control"
                    value={formData.review_period}
                    onChange={(e) => setFormData({ ...formData, review_period: e.target.value })}
                  >
                    <option value="Q1 2024">Q1 2024</option>
                    <option value="Q2 2024">Q2 2024</option>
                    <option value="Q3 2024">Q3 2024</option>
                    <option value="Q4 2024">Q4 2024</option>
                    <option value="Annual 2024">Annual 2024</option>
                  </select>
                </div>
              </div>

              <div className="form-row">
                <FormInput
                  label="Review Date"
                  type="date"
                  value={formData.review_date}
                  onChange={(e) => setFormData({ ...formData, review_date: e.target.value })}
                />

                <div className="form-group">
                  <label>Status</label>
                  <select
                    className="form-control"
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                  >
                    <option value="InProgress">In Progress</option>
                    <option value="Completed">Completed</option>
                    <option value="Draft">Draft</option>
                  </select>
                </div>
              </div>

              <div className="form-section">
                <h3>Goals</h3>
                <textarea
                  className="form-control"
                  rows={4}
                  value={formData.goals}
                  onChange={(e) => setFormData({ ...formData, goals: e.target.value })}
                  placeholder="Enter goals for this review period..."
                />
              </div>

              <div className="form-section">
                <h3>Achievements</h3>
                <textarea
                  className="form-control"
                  rows={4}
                  value={formData.achievements}
                  onChange={(e) => setFormData({ ...formData, achievements: e.target.value })}
                  placeholder="Enter achievements during this period..."
                />
              </div>

              <div className="form-section">
                <h3>Areas for Improvement</h3>
                <textarea
                  className="form-control"
                  rows={4}
                  value={formData.areas_for_improvement}
                  onChange={(e) => setFormData({ ...formData, areas_for_improvement: e.target.value })}
                  placeholder="Enter areas for improvement..."
                />
              </div>

              <div className="form-section">
                <h3>Additional Comments</h3>
                <textarea
                  className="form-control"
                  rows={4}
                  value={formData.comments}
                  onChange={(e) => setFormData({ ...formData, comments: e.target.value })}
                  placeholder="Enter any additional comments..."
                />
              </div>
            </Card>
          </div>

          {/* Right Column - Ratings */}
          <div className="form-sidebar">
            <Card className="ratings-card">
              <h2>Performance Ratings</h2>
              <div className="overall-rating">
                <span className="label">Overall Rating:</span>
                <span className="value">{overallRating} / 5</span>
              </div>

              {ratings.map((rating, index) => (
                <div key={index} className="rating-item">
                  <div className="rating-header">
                    <span className="criteria">{rating.criteria}</span>
                    <span className="weight">({rating.weight}%)</span>
                  </div>

                  <div className="star-input">
                    {[1, 2, 3, 4, 5].map(star => (
                      <FontAwesomeIcon
                        key={star}
                        icon={star <= rating.rating ? faStarSolid : faStar}
                        className={star <= rating.rating ? 'star-selected' : 'star-empty'}
                        onClick={() => handleRatingChange(index, 'rating', star)}
                      />
                    ))}
                  </div>

                  <input
                    type="text"
                    className="form-control rating-comment"
                    placeholder="Comments for this criteria"
                    value={rating.comments}
                    onChange={(e) => handleRatingChange(index, 'comments', e.target.value)}
                  />
                </div>
              ))}

              <div className="rating-summary">
                <h4>Summary</h4>
                <p>Total Weight: {ratings.reduce((sum, r) => sum + r.weight, 0)}%</p>
                <p>Weighted Score: {overallRating}</p>
              </div>
            </Card>
          </div>
        </div>

        <div className="form-actions">
          <Button type="button" variant="secondary" onClick={() => navigate('/admin/performance')}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" loading={saving}>
            <FontAwesomeIcon icon={faSave} /> Save Review
          </Button>
        </div>
      </form>
    </div>
  );
};

export default ReviewForm;