// Work quality rating system
export interface ArtworkRating {
  level: string
  name: string
  color: string
  borderColor: string
  glowColor: string
  backgroundColor: string
  minLikes: number
  maxLikes?: number
  hasSpecialEffect: boolean
  icon?: string
}

// Rating configuration
export const ARTWORK_RATINGS: ArtworkRating[] = [
  {
    level: 'common',
    name: 'usually',
    color: '#8c8c8c',
    borderColor: '#d9d9d9',
    glowColor: 'rgba(217, 217, 217, 0.3)',
    backgroundColor: '#fafafa',
    minLikes: 0,
    maxLikes: 999,
    hasSpecialEffect: false
  },
  {
    level: 'rare',
    name: 'Excellent',
    color: '#1890ff',
    borderColor: '#1890ff',
    glowColor: 'rgba(24, 144, 255, 0.3)',
    backgroundColor: '#f0f9ff',
    minLikes: 1000,
    maxLikes: 9999,
    hasSpecialEffect: false,
    icon: '💎'
  },
  {
    level: 'epic',
    name: 'epic',
    color: '#722ed1',
    borderColor: '#722ed1',
    glowColor: 'rgba(114, 46, 209, 0.4)',
    backgroundColor: '#f9f0ff',
    minLikes: 10000,
    maxLikes: 99999,
    hasSpecialEffect: true,
    icon: '🔮'
  },
  {
    level: 'legendary',
    name: 'legend',
    color: '#faad14',
    borderColor: '#faad14',
    glowColor: 'rgba(250, 173, 20, 0.5)',
    backgroundColor: '#fffbe6',
    minLikes: 100000,
    maxLikes: 999999,
    hasSpecialEffect: true,
    icon: '👑'
  },
  {
    level: 'mythic',
    name: 'myth',
    color: '#ff4d4f',
    borderColor: '#ff4d4f',
    glowColor: 'rgba(255, 77, 79, 0.6)',
    backgroundColor: '#fff1f0',
    minLikes: 1000000,
    maxLikes: 9999999,
    hasSpecialEffect: true,
    icon: '🌟'
  },
  {
    level: 'divine',
    name: 'sacred',
    color: 'linear-gradient(45deg, #ff6b6b, #4ecdc4, #45b7d1, #96ceb4, #ffeaa7)',
    borderColor: 'linear-gradient(45deg, #ff6b6b, #4ecdc4, #45b7d1, #96ceb4, #ffeaa7)',
    glowColor: 'rgba(255, 107, 107, 0.8)',
    backgroundColor: 'linear-gradient(45deg, rgba(255,107,107,0.1), rgba(78,205,196,0.1), rgba(69,183,209,0.1))',
    minLikes: 10000000,
    hasSpecialEffect: true,
    icon: '✨'
  }
]

// Rating tools
export class ArtworkRatingUtils {
  /**
   * Get a work rating based on the number of likes
   */
  static getRating(likes: number): ArtworkRating {
    for (const rating of ARTWORK_RATINGS) {
      if (likes >= rating.minLikes && (!rating.maxLikes || likes <= rating.maxLikes)) {
        return rating
      }
    }
    return ARTWORK_RATINGS[0] // Return to normal level by default
  }

  /**
   * Get rating based on number of likes
   */
  static getRatingLevel(likes: number): string {
    return ArtworkRatingUtils.getRating(likes).level
  }

  /**
   * Get the rating name based on the number of likes
   */
  static getRatingName(likes: number): string {
    return ArtworkRatingUtils.getRating(likes).name
  }

  /**
   * Get the border color based on the number of likes
   */
  static getBorderColor(likes: number): string {
    return ArtworkRatingUtils.getRating(likes).borderColor
  }

  /**
   * Get the glow color based on the number of likes
   */
  static getGlowColor(likes: number): string {
    return ArtworkRatingUtils.getRating(likes).glowColor
  }

  /**
   * Determine whether there are special effects based on the number of likes
   */
  static hasSpecialEffect(likes: number): boolean {
    return ArtworkRatingUtils.getRating(likes).hasSpecialEffect
  }

  /**
   * Get icon based on number of likes
   */
  static getIcon(likes: number): string | undefined {
    return ArtworkRatingUtils.getRating(likes).icon
  }

  /**
   * Formatted like count display
   */
  static formatLikes(likes: number): string {
    if (likes >= 10000000) {
      return (likes / 10000000).toFixed(1) + 'Ten million'
    } else if (likes >= 1000000) {
      return (likes / 1000000).toFixed(1) + 'million'
    } else if (likes >= 10000) {
      return (likes / 10000).toFixed(1) + 'Ten thousand'
    } else if (likes >= 1000) {
      return (likes / 1000).toFixed(1) + 'k'
    }
    return likes.toString()
  }

  /**
   * Get the number of likes required for the next level
   */
  static getNextLevelLikes(likes: number) {
    const currentRating = ArtworkRatingUtils.getRating(likes)
    const currentIndex = ARTWORK_RATINGS.indexOf(currentRating)
    
    if (currentIndex === ARTWORK_RATINGS.length - 1) {
      return null // Already the highest level
    }
    
    const nextRating = ARTWORK_RATINGS[currentIndex + 1]
    return nextRating.minLikes
  }

  /**
   * Get level progress percentage
   */
  static getLevelProgress(likes: number): number {
    const currentRating = ArtworkRatingUtils.getRating(likes)
    const nextLevelLikes = ArtworkRatingUtils.getNextLevelLikes(likes)
    
    if (!nextLevelLikes) return 100 // Already the highest level
    
    const progress = ((likes - currentRating.minLikes) / (nextLevelLikes - currentRating.minLikes)) * 100
    return Math.min(100, Math.max(0, progress))
  }
} 