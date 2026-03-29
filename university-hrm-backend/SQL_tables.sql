select current_user;
ALTER USER postgres WITH PASSWORD 'Divyansh113';

INSERT INTO roles (name) VALUES ('admin'), ('hr'), ('department_head'), ('employee'), ('guest')
ON CONFLICT DO NOTHING;

select * from users;
INSERT INTO roles (name) VALUES 
('admin'), 
('hr'), 
('department_head'), 
('employee'), 
('guest')
ON CONFLICT (name) DO NOTHING;

-- Leave Policies table
CREATE TABLE IF NOT EXISTS leave_policies (
    id SERIAL PRIMARY KEY,
    role_name VARCHAR(50) NOT NULL,
    leave_type VARCHAR(20) NOT NULL,
    default_days INTEGER NOT NULL,
    CONSTRAINT uq_policy_role_leavetype UNIQUE (role_name, leave_type)
);

-- Leave Balances table
CREATE TABLE IF NOT EXISTS leave_balances (
    id SERIAL PRIMARY KEY,
    employee_id INTEGER NOT NULL REFERENCES employees(id),
    leave_type VARCHAR(20) NOT NULL,
    total_days INTEGER NOT NULL,
    used_days INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT uq_balance_employee_leavetype UNIQUE (employee_id, leave_type),
    CONSTRAINT ck_used_days_non_negative CHECK (used_days >= 0),
    CONSTRAINT ck_total_days_non_negative CHECK (total_days >= 0)
);

-- Seed default policies
INSERT INTO leave_policies (role_name, leave_type, default_days) VALUES
('faculty',         'casual', 12),
('faculty',         'sick',   10),
('faculty',         'earned', 30),
('accountant',      'casual', 10),
('accountant',      'sick',   10),
('accountant',      'earned', 20),
('employee',        'casual', 10),
('employee',        'sick',   10),
('employee',        'earned', 20),
('department_head', 'casual', 12),
('department_head', 'sick',   10),
('department_head', 'earned', 30)
ON CONFLICT DO NOTHING;

INSERT INTO leave_balances (employee_id, leave_type, total_days, used_days)
SELECT 
    e.id,
    p.leave_type,
    p.default_days,
    0
FROM employees e
JOIN users u ON e.user_id = u.id
JOIN roles r ON u.role_id = r.id
JOIN leave_policies p ON p.role_name = r.name
ON CONFLICT DO NOTHING;

-- 1. Leaves table
CREATE TABLE IF NOT EXISTS leaves (
    id SERIAL PRIMARY KEY,
    employee_id INTEGER NOT NULL REFERENCES employees(id),
    leave_type VARCHAR(20) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    reason TEXT NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'pending',
    approved_by_hod_id INTEGER REFERENCES users(id),
    approved_by_hr_id INTEGER REFERENCES users(id)
);

-- 2. Leave Policies table
CREATE TABLE IF NOT EXISTS leave_policies (
    id SERIAL PRIMARY KEY,
    role_name VARCHAR(50) NOT NULL,
    leave_type VARCHAR(20) NOT NULL,
    default_days INTEGER NOT NULL,
    CONSTRAINT uq_policy_role_leavetype UNIQUE (role_name, leave_type)
);

-- 3. Leave Balances table
CREATE TABLE IF NOT EXISTS leave_balances (
    id SERIAL PRIMARY KEY,
    employee_id INTEGER NOT NULL REFERENCES employees(id),
    leave_type VARCHAR(20) NOT NULL,
    total_days INTEGER NOT NULL,
    used_days INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT uq_balance_employee_leavetype UNIQUE (employee_id, leave_type),
    CONSTRAINT ck_used_days_non_negative CHECK (used_days >= 0),
    CONSTRAINT ck_total_days_non_negative CHECK (total_days >= 0)
);

-- 4. Seed default policies
INSERT INTO leave_policies (role_name, leave_type, default_days) VALUES
('faculty',         'casual', 12),
('faculty',         'sick',   10),
('faculty',         'earned', 30),
('accountant',      'casual', 10),
('accountant',      'sick',   10),
('accountant',      'earned', 20),
('employee',        'casual', 10),
('employee',        'sick',   10),
('employee',        'earned', 20),
('department_head', 'casual', 12),
('department_head', 'sick',   10),
('department_head', 'earned', 30)
ON CONFLICT DO NOTHING;

-- 5. Seed balances for all existing employees
INSERT INTO leave_balances (employee_id, leave_type, total_days, used_days)
SELECT 
    e.id,
    p.leave_type,
    p.default_days,
    0
