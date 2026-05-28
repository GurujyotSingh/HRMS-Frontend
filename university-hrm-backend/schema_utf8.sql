--
-- PostgreSQL database dump
--

\restrict BYhQPHQZbyKTKWwzvtHObCpaKoJFbEZGYMaViJid61yBvgiiMe0XgRAePb55jcu

-- Dumped from database version 16.13
-- Dumped by pg_dump version 16.13

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: public; Type: SCHEMA; Schema: -; Owner: postgres
--

-- *not* creating schema, since initdb creates it


ALTER SCHEMA public OWNER TO postgres;

--
-- Name: SCHEMA public; Type: COMMENT; Schema: -; Owner: postgres
--

COMMENT ON SCHEMA public IS '';


--
-- Name: AnnouncementPriority; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."AnnouncementPriority" AS ENUM (
    'NORMAL',
    'IMPORTANT',
    'URGENT'
);


ALTER TYPE public."AnnouncementPriority" OWNER TO postgres;

--
-- Name: ApplicantStatus; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."ApplicantStatus" AS ENUM (
    'APPLIED',
    'SCREENING',
    'INTERVIEW',
    'OFFERED',
    'HIRED',
    'REJECTED'
);


ALTER TYPE public."ApplicantStatus" OWNER TO postgres;

--
-- Name: AttendanceStatus; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."AttendanceStatus" AS ENUM (
    'PRESENT',
    'ABSENT',
    'HALF_DAY',
    'HOLIDAY',
    'WEEKEND',
    'ON_LEAVE'
);


ALTER TYPE public."AttendanceStatus" OWNER TO postgres;

--
-- Name: AuditAction; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."AuditAction" AS ENUM (
    'LOGIN',
    'LOGOUT',
    'FAILED_LOGIN',
    'EMPLOYEE_CREATED',
    'EMPLOYEE_UPDATED',
    'EMPLOYEE_DEACTIVATED',
    'EMPLOYEE_REACTIVATED',
    'ROLE_CHANGED',
    'STATUS_CHANGED',
    'DATA_EXPORT',
    'BULK_ACTION',
    'DEPARTMENT_CREATED',
    'DEPARTMENT_UPDATED',
    'DEPARTMENT_DELETED',
    'LEAVE_APPLIED',
    'LEAVE_APPROVED',
    'LEAVE_REJECTED',
    'LEAVE_CANCELLED',
    'ATTENDANCE_CORRECTED',
    'CLOCK_IN',
    'CLOCK_OUT',
    'PAYROLL_GENERATED',
    'PAYROLL_PUBLISHED',
    'SALARY_STRUCTURE_UPDATED',
    'ONBOARDING_CREATED',
    'ONBOARDING_TASK_UPDATED',
    'OFFBOARDING_INITIATED',
    'OFFBOARDING_TASK_UPDATED',
    'JOB_POSTED',
    'APPLICANT_STATUS_CHANGED',
    'JOB_APPLIED',
    'ANNOUNCEMENT_CREATED',
    'SETTINGS_UPDATED',
    'PASSWORD_CHANGED',
    'GOAL_SUBMITTED',
    'GOAL_REVIEWED',
    'GOAL_FINALIZED'
);


ALTER TYPE public."AuditAction" OWNER TO postgres;

--
-- Name: CaseSeverity; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."CaseSeverity" AS ENUM (
    'LOW',
    'MEDIUM',
    'HIGH',
    'CRITICAL'
);


ALTER TYPE public."CaseSeverity" OWNER TO postgres;

--
-- Name: CaseStatus; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."CaseStatus" AS ENUM (
    'OPEN',
    'INVESTIGATING',
    'RESOLVED',
    'CLOSED'
);


ALTER TYPE public."CaseStatus" OWNER TO postgres;

--
-- Name: CaseType; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."CaseType" AS ENUM (
    'GRIEVANCE',
    'DISCIPLINARY',
    'HARASSMENT',
    'OTHER'
);


ALTER TYPE public."CaseType" OWNER TO postgres;

--
-- Name: CourseStatus; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."CourseStatus" AS ENUM (
    'DRAFT',
    'PUBLISHED',
    'ARCHIVED'
);


ALTER TYPE public."CourseStatus" OWNER TO postgres;

--
-- Name: CycleStatus; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."CycleStatus" AS ENUM (
    'ACTIVE',
    'CLOSED'
);


ALTER TYPE public."CycleStatus" OWNER TO postgres;

