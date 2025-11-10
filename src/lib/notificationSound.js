/**
 * Notification Sound Service
 * Handles playing notification sounds with user preferences
 */

class NotificationSoundService {
  constructor() {
    this.audio = null;
    this.enabled = true;
    this.volume = 0.5;
    this.soundUrl = '/sounds/notification.mp3';
    // Fallback: Simple beep sound as data URL (if file doesn't exist)
    this.fallbackSound = 'data:audio/wav;base64,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';
    
    // Load preferences from localStorage
    this.loadPreferences();
  }

  /**
   * Load sound preferences from localStorage
   */
  loadPreferences() {
    // Only run in browser
    if (typeof window === 'undefined') return;
    
    try {
      const enabled = localStorage.getItem('notification-sound-enabled');
      const volume = localStorage.getItem('notification-sound-volume');
      
      if (enabled !== null) {
        this.enabled = enabled === 'true';
      }
      
      if (volume !== null) {
        this.volume = parseFloat(volume);
      }
    } catch (error) {
      console.error('Error loading sound preferences:', error);
    }
  }

  /**
   * Save sound preferences to localStorage
   */
  savePreferences() {
    // Only run in browser
    if (typeof window === 'undefined') return;
    
    try {
      localStorage.setItem('notification-sound-enabled', this.enabled.toString());
      localStorage.setItem('notification-sound-volume', this.volume.toString());
    } catch (error) {
      console.error('Error saving sound preferences:', error);
    }
  }

  /**
   * Initialize audio element
   */
  initAudio() {
    // Only run in browser
    if (typeof window === 'undefined') return;
    
    if (!this.audio) {
      this.audio = new Audio();
      this.audio.volume = this.volume;
      
      // Try to load custom sound, fallback to built-in beep
      this.audio.src = this.soundUrl;
      this.audio.addEventListener('error', () => {
        console.log('Custom notification sound not found, using fallback beep');
        this.audio.src = this.fallbackSound;
      });
      
      // Preload the audio
      this.audio.load();
    }
  }

  /**
   * Play notification sound
   * @param {Object} options - Sound options
   * @param {boolean} options.force - Force play even if disabled
   */
  play({ force = false } = {}) {
    // Only run in browser
    if (typeof window === 'undefined') return;
    
    if (!this.enabled && !force) {
      return;
    }

    try {
      // Initialize audio if not already done
      this.initAudio();
      
      if (!this.audio) return;
      
      // Reset audio to start
      this.audio.currentTime = 0;
      
      // Play sound
      const playPromise = this.audio.play();
      
      if (playPromise !== undefined) {
        playPromise.catch(error => {
          console.warn('Could not play notification sound:', error);
        });
      }
    } catch (error) {
      console.error('Error playing notification sound:', error);
    }
  }

  /**
   * Enable notification sounds
   */
  enable() {
    this.enabled = true;
    this.savePreferences();
  }

  /**
   * Disable notification sounds
   */
  disable() {
    this.enabled = false;
    this.savePreferences();
  }

  /**
   * Toggle notification sounds
   * @returns {boolean} New enabled state
   */
  toggle() {
    this.enabled = !this.enabled;
    this.savePreferences();
    return this.enabled;
  }

  /**
   * Set volume (0.0 to 1.0)
   * @param {number} volume - Volume level
   */
  setVolume(volume) {
    this.volume = Math.max(0, Math.min(1, volume));
    if (this.audio) {
      this.audio.volume = this.volume;
    }
    this.savePreferences();
  }

  /**
   * Get current enabled state
   * @returns {boolean}
   */
  isEnabled() {
    return this.enabled;
  }

  /**
   * Get current volume
   * @returns {number}
   */
  getVolume() {
    return this.volume;
  }
}

// Create singleton instance
const notificationSound = new NotificationSoundService();

export default notificationSound;