FROM employees e
JOIN users u ON e.user_id = u.id
JOIN roles r ON u.role_id = r.id
JOIN leave_policies p ON p.role_name = r.name
ON CONFLICT DO NOTHING;

-- 6. Also add unpaid leave for all employees (unlimited = 9999)
INSERT INTO leave_balances (employee_id, leave_type, total_days, used_days)
SELECT e.id, 'unpaid', 9999, 0
FROM employees e
ON CONFLICT DO NOTHING;

-- Run this in pgAdmin or psql to create the attendance table

CREATE TABLE IF NOT EXISTS attendance (
    id SERIAL PRIMARY KEY,
    employee_id INTEGER NOT NULL REFERENCES employees(id),
    date DATE NOT NULL,
    clock_in TIMESTAMPTZ,
    clock_out TIMESTAMPTZ,
    total_hours NUMERIC(5, 2),
    is_late BOOLEAN NOT NULL DEFAULT FALSE,
    is_auto_clocked_out BOOLEAN NOT NULL DEFAULT FALSE,
    status VARCHAR(20) NOT NULL DEFAULT 'present',
    CONSTRAINT uq_attendance_employee_date UNIQUE (employee_id, date)
);

-- After running this, tell Alembic the DB is up to date:
-- alembic stamp head


-- Run this in pgAdmin, then run: alembic stamp head

-- 1. Onboarding templates (master task list)
CREATE TABLE IF NOT EXISTS onboarding_templates (
    id SERIAL PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    is_active BOOLEAN NOT NULL DEFAULT TRUE
);

-- 2. Onboarding records (one per employee)
CREATE TABLE IF NOT EXISTS onboarding_records (
    id SERIAL PRIMARY KEY,
    employee_id INTEGER NOT NULL REFERENCES employees(id),
    status VARCHAR(20) NOT NULL DEFAULT 'in_progress',
    started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    CONSTRAINT uq_onboarding_employee UNIQUE (employee_id)
);

-- 3. Onboarding tasks (per employee, seeded from templates)
CREATE TABLE IF NOT EXISTS onboarding_tasks (
    id SERIAL PRIMARY KEY,
    onboarding_record_id INTEGER NOT NULL REFERENCES onboarding_records(id) ON DELETE CASCADE,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    is_completed BOOLEAN NOT NULL DEFAULT FALSE,
    completed_at TIMESTAMPTZ
);

-- 4. Offboarding records (one per employee)
CREATE TABLE IF NOT EXISTS offboarding_records (
    id SERIAL PRIMARY KEY,
    employee_id INTEGER NOT NULL REFERENCES employees(id),
    initiated_by_id INTEGER NOT NULL REFERENCES users(id),
    reason TEXT,
    last_working_date TIMESTAMPTZ,
    status VARCHAR(20) NOT NULL DEFAULT 'in_progress',
    clearance_status VARCHAR(20) NOT NULL DEFAULT 'pending',
    initiated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    CONSTRAINT uq_offboarding_employee UNIQUE (employee_id)
);

-- 5. Offboarding tasks (per employee)
CREATE TABLE IF NOT EXISTS offboarding_tasks (
    id SERIAL PRIMARY KEY,
    offboarding_record_id INTEGER NOT NULL REFERENCES offboarding_records(id) ON DELETE CASCADE,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    is_completed BOOLEAN NOT NULL DEFAULT FALSE,
    completed_at TIMESTAMPTZ
);

-- 6. Seed default onboarding templates
INSERT INTO onboarding_templates (title, description) VALUES
('Submit original documents',    'Submit degree certificates, ID proof, and address proof to HR'),
('Sign employment contract',     'Read and sign the official employment contract'),
('Collect ID card',              'Collect university ID card from admin office'),
('Setup university email',       'IT will setup your official university email account'),
('Complete orientation program', 'Attend the HR-conducted new employee orientation'),
('Meet your department head',    'Schedule and complete introductory meeting with your HOD'),
('Complete policy acknowledgment','Read and acknowledge the university HR policy document')
ON CONFLICT DO NOTHING;

-- Run in pgAdmin, then: alembic stamp head

-- 1. Salary structures (one per employee)
CREATE TABLE IF NOT EXISTS salary_structures (
    id SERIAL PRIMARY KEY,
    employee_id INTEGER NOT NULL REFERENCES employees(id),
    basic_salary NUMERIC(12,2) NOT NULL,
    hra NUMERIC(12,2) DEFAULT 0,
    ta NUMERIC(12,2) DEFAULT 0,
    da NUMERIC(12,2) DEFAULT 0,
    other_allowances NUMERIC(12,2) DEFAULT 0,
    pf_deduction NUMERIC(12,2) DEFAULT 0,
    professional_tax NUMERIC(12,2) DEFAULT 0,
    tds_rate NUMERIC(5,2) DEFAULT 0,
    working_days_per_month INTEGER DEFAULT 26,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT uq_salary_employee UNIQUE (employee_id)
);

