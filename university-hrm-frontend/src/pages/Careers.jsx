import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { publicCareersAPI } from '../services/api';
import { Briefcase, MapPin, Clock, Building2, Search } from 'lucide-react';

export default function Careers() {
  const { data: rawJobs, isLoading, error } = useQuery({
    queryKey: ['publicJobs'],
    queryFn: publicCareersAPI.getJobs
  });
  
  const jobs = Array.isArray(rawJobs) ? rawJobs : (rawJobs?.data?.items || rawJobs?.items || rawJobs?.data || []);



  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center">
        <div className="bg-red-50 text-red-600 p-4 rounded-xl border border-red-100">
          Failed to load job postings. Please try again later.
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Hero Section */}
      <div className="careers-hero">
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          <h1>
            Join Our Academic Community
          </h1>
          <p>
            Discover opportunities to make an impact, innovate, and grow your career with us.
          </p>
          <div className="careers-search">
            <Search className="careers-search-icon" size={24} />
            <input
              type="text"
              placeholder="Search for roles (e.g., 'Professor', 'IT Support')"
            />
          </div>
        </div>
      </div>

      {/* Jobs Listing */}
      <div className="careers-content">
        <div className="careers-header">
          <h2>Open Positions</h2>
          <span className="careers-badge">
            {jobs?.length || 0} Openings
          </span>
        </div>

        {isLoading ? (
          <div>
            {[1, 2, 3].map((i) => (
              <div key={i} className="job-card" style={{ opacity: 0.5 }}>
                Loading...
              </div>
            ))}
          </div>
        ) : !Array.isArray(jobs) || jobs.length === 0 ? (
          <div className="careers-empty">
            <Briefcase size={48} />
            <h3>No open positions</h3>
            <p>There are currently no job openings. Please check back later.</p>
          </div>
        ) : (
          <div>
            {jobs?.map((job) => (
              <Link 
                key={job.id} 
                to={`/careers/${job.id}`}
                className="job-card"
              >
                <div className="job-card-info">
                  <h3>
                    {job.title}
                  </h3>
                  <div className="job-meta">
                    <div className="job-meta-item">
                      <Building2 size={16} />
                      {job.department_name}
                    </div>
                    <div className="job-meta-item">
                      <Clock size={16} />
                      {job.type.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </div>
                    <div className="job-meta-item">
                      <MapPin size={16} />
                      On-site
                    </div>
                  </div>
                </div>
                
                <div className="job-card-action">
                  <div className="btn-view">
                    View Details
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