--
-- Name: EmployeeStatus; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."EmployeeStatus" AS ENUM (
    'ACTIVE',
    'INACTIVE',
    'SUSPENDED',
    'ON_LEAVE'
);


ALTER TYPE public."EmployeeStatus" OWNER TO postgres;

--
-- Name: EmploymentType; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."EmploymentType" AS ENUM (
    'FULL_TIME',
    'PART_TIME',
    'CONTRACT',
    'VISITING'
);


ALTER TYPE public."EmploymentType" OWNER TO postgres;

--
-- Name: EnrollmentStatus; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."EnrollmentStatus" AS ENUM (
    'ENROLLED',
    'IN_PROGRESS',
    'COMPLETED'
);


ALTER TYPE public."EnrollmentStatus" OWNER TO postgres;

--
-- Name: Gender; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."Gender" AS ENUM (
    'MALE',
    'FEMALE',
    'OTHER',
    'PREFER_NOT_TO_SAY'
);


ALTER TYPE public."Gender" OWNER TO postgres;

--
-- Name: GoalStatus; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."GoalStatus" AS ENUM (
    'DRAFT',
    'SUBMITTED',
    'DIRECTOR_REVIEWED',
    'FINALIZED'
);


ALTER TYPE public."GoalStatus" OWNER TO postgres;

--
-- Name: HolidayType; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."HolidayType" AS ENUM (
    'NATIONAL',
    'REGIONAL',
    'UNIVERSITY'
);


ALTER TYPE public."HolidayType" OWNER TO postgres;

--
-- Name: LeaveStatus; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."LeaveStatus" AS ENUM (
    'PENDING',
    'APPROVED',
    'REJECTED',
    'CANCELLED'
);


ALTER TYPE public."LeaveStatus" OWNER TO postgres;

--
-- Name: LeaveType; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."LeaveType" AS ENUM (
    'ANNUAL',
    'SICK',
    'CASUAL',
    'MATERNITY',
    'PATERNITY',
    'UNPAID',
    'COMPENSATORY'
);


ALTER TYPE public."LeaveType" OWNER TO postgres;

--
-- Name: NotificationType; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."NotificationType" AS ENUM (
    'LEAVE_APPROVED',
    'LEAVE_REJECTED',
    'LEAVE_PENDING',
    'ATTENDANCE_FLAGGED',
    'ANNOUNCEMENT',
    'ONBOARDING',
    'PAYSLIP',
    'SYSTEM'
);


ALTER TYPE public."NotificationType" OWNER TO postgres;

--
-- Name: OffboardingStatus; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."OffboardingStatus" AS ENUM (
    'IN_PROGRESS',
    'COMPLETED'
);


ALTER TYPE public."OffboardingStatus" OWNER TO postgres;

--
-- Name: OnboardingStatus; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."OnboardingStatus" AS ENUM (
    'NOT_STARTED',
    'IN_PROGRESS',
    'COMPLETED'
);


ALTER TYPE public."OnboardingStatus" OWNER TO postgres;

--
-- Name: PayslipStatus; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."PayslipStatus" AS ENUM (
    'DRAFT',
    'PUBLISHED'
);


ALTER TYPE public."PayslipStatus" OWNER TO postgres;

--
-- Name: RecruitmentStatus; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."RecruitmentStatus" AS ENUM (
    'OPEN',
    'CLOSED',
    'PAUSED',
    'FILLED'
);


ALTER TYPE public."RecruitmentStatus" OWNER TO postgres;

--
-- Name: SystemRole; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."SystemRole" AS ENUM (
    'SUPER_ADMIN',
    'DIRECTOR',
    'HR_MANAGER',
    'HR_STAFF',
    'FACULTY',
    'STAFF'
);


ALTER TYPE public."SystemRole" OWNER TO postgres;

--
-- Name: TaskPriority; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."TaskPriority" AS ENUM (
    'LOW',
    'MEDIUM',
    'HIGH'
);


ALTER TYPE public."TaskPriority" OWNER TO postgres;

--
-- Name: TaskStatus; Type: TYPE; Schema: public; Owner: postgres
--

CREATE TYPE public."TaskStatus" AS ENUM (
    'NOT_STARTED',
    'IN_PROGRESS',
    'COMPLETED',
    'BLOCKED'
);


ALTER TYPE public."TaskStatus" OWNER TO postgres;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: ai_conversations; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.ai_conversations (
    id character varying(36) NOT NULL,
    user_id character varying(36) NOT NULL,
    messages jsonb[],
    context jsonb,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL
);


