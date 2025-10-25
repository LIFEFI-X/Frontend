<script lang="ts" setup>
import { ref } from 'vue'
import { message } from 'ant-design-vue'
import SvgIcon from './SvgIcon.vue'

// Responsive data
const email = ref('')

// Handle email subscriptions
const handleSubmit = () => {
  if (!email.value) {
    message.warning('Please enter your email address')
    return
  }
  
  if (!isValidEmail(email.value)) {
    message.error('Please enter a valid email address')
    return
  }
  
  // Here you can call the API to process email subscriptions
  message.success('Successfully subscribed to our newsletter!')
  email.value = ''
}

// Email format verification
const isValidEmail = (email: string) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

// Handle keyboard events
const handleKeyPress = (event: KeyboardEvent) => {
  if (event.key === 'Enter') {
    handleSubmit()
  }
}
</script>

<template>
  <footer class="footer-wrapper">
    <div class="footer-content">
      <!-- top content area -->
      <div class="footer-top">
        <!-- Left section: Email subscriptions and social media -->
        <div class="left-section">
          <!-- Stay in the loop part -->
          <div class="newsletter-section">
            <h3 class="section-title">STAY IN THE LOOP</h3>
            <p class="section-description">Join our mailing list to stay in the loop with our feature releases</p>
            <div class="email-form">
              <input 
                type="email" 
                placeholder="Your email address"
                v-model="email"
                @keypress="handleKeyPress"
                class="email-input"
              />
              <div class="submit-btn">
                →
              </div>
            </div>
          </div>

          <!-- social media area -->
          <div class="community-section-inline">
            <h3 class="section-title">JOIN THE COMMUNITY</h3>
            <div class="social-icons">
              <a href="#" class="social-link" title="Discord">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.211.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.010c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
            </svg>
          </a>
          <a href="#" class="social-link" title="Facebook">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
            </svg>
          </a>
          <a href="#" class="social-link" title="Instagram">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
            </svg>
          </a>
          <a href="#" class="social-link" title="YouTube">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
            </svg>
          </a>
          <a href="#" class="social-link" title="Telegram">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z"/>
            </svg>
          </a>
          <a href="#" class="social-link" title="Twitter">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
              <path d="M23.953 4.57a10 10 0 01-2.825.775 4.958 4.958 0 002.163-2.723c-.951.555-2.005.959-3.127 1.184a4.92 4.92 0 00-8.384 4.482C7.69 8.095 4.067 6.13 1.64 3.162a4.822 4.822 0 00-.666 2.475c0 1.71.87 3.213 2.188 4.096a4.904 4.904 0 01-2.228-.616v.06a4.923 4.923 0 003.946 4.827 4.996 4.996 0 01-2.212.085 4.936 4.936 0 004.604 3.417 9.867 9.867 0 01-6.102 2.105c-.39 0-.779-.023-1.17-.067a13.995 13.995 0 007.557 2.209c9.053 0 13.998-7.496 13.998-13.985 0-.21 0-.42-.015-.63A9.935 9.935 0 0024 4.59z"/>
            </svg>
              </a>
            </div>
          </div>
        </div>

        <!-- Navigation link area -->
        <div class="footer-nav">
          <!-- Explore section -->
          <div class="nav-column">
            <h3 class="nav-title">EXPLORE</h3>
            <div class="nav-links">
              <!-- <a href="#" class="nav-link">ART</a>
              <a href="#" class="nav-link">PHOTOGRAPHY</a>
              <a href="#" class="nav-link">MUSIC</a>
              <a href="#" class="nav-link">VIDEO</a>
              <a href="#" class="nav-link">3D</a>
              <a href="#" class="nav-link">VR</a> -->
              <a href="#" class="nav-link">COLLECTIONS</a>
              <a href="#" class="nav-link">CREATORS</a>
            </div>
          </div>

          <!-- Resources section -->
          <div class="nav-column">
            <h3 class="nav-title">RESOURCES</h3>
            <div class="nav-links">
              <a href="#" class="nav-link">ABOUT LIFELI</a>
              <a href="#" class="nav-link">LEARN</a>
              <a href="#" class="nav-link">HELP CENTER</a>
              <a href="#" class="nav-link">BLOG</a>
            </div>
            <!-- Stats subsection -->
            <h3 class="nav-title" style="margin-top: 24px;">STATS</h3>
            <div class="nav-links">
              <a href="#" class="nav-link">RANKING</a>
              <a href="#" class="nav-link">ACTIVITIES</a>
            </div>
          </div>

          <!-- Profile section -->
          <div class="nav-column">
            <h3 class="nav-title">PROFILE</h3>
            <div class="nav-links">
              <a href="#" class="nav-link">PROFILE</a>
              <a href="#" class="nav-link">FAVORITES</a>
              <a href="#" class="nav-link">WATCHLIST</a>
              <a href="#" class="nav-link">MY COLLECTIONS</a>
              <a href="#" class="nav-link">ACTIVITIES</a>
              <a href="#" class="nav-link">CREATE</a>
              <a href="#" class="nav-link">EARNINGS</a>
              <a href="#" class="nav-link">SETTINGS</a>
            </div>
          </div>
        </div>
      </div>
      <!-- Copyright area at the bottom -->
      <div class="footer-bottom">
        <div class="copyright"> LiFEFi Inc.</div>
        <div class="footer-links">
          <a href="#" class="footer-link">Terms</a>
          <a href="#" class="footer-link">Privacy Policy</a>
        </div>
      </div>
    </div>
  </footer>
