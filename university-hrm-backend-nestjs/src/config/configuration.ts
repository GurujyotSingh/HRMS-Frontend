export default () => ({
  port: parseInt(process.env.PORT || '3001', 10),
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',
  jwt: {
    secret: process.env.JWT_SECRET || 'fallback-secret-change-me',
    refreshSecret: process.env.JWT_REFRESH_SECRET || 'fallback-refresh-secret',
    accessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '15m',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  },
  smtp: {
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587', 10),
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || '',
    from: process.env.SMTP_FROM || 'University HRMS <noreply@university.edu>',
  },
  upload: {
    dir: process.env.UPLOAD_DIR || './uploads',
    maxFileSizeMb: parseInt(process.env.MAX_FILE_SIZE_MB || '10', 10),
  },
  ai: {
    apiKey: process.env.AI_API_KEY || '',
    model: process.env.AI_MODEL || 'claude-sonnet-4-20250514',
  },
  nodeEnv: process.env.NODE_ENV || 'development',
});