ALTER TABLE public.ai_conversations OWNER TO postgres;

--
-- Name: alembic_version; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.alembic_version (
    version_num character varying(32) NOT NULL
);


ALTER TABLE public.alembic_version OWNER TO postgres;

--
-- Name: announcement_reads; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.announcement_reads (
    id character varying(36) NOT NULL,
    announcement_id character varying(36) NOT NULL,
    user_id character varying(36) NOT NULL,
    read_at timestamp with time zone NOT NULL
);


ALTER TABLE public.announcement_reads OWNER TO postgres;

--
-- Name: announcements; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.announcements (
    id character varying(36) NOT NULL,
    title character varying NOT NULL,
    body text NOT NULL,
    author_id character varying(36) NOT NULL,
    target_roles character varying[],
    target_departments character varying[],
    priority public."AnnouncementPriority",
    published_at timestamp with time zone NOT NULL,
    expires_at timestamp with time zone,
    created_at timestamp with time zone NOT NULL
);


ALTER TABLE public.announcements OWNER TO postgres;

--
-- Name: appraisal_cycles; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.appraisal_cycles (
    id character varying(36) NOT NULL,
    title character varying NOT NULL,
    year integer NOT NULL,
    start_date timestamp with time zone NOT NULL,
    end_date timestamp with time zone NOT NULL,
    status public."CycleStatus",
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL
);


ALTER TABLE public.appraisal_cycles OWNER TO postgres;

--
-- Name: attendance; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.attendance (
    id character varying(36) NOT NULL,
    employee_id character varying(36) NOT NULL,
    date date NOT NULL,
    check_in timestamp with time zone,
    check_out timestamp with time zone,
    total_hours double precision,
    status public."AttendanceStatus",
    is_late boolean NOT NULL,
    notes text,
    corrected_by character varying,
    corrected_at timestamp with time zone,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL
);


ALTER TABLE public.attendance OWNER TO postgres;

--
-- Name: audit_logs; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.audit_logs (
    id character varying(36) NOT NULL,
    user_id character varying(36),
    user_email character varying,
    action public."AuditAction" NOT NULL,
    resource character varying(100),
    resource_id character varying,
    detail text,
    details jsonb,
    ip_address character varying,
    user_agent character varying,
    status character varying(20) NOT NULL,
    created_at timestamp with time zone NOT NULL
);


ALTER TABLE public.audit_logs OWNER TO postgres;

--
-- Name: calendar_events; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.calendar_events (
    id character varying(36) NOT NULL,
    title character varying NOT NULL,
    description text,
    start_time timestamp with time zone NOT NULL,
    end_time timestamp with time zone NOT NULL,
    created_by_id character varying(36) NOT NULL,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL
);


ALTER TABLE public.calendar_events OWNER TO postgres;

--
-- Name: departments; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.departments (
    id character varying(36) NOT NULL,
    name character varying NOT NULL,
    code character varying(10) NOT NULL,
    director_id character varying(36),
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL
);


ALTER TABLE public.departments OWNER TO postgres;

--
-- Name: documents; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.documents (
    id character varying(36) NOT NULL,
    employee_id character varying(36) NOT NULL,
    file_name character varying NOT NULL,
    original_name character varying NOT NULL,
    file_url character varying NOT NULL,
    file_type character varying NOT NULL,
    file_size integer NOT NULL,
    category character varying NOT NULL,
    expiry_date timestamp with time zone,
    uploaded_at timestamp with time zone NOT NULL
);


ALTER TABLE public.documents OWNER TO postgres;

--
-- Name: employee_skills; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.employee_skills (
    id character varying(36) NOT NULL,
    employee_id character varying(36) NOT NULL,
    skill_name character varying NOT NULL,
    proficiency_level character varying,
    certificate_date timestamp with time zone,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL
);


ALTER TABLE public.employee_skills OWNER TO postgres;

--
-- Name: holidays; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.holidays (
    id character varying(36) NOT NULL,
    name character varying NOT NULL,
    date date NOT NULL,
    type public."HolidayType",
    is_optional boolean NOT NULL,
    created_at timestamp with time zone NOT NULL
);


ALTER TABLE public.holidays OWNER TO postgres;

--
-- Name: job_positions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.job_positions (
    id character varying(36) NOT NULL,
    title character varying NOT NULL,
    description text,
    department_id character varying(36) NOT NULL,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL
);


ALTER TABLE public.job_positions OWNER TO postgres;