</template>

<style lang="scss" scoped>
.footer-wrapper {
  background: #000000;
  color: #ffffff;
  padding: 80px 0 40px;
  
  .footer-content {
    margin: 0 auto;
    padding: 0 40px;
    
    @media (max-width: 768px) {
      padding: 0 20px;
    }
  }
}

.footer-top {
  display: grid;
  grid-template-columns: 1fr 3fr;
  gap: 80px;
  margin-bottom: 60px;
  
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    gap: 40px;
    margin-bottom: 40px;
  }
}

.left-section {
  display: flex;
  flex-direction: column;
  gap: 40px;
}

.community-section-inline {
  .section-title {
    font-family: 'Urbanist', sans-serif;
    font-weight: 700;
    font-size: 18px;
    letter-spacing: 0.5px;
    color: #ffffff;
    margin: 0 0 24px 0;
    text-transform: uppercase;
  }
  
  .social-icons {
    display: flex;
    gap: 16px;
    flex-wrap: wrap;
    
    .social-link {
      width: 48px;
      height: 48px;
      background: #222222;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #999999;
      transition: all 0.3s ease;
      
      &:hover {
        background: #333333;
        color: #ffffff;
        transform: translateY(-2px);
      }
      
      svg {
        width: 20px;
        height: 20px;
      }
    }
  }
}

.newsletter-section {
  .section-title {
    font-family: 'Urbanist', sans-serif;
    font-weight: 700;
    font-size: 18px;
    letter-spacing: 0.5px;
    color: #ffffff;
    margin: 0 0 16px 0;
    text-transform: uppercase;
  }
  
  .section-description {
    font-family: 'Urbanist', sans-serif;
    font-weight: 400;
    font-size: 14px;
    line-height: 1.5;
    color: #999999;
    margin: 0 0 32px 0;
    max-width: 320px;
  }
  
  .email-form {
    display: flex;
    background: #222222;
    border-radius: 50px;
    padding: 4px;
    max-width: 400px;
    
    .email-input {
      flex: 1;
      background: transparent;
      border: none;
      outline: none;
      color: #ffffff;
      font-family: 'Urbanist', sans-serif;
      font-size: 14px;
      padding: 16px 20px;
      
      &::placeholder {
        color: #666666;
      }
    }
    
    .submit-btn {

      width: 48px;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: all 0.3s ease;
      font-size: 18px;
      font-weight: bold;
      
      &:hover {
    
        transform: translateX(2px);
      }
    }
  }
}



.footer-nav {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 40px;
  
  @media (max-width: 1024px) {
    grid-template-columns: repeat(2, 1fr);
    gap: 30px;
  }
  
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    gap: 24px;
    margin-top: 30px;
  }
}

.nav-column {
  .nav-title {
    font-family: 'Urbanist', sans-serif;
    font-weight: 700;
    font-size: 16px;
    letter-spacing: 0.5px;
    color: #ffffff;
    margin: 0 0 24px 0;
    text-transform: uppercase;
  }
  
  .nav-links {
    display: flex;
    flex-direction: column;
    gap: 12px;
    
    .nav-link {
      font-family: 'Urbanist', sans-serif;
      font-weight: 400;
      font-size: 14px;
      color: #999999;
      text-decoration: none;
      transition: color 0.3s ease;
      
      &:hover {
        color: #ffffff;
      }
    }
  }
}

.footer-bottom {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 40px;
  border-top: 1px solid #333333;
  
  @media (max-width: 768px) {
    flex-direction: column;
    gap: 16px;
    text-align: center;
  }
  
  .copyright {
    font-family: 'Urbanist', sans-serif;
    font-weight: 400;
    font-size: 14px;
    color: #666666;
  }
  
  .footer-links {
    display: flex;
    gap: 32px;
    
    @media (max-width: 768px) {
      gap: 24px;
    }
    
    .footer-link {
      font-family: 'Urbanist', sans-serif;
      font-weight: 400;
      font-size: 14px;
      color: #666666;
      text-decoration: none;
      transition: color 0.3s ease;
      
      &:hover {
        color: #ffffff;
      }
    }
  }
}

// Responsive optimization
@media (max-width: 480px) {
  .footer-wrapper {
    padding: 60px 0 30px;
  }
  
  .footer-top {
    margin-bottom: 40px;
  }
  
  .community-section {
    margin-bottom: 40px;
  }
  
  .newsletter-section {
    .email-form {
      .email-input {
        padding: 14px 16px;
        font-size: 13px;
      }
      
      .submit-btn {
        width: 44px;
        height: 44px;
        font-size: 16px;
      }
    }
  }
  
  .community-section {
    .social-icons {
      justify-content: center;
      
      .social-link {
        width: 44px;
        height: 44px;
        
        svg {
          width: 18px;
          height: 18px;
        }
      }
    }
  }
  

  
  .footer-bottom {
    padding-top: 30px;
    
    .footer-links {
      gap: 16px;
    }
  }
}
</style>
