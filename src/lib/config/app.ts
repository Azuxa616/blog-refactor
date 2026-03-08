// 应用配置文件
export const appConfig = {
  // 应用基本信息
  app: {
    name: 'Azuxa\'s BlogSpace',
    description: '一个现代化的全栈个人博客系统',
    version: import.meta.env.PUBLIC_APP_VERSION || "未知版本",
    author: import.meta.env.PUBLIC_AUTHOR || "站长",
    url: import.meta.env.PUBLIC_SITE_URL || 'http://localhost:4321',
  },
  // 站长账号设置
  
  admin: {
    username: import.meta.env.ADMIN_USERNAME || 'admin',
    email: import.meta.env.ADMIN_EMAIL || 'admin@example.com',
    password: import.meta.env.ADMIN_PASSWORD || 'admin',
    // 清理 GitHub 用户名：去除引号、冒号和空格
    githubName: import.meta.env.GITHUB_NAME 
      ? import.meta.env.GITHUB_NAME.trim().replace(/^[:"]+|[:"]+$/g, '').trim()
      : 'your-github-name',
  },

  // JWT配置
  jwt: {
    secret: import.meta.env.JWT_SECRET || 'azuxa-blog-azuxa-jwt-secret',
    refreshSecret: import.meta.env.JWT_REFRESH_SECRET || 'azuxa-blog-azuxa-jwt-refresh-secret',
    expiresIn: import.meta.env.JWT_EXPIRES_IN || '1h',
    refreshExpiresIn: import.meta.env.JWT_REFRESH_EXPIRES_IN || '7d',
  },

  // 文件上传配置
  upload: {
    dir: import.meta.env.UPLOAD_DIR || './public/uploads',
    maxSize: parseInt(import.meta.env.MAX_FILE_SIZE || '10485760'), // 10MB
    allowedTypes: import.meta.env.ALLOWED_FILE_TYPES?.split(',') || [
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
    ],
  },

  // 邮件配置
  email: {
    host: import.meta.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(import.meta.env.SMTP_PORT || '587'),
    user: import.meta.env.SMTP_USER || '',
    pass: import.meta.env.SMTP_PASS || '',
    from: import.meta.env.FROM_EMAIL || 'noreply@azuxa.com',
    fromName: import.meta.env.FROM_NAME || 'Azuxa\'s BlogSpace',
  },

  // 安全配置
  security: {
    bcryptRounds: parseInt(import.meta.env.BCRYPT_ROUNDS || '12'),
    rateLimitWindowMs: parseInt(import.meta.env.RATE_LIMIT_WINDOW_MS || '900000'), // 15 minutes
    rateLimitMaxRequests: parseInt(import.meta.env.RATE_LIMIT_MAX_REQUESTS || '100'),
  },

  // 分页配置
  pagination: {
    defaultLimit: 10,
    maxLimit: 100,
  },


  // 第三方服务配置
  oauth: {
    google: {
      clientId: import.meta.env.GOOGLE_CLIENT_ID || '',
      clientSecret: import.meta.env.GOOGLE_CLIENT_SECRET || '',
    },
    github: {
      clientId: import.meta.env.GITHUB_CLIENT_ID || '',
      clientSecret: import.meta.env.GITHUB_CLIENT_SECRET || '',
    },
  },

  // 开发环境配置
  isDevelopment: import.meta.env.DEV,
  isProduction: import.meta.env.PROD,
};