--
-- Name: kudos; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.kudos (
    id character varying(36) NOT NULL,
    to_user_id character varying(36) NOT NULL,
    from_name character varying NOT NULL,
    message text NOT NULL,
    created_at timestamp with time zone NOT NULL
);


ALTER TABLE public.kudos OWNER TO postgres;

--
-- Name: leave_balances; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.leave_balances (
    id character varying(36) NOT NULL,
    employee_id character varying(36) NOT NULL,
    year integer NOT NULL,
    annual_total integer NOT NULL,
    annual_used integer NOT NULL,
    sick_total integer NOT NULL,
    sick_used integer NOT NULL,
    casual_total integer NOT NULL,
    casual_used integer NOT NULL,
    maternity_total integer NOT NULL,
    maternity_used integer NOT NULL,
    paternity_total integer NOT NULL,
    paternity_used integer NOT NULL,
    unpaid_used integer NOT NULL,
    compensatory_total integer NOT NULL,
    compensatory_used integer NOT NULL,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL
);


ALTER TABLE public.leave_balances OWNER TO postgres;

--
-- Name: leave_requests; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.leave_requests (
    id character varying(36) NOT NULL,
    employee_id character varying(36) NOT NULL,
    leave_type public."LeaveType",
    from_date timestamp with time zone NOT NULL,
    to_date timestamp with time zone NOT NULL,
    total_days integer NOT NULL,
    reason text NOT NULL,
    attachment_url character varying,
    status public."LeaveStatus",
    reviewed_by_id character varying(36),
    reviewed_at timestamp with time zone,
    remarks text,
    applied_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL
);


ALTER TABLE public.leave_requests OWNER TO postgres;

--
-- Name: notifications; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.notifications (
    id character varying(36) NOT NULL,
    user_id character varying(36) NOT NULL,
    type public."NotificationType",
    title character varying NOT NULL,
    message text NOT NULL,
    link character varying,
    is_read boolean NOT NULL,
    created_at timestamp with time zone NOT NULL
);


ALTER TABLE public.notifications OWNER TO postgres;

--
-- Name: offboarding_records; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.offboarding_records (
    id character varying(36) NOT NULL,
    employee_id character varying(36) NOT NULL,
    initiated_by_id character varying(36) NOT NULL,
    reason text,
    last_working_date timestamp with time zone,
    resignation_date timestamp with time zone,
    forwarding_address text,
    personal_email character varying,
    notes text,
    status public."OffboardingStatus",
    clearance_status character varying NOT NULL,
    initiated_at timestamp with time zone NOT NULL,
    completed_at timestamp with time zone,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL
);


ALTER TABLE public.offboarding_records OWNER TO postgres;

--
-- Name: offboarding_tasks; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.offboarding_tasks (
    id character varying(36) NOT NULL,
    offboarding_id character varying(36) NOT NULL,
    title character varying NOT NULL,
    description text,
    status character varying NOT NULL,
    is_completed boolean NOT NULL,
    completed_at timestamp with time zone,
    notes text,
    created_at timestamp with time zone NOT NULL
);


ALTER TABLE public.offboarding_tasks OWNER TO postgres;

--
-- Name: onboarding_employees; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.onboarding_employees (
    id character varying(36) NOT NULL,
    employee_id character varying(36) NOT NULL,
    start_date timestamp with time zone NOT NULL,
    expected_completion_date timestamp with time zone NOT NULL,
    completed_at timestamp with time zone,
    status public."OnboardingStatus",
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL
);


ALTER TABLE public.onboarding_employees OWNER TO postgres;

--
-- Name: onboarding_tasks; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.onboarding_tasks (
    id character varying(36) NOT NULL,
    onboarding_id character varying(36) NOT NULL,
    title character varying NOT NULL,
    description text,
    assigned_to_id character varying(36) NOT NULL,
    due_date timestamp with time zone NOT NULL,
    status public."TaskStatus",
    priority public."TaskPriority",
    "order" integer NOT NULL,
    completed_at timestamp with time zone,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL
);


ALTER TABLE public.onboarding_tasks OWNER TO postgres;

