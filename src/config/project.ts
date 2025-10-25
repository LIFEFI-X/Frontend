/**
 * Project configuration file
 * Define the basic information and development rules of the project
 */

export const PROJECT_CONFIG = {
  // Project basic information
  name: 'Portal App',
  version: '1.0.0',
  description: 'A platform that links users and merchants - client',
  
  // Project type
  type: 'user-portal', // client
  
  // technology stack
  tech: {
    framework: 'Vue 3',
    language: 'TypeScript',
    ui: 'Ant Design Vue',
    build: 'Vite',
    package: 'pnpm'
  },

  // development rules
  rules: {
    // 1. The project as a whole is a project that links users and merchants, and the current directory is the client
    projectScope: 'user-side',
    businessModel: 'user-merchant-connection',
    
    // 2. Need to support internationalization
    i18n: {
      enabled: true,
      defaultLocale: 'zh-CN',
      supportedLocales: ['zh-CN', 'en-US'],
      fallbackLocale: 'en-US'
    },
    
    // 3. Develop using Vue3
    framework: {
      name: 'Vue 3',
      version: '^3.5.13',
      compositionApi: true,
      scriptSetup: true
    },
    
    // 4. Need to adapt to mobile terminals
    responsive: {
      primary: 'mobile-first',
      designWidth: 375,
      supportDesktop: true,
      breakpoints: {
        mobile: '0-767px',
        tablet: '768-1023px',
        desktop: '1024px+'
      }
    },
    
    // 5. Need to interact well with users
    userExperience: {
      feedback: 'immediate', // Immediate feedback
      loading: 'visible', // Visible loading status
      error: 'user-friendly', // User-friendly error message
      animation: 'smooth', // smooth animation
      accessibility: 'wcag-aa' // accessibility standards
    },
    
    // 6. Code specifications
    codeStandards: {
      comments: 'chinese', // Code comments are in Chinese
      console: 'chinese', // Console information uses Chinese
      codeMessages: 'english', // The prompt information in the code is in English
      autoApply: true // Modifications need to be applied automatically
    }
  },

  // Function module
  features: {
    user: {
      authentication: true, // User authentication
      profile: true, // User profile
      orders: true, // Order management
      favorites: true, // Collection function
      address: true, // Address management
      wallet: true // Wallet function
    },
    merchant: {
      browse: true, // Browse businesses
      search: true, // Search for a business
      filter: true, // Filter function
      reviews: true, // Evaluation system
      contact: true // Contact the merchant
    },
    interaction: {
      chat: true, // Chat function
      notifications: true, // Notification system
      feedback: true, // feedback system
      sharing: true // Share function
    }
  },

  // Environment configuration
  environments: {
    development: {
      api: 'http://localhost:3000',
      debug: true
    },
    staging: {
      api: 'https://staging-api.example.com',
      debug: false
    },
    production: {
      api: 'https://api.example.com',
      debug: false
    }
  }
}

// Export type definition
export type ProjectConfig = typeof PROJECT_CONFIG
export type ProjectRules = typeof PROJECT_CONFIG.rules
export type ProjectFeatures = typeof PROJECT_CONFIG.features 