-- 2. Payslips (one per employee per month)
CREATE TABLE IF NOT EXISTS payslips (
    id SERIAL PRIMARY KEY,
    employee_id INTEGER NOT NULL REFERENCES employees(id),
    month INTEGER NOT NULL,
    year INTEGER NOT NULL,
    working_days INTEGER NOT NULL,
    days_present INTEGER NOT NULL,
    days_absent INTEGER NOT NULL,
    days_on_leave INTEGER DEFAULT 0,
    basic_salary NUMERIC(12,2) NOT NULL,
    hra NUMERIC(12,2) DEFAULT 0,
    ta NUMERIC(12,2) DEFAULT 0,
    da NUMERIC(12,2) DEFAULT 0,
    other_allowances NUMERIC(12,2) DEFAULT 0,
    gross_salary NUMERIC(12,2) NOT NULL,
    absent_deduction NUMERIC(12,2) DEFAULT 0,
    pf_deduction NUMERIC(12,2) DEFAULT 0,
    professional_tax NUMERIC(12,2) DEFAULT 0,
    tds_deduction NUMERIC(12,2) DEFAULT 0,
    total_deductions NUMERIC(12,2) NOT NULL,
    net_pay NUMERIC(12,2) NOT NULL,
    status VARCHAR(20) DEFAULT 'draft',
    notes TEXT,
    generated_at TIMESTAMPTZ DEFAULT NOW(),
    finalized_at TIMESTAMPTZ,
    CONSTRAINT uq_payslip_employee_month_year UNIQUE (employee_id, month, year)
);

-- Run in pgAdmin, then: alembic stamp head

CREATE TABLE IF NOT EXISTS appraisal_cycles (
    id SERIAL PRIMARY KEY,
    title VARCHAR(100) NOT NULL,
    year INTEGER NOT NULL,
    start_date TIMESTAMPTZ NOT NULL,
    end_date TIMESTAMPTZ NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'active'
);

CREATE TABLE IF NOT EXISTS performance_goals (
    id SERIAL PRIMARY KEY,
    employee_id INTEGER NOT NULL REFERENCES employees(id),
    cycle_id INTEGER NOT NULL REFERENCES appraisal_cycles(id),
    goals_text TEXT NOT NULL,
    self_rating NUMERIC(3,1),
    self_comments TEXT,
    hod_rating NUMERIC(3,1),
    hod_comments TEXT,
    reviewed_by_id INTEGER REFERENCES users(id),
    reviewed_at TIMESTAMPTZ,
    final_rating NUMERIC(3,1),
    hr_comments TEXT,
    finalized_by_id INTEGER REFERENCES users(id),
    finalized_at TIMESTAMPTZ,
    status VARCHAR(20) NOT NULL DEFAULT 'draft',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT uq_goal_employee_cycle UNIQUE (employee_id, cycle_id)
);

-- Seed one active cycle for 2026
INSERT INTO appraisal_cycles (title, year, start_date, end_date, status)
VALUES ('Annual 2026', 2026, '2026-01-01 00:00:00+00', '2026-12-31 23:59:59+00', 'active')
ON CONFLICT DO NOTHING;


-- Run in pgAdmin, then: alembic stamp head

CREATE TABLE IF NOT EXISTS chat_sessions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id),
    title VARCHAR(200),
    status VARCHAR(20) NOT NULL DEFAULT 'active',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS chat_messages (
    id SERIAL PRIMARY KEY,
    session_id INTEGER NOT NULL REFERENCES chat_sessions(id) ON DELETE CASCADE,
    role VARCHAR(20) NOT NULL,
    content TEXT NOT NULL,
    agent VARCHAR(50),
    pending_confirmation TEXT,
    llm_used VARCHAR(30),
    tokens_used INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_chat_sessions_user ON chat_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_session ON chat_messages(session_id);


-- Run in pgAdmin, then: alembic stamp head

CREATE TABLE IF NOT EXISTS audit_logs (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
    user_email VARCHAR(255),
    action VARCHAR(100) NOT NULL,
    resource VARCHAR(100),
    resource_id INTEGER,
    detail TEXT,
    ip_address VARCHAR(50),
    status VARCHAR(20) DEFAULT 'success',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_user ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_action ON audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_created ON audit_logs(created_at DESC);