--
-- Name: payslips; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.payslips (
    id character varying(36) NOT NULL,
    employee_id character varying(36) NOT NULL,
    month integer NOT NULL,
    year integer NOT NULL,
    working_days integer NOT NULL,
    days_present integer NOT NULL,
    days_absent integer NOT NULL,
    days_on_leave integer NOT NULL,
    basic_salary double precision NOT NULL,
    hra double precision NOT NULL,
    ta double precision NOT NULL,
    da double precision NOT NULL,
    other_allowances double precision NOT NULL,
    gross_salary double precision NOT NULL,
    absent_deduction double precision NOT NULL,
    pf_deduction double precision NOT NULL,
    professional_tax double precision NOT NULL,
    tds_deduction double precision NOT NULL,
    total_deductions double precision NOT NULL,
    net_salary double precision NOT NULL,
    notes text,
    pdf_url character varying,
    status public."PayslipStatus",
    generated_at timestamp with time zone NOT NULL,
    published_at timestamp with time zone
);


ALTER TABLE public.payslips OWNER TO postgres;

--
-- Name: performance_goals; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.performance_goals (
    id character varying(36) NOT NULL,
    employee_id character varying(36) NOT NULL,
    cycle_id character varying(36) NOT NULL,
    goals_text text NOT NULL,
    self_rating double precision,
    self_comments text,
    director_rating double precision,
    director_comments text,
    reviewed_by_id character varying(36),
    reviewed_at timestamp with time zone,
    final_rating double precision,
    hr_comments text,
    finalized_by_id character varying(36),
    finalized_at timestamp with time zone,
    status public."GoalStatus",
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL
);


ALTER TABLE public.performance_goals OWNER TO postgres;

--
-- Name: recruitment_applicants; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.recruitment_applicants (
    id character varying(36) NOT NULL,
    job_id character varying(36) NOT NULL,
    name character varying NOT NULL,
    email character varying NOT NULL,
    phone character varying,
    resume_url character varying,
    status public."ApplicantStatus",
    notes text,
    applied_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL
);


ALTER TABLE public.recruitment_applicants OWNER TO postgres;

--
-- Name: recruitment_jobs; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.recruitment_jobs (
    id character varying(36) NOT NULL,
    title character varying NOT NULL,
    department_id character varying(36) NOT NULL,
    type public."EmploymentType",
    description text NOT NULL,
    requirements character varying[],
    posted_at timestamp with time zone NOT NULL,
    closing_date timestamp with time zone NOT NULL,
    status public."RecruitmentStatus",
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL
);


ALTER TABLE public.recruitment_jobs OWNER TO postgres;

--
-- Name: refresh_tokens; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.refresh_tokens (
    id character varying(36) NOT NULL,
    token character varying NOT NULL,
    user_id character varying(36) NOT NULL,
    user_agent character varying,
    ip_address character varying,
    expires_at timestamp with time zone NOT NULL,
    created_at timestamp with time zone NOT NULL,
    revoked_at timestamp with time zone,
    is_revoked boolean NOT NULL
);


ALTER TABLE public.refresh_tokens OWNER TO postgres;

--
-- Name: salary_structures; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.salary_structures (
    id character varying(36) NOT NULL,
    employee_id character varying(36) NOT NULL,
    basic_salary double precision NOT NULL,
    hra double precision NOT NULL,
    ta double precision NOT NULL,
    da double precision NOT NULL,
    other_allowances double precision NOT NULL,
    pf_deduction double precision NOT NULL,
    professional_tax double precision NOT NULL,
    tds_rate double precision NOT NULL,
    working_days_per_month integer NOT NULL,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL
);


ALTER TABLE public.salary_structures OWNER TO postgres;

--
-- Name: system_settings; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.system_settings (
    id character varying NOT NULL,
    work_start_time character varying NOT NULL,
    work_end_time character varying NOT NULL,
    late_threshold_minutes integer NOT NULL,
    working_days integer[],
    leave_carry_forward_max integer NOT NULL,
    payroll_cycle_day integer NOT NULL,
    ai_enabled boolean NOT NULL,
    ai_system_prompt text,
    updated_at timestamp with time zone NOT NULL
);


ALTER TABLE public.system_settings OWNER TO postgres;

