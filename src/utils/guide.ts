import Shepherd from 'shepherd.js'
import 'shepherd.js/dist/css/shepherd.css'
import { Modal } from 'ant-design-vue'

export class GuideManager {
  private tour: Shepherd.Tour | null = null

  constructor() {
    this.initTour()
  }

  private initTour() {
    this.tour = new Shepherd.Tour({
      useModalOverlay: true,
      defaultStepOptions: {
        classes: 'gallery-guide-step',
        scrollTo: { behavior: 'smooth', block: 'center' },
        cancelIcon: {
          enabled: true,
        },
        modalOverlayOpeningPadding: 8,
        modalOverlayOpeningRadius: 8,
        when: {
          cancel: () => {
            this.showCancelConfirm()
            return false // Prevent default shutdown behavior
          }
        }
      }
    })

    // Step 1: Introducing the search box
    this.tour.addStep({
      title: '🔍 Search function',
      text: `
        <div class="guide-content">
          <p>Here is the search box where you can:</p>
          <ul>
            <li>• Search for artwork you like</li>
            <li>• Enter keywords to find relevant content</li>
            <li>• Support Chinese and English search</li>
          </ul>
        </div>
      `,
      attachTo: {
        element: '.search-input',
        on: 'bottom'
      },
      buttons: [
        {
          text: 'Skip boot',
          classes: 'btn-secondary',
          action: () => {
            this.showCancelConfirm()
          }
        },
        {
          text: 'Next step',
          classes: 'btn-primary',
          action: () => {
            this.tour?.next()
          }
        }
      ]
    })

    // Step 2: Introduction to Menu Navigation
    this.tour.addStep({
      title: '🧭 Menu navigation',
      text: `
        <div class="guide-content">
          <p>This is the main function menu, including:</p>
          <ul>
            <li>• <strong>Favorites</strong> - View your collection of works and artists</li>
            <li>• <strong>Ranking list</strong> - View the ranking of popular works</li>
            <li>• <strong>Featured</strong> - High-quality works recommended by editors</li>
            <li>• <strong>Bounty</strong> - Participate in bounties and earn rewards</li>
            <li>• <strong>Tutorial</strong> - Learn creative skills</li>
            <li>• <strong>artist</strong> - Discover great creators</li>
          </ul>
        </div>
      `,
      attachTo: {
        element: '.gallery-menu',
        on: 'bottom'
      },
      buttons: [
        {
          text: 'Skip boot',
          classes: 'btn-secondary',
          action: () => {
            this.showCancelConfirm()
          }
        },
        {
          text: 'Previous step',
          classes: 'btn-secondary',
          action: () => {
            this.tour?.back()
          }
        },
        {
          text: 'Next step',
          classes: 'btn-primary',
          action: () => {
            this.tour?.next()
          }
        }
      ]
    })

    // Step 3: Introduction to AI Chatbot
    this.tour.addStep({
      title: '🤖 AIchat assistant',
      text: `
        <div class="guide-content">
          <p>lower right cornerAIThe assistant can help you:</p>
          <ul>
            <li>• Answer questions about using the platform</li>
            <li>• Provide creative inspiration and advice</li>
            <li>• Assist in uploading and managing works</li>
            <li>• Recommend related artists and works</li>
          </ul>
          <p class="guide-tip">💡 If you have any questions, you can consult at any timeAIassistant!</p>
        </div>
      `,
      attachTo: {
        element: '.ai-chatbot-wrapper',
        on: 'left'
      },
      buttons: [
        {
          text: 'Skip boot',
          classes: 'btn-secondary',
          action: () => {
            this.showCancelConfirm()
          }
        },
        {
          text: 'Previous step',
          classes: 'btn-secondary',
          action: () => {
            this.tour?.back()
          }
        },
        {
          text: 'Next step',
          classes: 'btn-primary',
          action: () => {
            this.tour?.next()
          }
        }
      ]
    })

    // Step 4: Introduction to the work display area
    this.tour.addStep({
      title: '🎨 Work display',
      text: `
        <div class="guide-content">
          <p>Here are all the artworks:</p>
          <ul>
            <li>• Hover the mouse to see the action button</li>
            <li>• ❤️ Click the heart to collect your favorite works</li>
            <li>• 👁️ Click on the eye to see details of the work</li>
            <li>• Click on the work to view a larger image</li>
            <li>• Click on the artist's profile picture to view their homepage</li>
          </ul>
          <p class="guide-tip">💡 The more you interact, the more excellent works you can discover!</p>
        </div>
      `,
      attachTo: {
        element: '.artworks-section',
        on: 'top'
      },
      buttons: [
        {
          text: 'Previous step',
          classes: 'btn-secondary',
          action: () => {
            this.tour?.back()
          }
        },
        {
          text: 'Complete boot',
          classes: 'btn-success',
          action: () => {
            this.completeTour()
          }
        }
      ]
    })
  }

  // Start booting
  public startGuide() {
    if (this.tour) {
      this.tour.start()
    }
  }

  // Complete boot
  private completeTour() {
    if (this.tour) {
      this.tour.complete()
      // Saves the state that the user has completed booting
      localStorage.setItem('gallery_guide_completed', 'true')
      // You can add a callback to complete the boot
      console.log('Newbie guide completed')
    }
  }

  // Check if booting is complete
  public static isGuideCompleted(): boolean {
    return localStorage.getItem('gallery_guide_completed') === 'true'
  }

  // Reset boot state (for testing)
  public static resetGuide() {
    localStorage.removeItem('gallery_guide_completed')
  }

  // Show cancel confirmation popup
  private showCancelConfirm() {
    Modal.confirm({
      title: 'Confirm to exit',
      content: 'Are you sure you want to skip onboarding?',
      okText: 'OK to skip',
      cancelText: 'continue booting',
      okType: 'danger',
      centered: true,
      onOk: () => {
        // User confirms skipping boot
        if (this.tour) {
          this.tour.cancel()
          localStorage.setItem('gallery_guide_completed', 'true')
        }
      },
      onCancel: () => {
        // User chooses to continue booting without taking any action
        console.log('User chooses to continue booting')
      }
    })
  }

  // Destroy boot
  public destroy() {
    if (this.tour) {
      this.tour.cancel()
      this.tour = null
    }
  }
} 