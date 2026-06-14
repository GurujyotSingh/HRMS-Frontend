import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useParams, Link } from 'react-router-dom';
import { publicCareersAPI } from '../services/api';
import { toast } from '../components/ui';
import { Building2, MapPin, Clock, Calendar, ArrowLeft, Paperclip, CheckCircle } from 'lucide-react';

export default function JobApply() {
  const { id } = useParams();
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    notes: '',
  });
  const [resumeFile, setResumeFile] = useState(null);
  const [submitted, setSubmitted] = useState(false);

  const { data: job, isLoading, error } = useQuery({
    queryKey: ['publicJob', id],
    queryFn: () => publicCareersAPI.getJob(id)
  });

  const mutation = useMutation({
    mutationFn: (data) => publicCareersAPI.apply(id, data),
    onSuccess: () => {
      setSubmitted(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    },
    onError: () => {
      toast('Failed to submit application. Please try again.', 'error');
    }
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!resumeFile) {
      toast('Please upload your resume.', 'error');
      return;
    }
    
    const data = new FormData();
    data.append('name', formData.name);
    data.append('email', formData.email);
    if (formData.phone) data.append('phone', formData.phone);
    if (formData.notes) data.append('notes', formData.notes);
    data.append('resume', resumeFile);
    
    mutation.mutate(data);
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setResumeFile(e.target.files[0]);
    }
  };

  if (isLoading) {
    return (
      <div className="job-apply-container" style={{ opacity: 0.5 }}>
        <h2>Loading Job Details...</h2>
      </div>
    );
  }

  if (error || !job) {
    return (
      <div className="careers-empty" style={{ maxWidth: '800px', margin: '4rem auto' }}>
        <h2>Job Not Found</h2>
        <p>This position may have been closed or doesn't exist.</p>
        <Link to="/careers" className="back-link">
          <ArrowLeft size={16} /> Back to Openings
        </Link>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="success-screen">
        <CheckCircle size={64} color="var(--success)" style={{ margin: '0 auto 1.5rem auto' }} />
        <h1>Application Submitted!</h1>
        <p>
          Thank you for applying for the <strong>{job.title}</strong> position. 
          Our recruitment team will review your application and get back to you soon.
        </p>
        <Link to="/careers" className="btn-back">
          <ArrowLeft size={20} />
          View Other Openings
        </Link>
      </div>
    );
  }

  return (
    <div className="job-apply-container">
      <Link to="/careers" className="back-link">
        <ArrowLeft size={16} />
        Back to Openings
      </Link>

      <div className="job-apply-grid">
        
        {/* Left Column: Job Details */}
        <div className="job-details-pane">
          <h1 className="job-details-title">
            {job.title}
          </h1>
          
          <div className="job-details-meta">
            <div className="job-meta-tag">
              <Building2 size={18} />
              {job.department_name}
            </div>
            <div className="job-meta-tag">
              <Clock size={18} />
              {job.type?.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
            </div>
            <div className="job-meta-tag">
              <Calendar size={18} />
              Closes {new Date(job.closing_date).toLocaleDateString()}
            </div>
          </div>

          <div className="job-description">
            <h3>About the Role</h3>
            <p>{job.description}</p>

            {job.requirements && job.requirements.length > 0 && (
              <>
                <h3 style={{ marginTop: '2rem' }}>Requirements</h3>
                <ul className="job-requirements">
                  {job.requirements.map((req, i) => (
                    <li key={i}>{req}</li>
                  ))}
                </ul>
              </>
            )}
          </div>
        </div>

        {/* Right Column: Application Form */}
        <div>
          <div className="job-form-pane">
            <h3>Apply Now</h3>
            
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label>Full Name <span style={{ color: 'red' }}>*</span></label>
                <input 
                  type="text" 
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  placeholder="John Doe"
                />
              </div>

              <div className="form-group">
                <label>Email Address <span style={{ color: 'red' }}>*</span></label>
                <input 
                  type="email" 
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  placeholder="john@example.com"
                />
              </div>

              <div className="form-group">
                <label>Phone Number</label>
                <input 
                  type="tel" 
                  value={formData.phone}
                  onChange={(e) => setFormData({...formData, phone: e.target.value})}
                  placeholder="+1 (555) 000-0000"
                />
              </div>

              <div className="form-group">
                <label>Resume / CV <span style={{ color: 'red' }}>*</span></label>
                <div className="file-upload-box">
                  <Paperclip size={32} />
                  <div>
                    <label htmlFor="file-upload" className="file-upload-label">
                      Upload a file
                      <input id="file-upload" type="file" style={{ display: 'none' }} onChange={handleFileChange} accept=".pdf,.doc,.docx" />
                    </label>
                  </div>
                  <p className="file-upload-text">PDF, DOC up to 5MB</p>
                  {resumeFile && (
                    <p style={{ marginTop: '0.5rem', color: 'var(--success)', fontSize: '0.875rem', fontWeight: 600 }}>
                      Selected: {resumeFile.name}
                    </p>
                  )}
                </div>
              </div>

              <div className="form-group">
                <label>Cover Letter / Notes</label>
                <textarea 
                  rows={4}
                  value={formData.notes}
                  onChange={(e) => setFormData({...formData, notes: e.target.value})}
                  placeholder="Tell us why you are a great fit..."
                />
              </div>

              <button 
                type="submit" 
                disabled={mutation.isPending}
                className="btn-submit"
              >
                {mutation.isPending ? 'Submitting...' : 'Submit Application'}
              </button>
            </form>
          </div>
        </div>

      </div>
    </div>
  );
}