--
-- Name: users; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.users (
    id character varying(36) NOT NULL,
    employee_id character varying NOT NULL,
    first_name character varying NOT NULL,
    last_name character varying NOT NULL,
    email character varying NOT NULL,
    work_email character varying NOT NULL,
    password_hash character varying NOT NULL,
    phone character varying,
    personal_email character varying,
    date_of_birth timestamp with time zone,
    gender public."Gender",
    nationality character varying,
    profile_photo character varying,
    bio text,
    skills character varying[],
    role public."SystemRole",
    designation character varying,
    department_id character varying(36),
    employment_type public."EmploymentType",
    salary double precision,
    join_date timestamp with time zone,
    exit_date timestamp with time zone,
    status public."EmployeeStatus",
    street character varying,
    city character varying,
    state character varying,
    country character varying,
    pincode character varying,
    campus character varying,
    emergency_name character varying,
    emergency_relation character varying,
    emergency_phone character varying,
    emergency_email character varying,
    reporting_manager_id character varying(36),
    position_id character varying(36),
    preferences jsonb,
    reset_token character varying,
    reset_token_expiry timestamp with time zone,
    needs_password_change boolean NOT NULL,
    failed_login_attempts integer NOT NULL,
    locked_until timestamp with time zone,
    last_login timestamp with time zone,
    created_at timestamp with time zone NOT NULL,
    updated_at timestamp with time zone NOT NULL
);


ALTER TABLE public.users OWNER TO postgres;

--
-- Name: ai_conversations ai_conversations_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ai_conversations
    ADD CONSTRAINT ai_conversations_pkey PRIMARY KEY (id);


--
-- Name: alembic_version alembic_version_pkc; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.alembic_version
    ADD CONSTRAINT alembic_version_pkc PRIMARY KEY (version_num);


--
-- Name: announcement_reads announcement_reads_announcement_id_user_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.announcement_reads
    ADD CONSTRAINT announcement_reads_announcement_id_user_id_key UNIQUE (announcement_id, user_id);


--
-- Name: announcement_reads announcement_reads_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.announcement_reads
    ADD CONSTRAINT announcement_reads_pkey PRIMARY KEY (id);


--
-- Name: announcements announcements_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.announcements
    ADD CONSTRAINT announcements_pkey PRIMARY KEY (id);


--
-- Name: appraisal_cycles appraisal_cycles_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.appraisal_cycles
    ADD CONSTRAINT appraisal_cycles_pkey PRIMARY KEY (id);


--
-- Name: attendance attendance_employee_id_date_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.attendance
    ADD CONSTRAINT attendance_employee_id_date_key UNIQUE (employee_id, date);


--
-- Name: attendance attendance_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.attendance
    ADD CONSTRAINT attendance_pkey PRIMARY KEY (id);


--
-- Name: audit_logs audit_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.audit_logs
    ADD CONSTRAINT audit_logs_pkey PRIMARY KEY (id);


--
-- Name: calendar_events calendar_events_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.calendar_events
    ADD CONSTRAINT calendar_events_pkey PRIMARY KEY (id);


--
-- Name: departments departments_code_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.departments
    ADD CONSTRAINT departments_code_key UNIQUE (code);


--
-- Name: departments departments_name_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.departments
    ADD CONSTRAINT departments_name_key UNIQUE (name);


--
-- Name: departments departments_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.departments
    ADD CONSTRAINT departments_pkey PRIMARY KEY (id);


--
-- Name: documents documents_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.documents
    ADD CONSTRAINT documents_pkey PRIMARY KEY (id);


--
-- Name: employee_skills employee_skills_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.employee_skills
    ADD CONSTRAINT employee_skills_pkey PRIMARY KEY (id);


--
-- Name: holidays holidays_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.holidays
    ADD CONSTRAINT holidays_pkey PRIMARY KEY (id);


--
-- Name: job_positions job_positions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.job_positions
    ADD CONSTRAINT job_positions_pkey PRIMARY KEY (id);


--
-- Name: job_positions job_positions_title_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.job_positions
    ADD CONSTRAINT job_positions_title_key UNIQUE (title);


--
-- Name: kudos kudos_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.kudos
    ADD CONSTRAINT kudos_pkey PRIMARY KEY (id);


--
-- Name: leave_balances leave_balances_employee_id_year_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.leave_balances
    ADD CONSTRAINT leave_balances_employee_id_year_key UNIQUE (employee_id, year);


--
-- Name: leave_balances leave_balances_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.leave_balances
    ADD CONSTRAINT leave_balances_pkey PRIMARY KEY (id);


--
-- Name: leave_requests leave_requests_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.leave_requests
    ADD CONSTRAINT leave_requests_pkey PRIMARY KEY (id);


--
-- Name: notifications notifications_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_pkey PRIMARY KEY (id);


--
-- Name: offboarding_records offboarding_records_employee_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.offboarding_records
    ADD CONSTRAINT offboarding_records_employee_id_key UNIQUE (employee_id);


--
-- Name: offboarding_records offboarding_records_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.offboarding_records
    ADD CONSTRAINT offboarding_records_pkey PRIMARY KEY (id);


