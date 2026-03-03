import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faStar,
  faStar as faStarSolid,
  faPaperPlane,
} from '@fortawesome/free-solid-svg-icons';
import Card from '../../../components/ui/Card';
import Button from '../../../components/ui/Button';
import FormInput from '../../../components/ui/FormInput';
import { useNotification } from '../../../hooks/useNotification';
import { useAuth } from '../../../hooks/useAuth';

const Feedback: React.FC = () => {
  const navigate = useNavigate();
  const { showNotification } = useNotification();
  const { user } = useAuth();

  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    feedbackType: 'peer',
    recipientId: '',
    recipientName: '',
    relationship: '',
    project: '',
    ratings: {
      collaboration: 0,
      communication: 0,
      reliability: 0,
      quality: 0,
      initiative: 0,
    },
    strengths: '',
    improvements: '',
    comments: '',
    isConfidential: false,
  });

  const [hoverRating, setHoverRating] = useState<{ [key: string]: number }>({});

  const ratingCategories = [
    { id: 'collaboration', label: 'Collaboration & Teamwork' },
    { id: 'communication', label: 'Communication Skills' },
    { id: 'reliability', label: 'Reliability & Dependability' },
    { id: 'quality', label: 'Quality of Work' },
    { id: 'initiative', label: 'Initiative & Proactivity' },
  ];

  const handleRatingHover = (category: string, rating: number) => {
    setHoverRating({ ...hoverRating, [category]: rating });
  };

  const handleRatingLeave = (category: string) => {
    setHoverRating({ ...hoverRating, [category]: 0 });
  };

  const handleRatingClick = (category: string, rating: number) => {
    setFormData({
      ...formData,
      ratings: { ...formData.ratings, [category]: rating },
    });
  };

  const renderStars = (category: string, currentRating: number) => {
    const stars = [];
    const displayRating = hoverRating[category] || currentRating;

    for (let i = 1; i <= 5; i++) {
      stars.push(
        <FontAwesomeIcon
          key={i}
          icon={i <= displayRating ? faStarSolid : faStar}
          className={`star-icon ${i <= displayRating ? 'filled' : ''}`}
          onMouseEnter={() => handleRatingHover(category, i)}
          onMouseLeave={() => handleRatingLeave(category)}
          onClick={() => handleRatingClick(category, i)}
        />
      );
    }
    return stars;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validate
    if (!formData.recipientName) {
      showNotification('Please select a recipient', 'warning');
      return;
    }

    const hasRatings = Object.values(formData.ratings).some(r => r > 0);
    if (!hasRatings) {
      showNotification('Please provide ratings', 'warning');
      return;
    }

    setLoading(true);

    // Simulate API call
    setTimeout(() => {
      showNotification('Feedback submitted successfully!', 'success');
      setLoading(false);
      navigate('/user/performance');
    }, 1500);
  };

  return (
    <div className="feedback-page">
      <div className="page-header">
        <h1>Provide Feedback</h1>
        <p>Share your feedback about a colleague or team member</p>
      </div>

      <form onSubmit={handleSubmit}>
        <Card className="feedback-form-card">
          {/* Feedback Type */}
          <div className="form-section">
            <h3>Feedback Type</h3>
            <div className="radio-group">
              <label className="radio-label">
                <input
                  type="radio"
                  name="feedbackType"
                  value="peer"
                  checked={formData.feedbackType === 'peer'}
                  onChange={(e) => setFormData({ ...formData, feedbackType: e.target.value })}
                />
                <span>Peer Feedback</span>
              </label>
              <label className="radio-label">
                <input
                  type="radio"
                  name="feedbackType"
                  value="subordinate"
                  checked={formData.feedbackType === 'subordinate'}
                  onChange={(e) => setFormData({ ...formData, feedbackType: e.target.value })}
                />
                <span>Subordinate Feedback</span>
              </label>
              <label className="radio-label">
                <input
                  type="radio"
                  name="feedbackType"
                  value="supervisor"
                  checked={formData.feedbackType === 'supervisor'}
                  onChange={(e) => setFormData({ ...formData, feedbackType: e.target.value })}
                />
                <span>Supervisor Feedback</span>
              </label>
            </div>
          </div>

          {/* Recipient Information */}
          <div className="form-section">
            <h3>Recipient Information</h3>
            <div className="form-row">
              <FormInput
                label="Recipient Name *"
                value={formData.recipientName}
                onChange={(e) => setFormData({ ...formData, recipientName: e.target.value })}
                placeholder="Enter colleague's name"
                required
              />
              <FormInput
                label="Relationship"
                value={formData.relationship}
                onChange={(e) => setFormData({ ...formData, relationship: e.target.value })}
                placeholder="e.g., Team Member, Project Lead"
              />
            </div>
            <FormInput
              label="Project/Context"
              value={formData.project}
              onChange={(e) => setFormData({ ...formData, project: e.target.value })}
              placeholder="What project or context is this feedback for?"
            />
          </div>

          {/* Ratings */}
          <div className="form-section">
            <h3>Ratings</h3>
            <div className="ratings-container">
              {ratingCategories.map(category => (
                <div key={category.id} className="rating-row">
                  <span className="category-label">{category.label}</span>
                  <div className="stars-container">
                    {renderStars(category.id, formData.ratings[category.id as keyof typeof formData.ratings])}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Written Feedback */}
          <div className="form-section">
            <h3>Written Feedback</h3>
            <div className="form-group">
              <label>Strengths</label>
              <textarea
                className="form-control"
                rows={3}
                value={formData.strengths}
                onChange={(e) => setFormData({ ...formData, strengths: e.target.value })}
                placeholder="What are this person's key strengths?"
              />
            </div>

            <div className="form-group">
              <label>Areas for Improvement</label>
              <textarea
                className="form-control"
                rows={3}
                value={formData.improvements}
                onChange={(e) => setFormData({ ...formData, improvements: e.target.value })}
                placeholder="What areas could they improve in?"
              />
            </div>

            <div className="form-group">
              <label>Additional Comments</label>
              <textarea
                className="form-control"
                rows={3}
                value={formData.comments}
                onChange={(e) => setFormData({ ...formData, comments: e.target.value })}
                placeholder="Any other comments or observations?"
              />
            </div>
          </div>

          {/* Confidentiality */}
          <div className="form-section">
            <label className="checkbox-label">
              <input
                type="checkbox"
                checked={formData.isConfidential}
                onChange={(e) => setFormData({ ...formData, isConfidential: e.target.checked })}
              />
              <span>Make this feedback confidential (recipient won't see your name)</span>
            </label>
          </div>

          {/* Guidelines */}
          <div className="feedback-guidelines">
            <h4>Feedback Guidelines:</h4>
            <ul>
              <li>Be specific and provide examples when possible</li>
              <li>Focus on behavior and actions, not personality</li>
              <li>Balance positive feedback with constructive suggestions</li>
              <li>Keep feedback professional and respectful</li>
            </ul>
          </div>

          {/* Form Actions */}
          <div className="form-actions">
            <Button type="button" variant="secondary" onClick={() => navigate('/user/performance')}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" loading={loading}>
              <FontAwesomeIcon icon={faPaperPlane} /> Submit Feedback
            </Button>
          </div>
        </Card>
      </form>
    </div>
  );
};

export default Feedback;