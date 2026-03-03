import React, { useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faStar,
  faStar as faStarSolid,

  faUsers,
  faTrophy,
  faArrowUp,
  faArrowDown,
} from '@fortawesome/free-solid-svg-icons';
import Card from '../../../components/ui/Card';
import Chart from '../../../components/ui/Chart';
import { formatNumber } from '../../../utils/formatters';

interface DepartmentRating {
  department: string;
  averageRating: number;
  employees: number;
  trend: 'up' | 'down' | 'stable';
}

interface TopPerformer {
  name: string;
  department: string;
  rating: number;
  achievements: string;
}

const Ratings: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [departmentRatings, setDepartmentRatings] = useState<DepartmentRating[]>([]);
  const [topPerformers, setTopPerformers] = useState<TopPerformer[]>([]);
  const [ratingDistribution, setRatingDistribution] = useState<any[]>([]);

  useEffect(() => {
    // Simulate API call
    setTimeout(() => {
      setDepartmentRatings([
        { department: 'Computer Science', averageRating: 4.5, employees: 156, trend: 'up' },
        { department: 'Mathematics', averageRating: 4.2, employees: 98, trend: 'up' },
        { department: 'Physics', averageRating: 4.0, employees: 87, trend: 'stable' },
        { department: 'Chemistry', averageRating: 4.1, employees: 76, trend: 'down' },
        { department: 'Biology', averageRating: 4.3, employees: 82, trend: 'up' },
        { department: 'Administration', averageRating: 3.9, employees: 245, trend: 'stable' },
      ]);

      setTopPerformers([
        {
          name: 'Dr. John Doe',
          department: 'Computer Science',
          rating: 4.9,
          achievements: 'Published 3 papers, Secured grant',
        },
        {
          name: 'Dr. Priya Sharma',
          department: 'Chemistry',
          rating: 4.8,
          achievements: 'Best researcher award, 2 patents',
        },
        {
          name: 'Dr. Jane Smith',
          department: 'Mathematics',
          rating: 4.7,
          achievements: 'Student feedback 98%, New course development',
        },
      ]);

      setRatingDistribution([
        { range: '4.5-5.0', count: 45 },
        { range: '4.0-4.4', count: 78 },
        { range: '3.5-3.9', count: 56 },
        { range: '3.0-3.4', count: 34 },
        { range: 'Below 3.0', count: 12 },
      ]);

      setLoading(false);
    }, 1000);
  }, []);

  if (loading) {
    return (
      <div className="loading-container">
        <div className="spinner"></div>
        <p>Loading ratings data...</p>
      </div>
    );
  }

  const averageRating = (
    departmentRatings.reduce((sum, dept) => sum + dept.averageRating, 0) / departmentRatings.length
  ).toFixed(1);

  return (
    <div className="ratings-page">
      <div className="page-header">
        <div className="header-left">
          <h1>Performance Ratings</h1>
          <p>Overview of performance ratings across departments</p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="summary-cards">
        <Card className="summary-card">
          <div className="card-icon gold">
            <FontAwesomeIcon icon={faTrophy} />
          </div>
          <div className="card-content">
            <h3>Average Rating</h3>
            <p className="value">{averageRating}</p>
            <small>out of 5.0</small>
          </div>
        </Card>

        <Card className="summary-card">
          <div className="card-icon blue">
            <FontAwesomeIcon icon={faUsers} />
          </div>
          <div className="card-content">
            <h3>Total Rated</h3>
            <p className="value">{departmentRatings.reduce((sum, dept) => sum + dept.employees, 0)}</p>
            <small>employees</small>
          </div>
        </Card>

        <Card className="summary-card">
          <div className="card-icon green">
            <FontAwesomeIcon icon={faStarSolid} />
          </div>
          <div className="card-content">
            <h3>Top Performers</h3>
            <p className="value">{topPerformers.length}</p>
            <small>4.5+ rating</small>
          </div>
        </Card>
      </div>

      {/* Charts Grid */}
      <div className="charts-grid">
        <Card className="chart-card" title="Department-wise Average Ratings">
          <Chart
            type="bar"
            data={departmentRatings}
            xAxisKey="department"
            dataKeys={['averageRating']}
            colors={['#4361ee']}
            height={300}
          />
        </Card>

        <Card className="chart-card" title="Rating Distribution">
          <Chart
            type="pie"
            data={ratingDistribution}
            dataKeys={['count']}
            colors={['#4361ee', '#f72585', '#4cc9f0', '#f8961e', '#7209b7']}
            height={300}
          />
        </Card>
      </div>

      {/* Department Ratings Table */}
      <Card className="table-card" title="Department Performance">
        <table className="ratings-table">
          <thead>
            <tr>
              <th>Department</th>
              <th>Average Rating</th>
              <th>Employees Rated</th>
              <th>Trend</th>
            </tr>
          </thead>
          <tbody>
            {departmentRatings.map((dept, index) => (
              <tr key={index}>
                <td>{dept.department}</td>
                <td>
                  <div className="rating-cell">
                    <span className="rating-value">{dept.averageRating}</span>
                    <div className="stars">
                      {[1, 2, 3, 4, 5].map(star => (
                        <FontAwesomeIcon
                          key={star}
                          icon={star <= dept.averageRating ? faStarSolid : faStar}
                          className={star <= dept.averageRating ? 'star-filled' : 'star-empty'}
                        />
                      ))}
                    </div>
                  </div>
                </td>
                <td>{dept.employees}</td>
                <td>
                  <span className={`trend ${dept.trend}`}>
                    <FontAwesomeIcon icon={dept.trend === 'up' ? faArrowUp : dept.trend === 'down' ? faArrowDown : null} />
                    {dept.trend === 'up' ? ' Improving' : dept.trend === 'down' ? ' Declining' : ' Stable'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </Card>

      {/* Top Performers */}
      <Card className="performers-card" title="Top Performers">
        <div className="performers-grid">
          {topPerformers.map((performer, index) => (
            <div key={index} className="performer-card">
              <div className="performer-rank">{index + 1}</div>
              <div className="performer-info">
                <h4>{performer.name}</h4>
                <p>{performer.department}</p>
                <div className="performer-rating">
                  {[1, 2, 3, 4, 5].map(star => (
                    <FontAwesomeIcon
                      key={star}
                      icon={star <= performer.rating ? faStarSolid : faStar}
                      className="star-filled"
                    />
                  ))}
                  <span>{performer.rating}</span>
                </div>
                <p className="performer-achievements">{performer.achievements}</p>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
};

export default Ratings;