--
-- Name: offboarding_tasks offboarding_tasks_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.offboarding_tasks
    ADD CONSTRAINT offboarding_tasks_pkey PRIMARY KEY (id);


--
-- Name: onboarding_employees onboarding_employees_employee_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.onboarding_employees
    ADD CONSTRAINT onboarding_employees_employee_id_key UNIQUE (employee_id);


--
-- Name: onboarding_employees onboarding_employees_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.onboarding_employees
    ADD CONSTRAINT onboarding_employees_pkey PRIMARY KEY (id);


--
-- Name: onboarding_tasks onboarding_tasks_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.onboarding_tasks
    ADD CONSTRAINT onboarding_tasks_pkey PRIMARY KEY (id);


--
-- Name: payslips payslips_employee_id_month_year_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payslips
    ADD CONSTRAINT payslips_employee_id_month_year_key UNIQUE (employee_id, month, year);


--
-- Name: payslips payslips_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payslips
    ADD CONSTRAINT payslips_pkey PRIMARY KEY (id);


--
-- Name: performance_goals performance_goals_employee_id_cycle_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.performance_goals
    ADD CONSTRAINT performance_goals_employee_id_cycle_id_key UNIQUE (employee_id, cycle_id);


--
-- Name: performance_goals performance_goals_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.performance_goals
    ADD CONSTRAINT performance_goals_pkey PRIMARY KEY (id);


--
-- Name: recruitment_applicants recruitment_applicants_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.recruitment_applicants
    ADD CONSTRAINT recruitment_applicants_pkey PRIMARY KEY (id);


--
-- Name: recruitment_jobs recruitment_jobs_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.recruitment_jobs
    ADD CONSTRAINT recruitment_jobs_pkey PRIMARY KEY (id);


--
-- Name: refresh_tokens refresh_tokens_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.refresh_tokens
    ADD CONSTRAINT refresh_tokens_pkey PRIMARY KEY (id);


--
-- Name: refresh_tokens refresh_tokens_token_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.refresh_tokens
    ADD CONSTRAINT refresh_tokens_token_key UNIQUE (token);


--
-- Name: salary_structures salary_structures_employee_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.salary_structures
    ADD CONSTRAINT salary_structures_employee_id_key UNIQUE (employee_id);


--
-- Name: salary_structures salary_structures_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.salary_structures
    ADD CONSTRAINT salary_structures_pkey PRIMARY KEY (id);


--
-- Name: system_settings system_settings_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.system_settings
    ADD CONSTRAINT system_settings_pkey PRIMARY KEY (id);


--
-- Name: users users_email_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_key UNIQUE (email);


--
-- Name: users users_employee_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_employee_id_key UNIQUE (employee_id);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: users users_work_email_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_work_email_key UNIQUE (work_email);


--
-- Name: ai_conversations ai_conversations_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.ai_conversations
    ADD CONSTRAINT ai_conversations_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: announcement_reads announcement_reads_announcement_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.announcement_reads
    ADD CONSTRAINT announcement_reads_announcement_id_fkey FOREIGN KEY (announcement_id) REFERENCES public.announcements(id) ON DELETE CASCADE;


--
-- Name: announcement_reads announcement_reads_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.announcement_reads
    ADD CONSTRAINT announcement_reads_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: announcements announcements_author_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.announcements
    ADD CONSTRAINT announcements_author_id_fkey FOREIGN KEY (author_id) REFERENCES public.users(id);


--
-- Name: attendance attendance_employee_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.attendance
    ADD CONSTRAINT attendance_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES public.users(id);


--
-- Name: audit_logs audit_logs_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.audit_logs
    ADD CONSTRAINT audit_logs_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: calendar_events calendar_events_created_by_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.calendar_events
    ADD CONSTRAINT calendar_events_created_by_id_fkey FOREIGN KEY (created_by_id) REFERENCES public.users(id);


--
-- Name: documents documents_employee_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.documents
    ADD CONSTRAINT documents_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES public.users(id);


--
-- Name: employee_skills employee_skills_employee_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.employee_skills
    ADD CONSTRAINT employee_skills_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES public.users(id);


--
-- Name: job_positions job_positions_department_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.job_positions
    ADD CONSTRAINT job_positions_department_id_fkey FOREIGN KEY (department_id) REFERENCES public.departments(id);


--
-- Name: kudos kudos_to_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.kudos
    ADD CONSTRAINT kudos_to_user_id_fkey FOREIGN KEY (to_user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: leave_balances leave_balances_employee_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.leave_balances
    ADD CONSTRAINT leave_balances_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: leave_requests leave_requests_employee_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.leave_requests
    ADD CONSTRAINT leave_requests_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES public.users(id);


--
-- Name: leave_requests leave_requests_reviewed_by_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.leave_requests
    ADD CONSTRAINT leave_requests_reviewed_by_id_fkey FOREIGN KEY (reviewed_by_id) REFERENCES public.users(id);


--
-- Name: notifications notifications_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: offboarding_records offboarding_records_employee_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.offboarding_records
    ADD CONSTRAINT offboarding_records_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES public.users(id);


--
-- Name: offboarding_records offboarding_records_initiated_by_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.offboarding_records
    ADD CONSTRAINT offboarding_records_initiated_by_id_fkey FOREIGN KEY (initiated_by_id) REFERENCES public.users(id);


--
-- Name: offboarding_tasks offboarding_tasks_offboarding_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.offboarding_tasks
    ADD CONSTRAINT offboarding_tasks_offboarding_id_fkey FOREIGN KEY (offboarding_id) REFERENCES public.offboarding_records(id) ON DELETE CASCADE;


--
-- Name: onboarding_employees onboarding_employees_employee_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.onboarding_employees
    ADD CONSTRAINT onboarding_employees_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES public.users(id);


--
-- Name: onboarding_tasks onboarding_tasks_assigned_to_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.onboarding_tasks
    ADD CONSTRAINT onboarding_tasks_assigned_to_id_fkey FOREIGN KEY (assigned_to_id) REFERENCES public.users(id);


--
-- Name: onboarding_tasks onboarding_tasks_onboarding_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.onboarding_tasks
    ADD CONSTRAINT onboarding_tasks_onboarding_id_fkey FOREIGN KEY (onboarding_id) REFERENCES public.onboarding_employees(id) ON DELETE CASCADE;


--
-- Name: payslips payslips_employee_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.payslips
    ADD CONSTRAINT payslips_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES public.users(id);


--
-- Name: performance_goals performance_goals_cycle_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.performance_goals
    ADD CONSTRAINT performance_goals_cycle_id_fkey FOREIGN KEY (cycle_id) REFERENCES public.appraisal_cycles(id);


--
-- Name: performance_goals performance_goals_employee_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.performance_goals
    ADD CONSTRAINT performance_goals_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES public.users(id);


--
-- Name: performance_goals performance_goals_finalized_by_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.performance_goals
    ADD CONSTRAINT performance_goals_finalized_by_id_fkey FOREIGN KEY (finalized_by_id) REFERENCES public.users(id);


--
-- Name: performance_goals performance_goals_reviewed_by_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.performance_goals
    ADD CONSTRAINT performance_goals_reviewed_by_id_fkey FOREIGN KEY (reviewed_by_id) REFERENCES public.users(id);


--
-- Name: recruitment_applicants recruitment_applicants_job_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.recruitment_applicants
    ADD CONSTRAINT recruitment_applicants_job_id_fkey FOREIGN KEY (job_id) REFERENCES public.recruitment_jobs(id) ON DELETE CASCADE;


--
-- Name: recruitment_jobs recruitment_jobs_department_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.recruitment_jobs
    ADD CONSTRAINT recruitment_jobs_department_id_fkey FOREIGN KEY (department_id) REFERENCES public.departments(id);


--
-- Name: refresh_tokens refresh_tokens_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.refresh_tokens
    ADD CONSTRAINT refresh_tokens_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: salary_structures salary_structures_employee_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.salary_structures
    ADD CONSTRAINT salary_structures_employee_id_fkey FOREIGN KEY (employee_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: users users_department_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_department_id_fkey FOREIGN KEY (department_id) REFERENCES public.departments(id);


--
-- Name: users users_position_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_position_id_fkey FOREIGN KEY (position_id) REFERENCES public.job_positions(id);


--
-- Name: users users_reporting_manager_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_reporting_manager_id_fkey FOREIGN KEY (reporting_manager_id) REFERENCES public.users(id);


--
-- Name: SCHEMA public; Type: ACL; Schema: -; Owner: postgres
--

REVOKE USAGE ON SCHEMA public FROM PUBLIC;
GRANT ALL ON SCHEMA public TO PUBLIC;


--
-- PostgreSQL database dump complete
--

\unrestrict BYhQPHQZbyKTKWwzvtHObCpaKoJFbEZGYMaViJid61yBvgiiMe0XgRAePb55jcu

