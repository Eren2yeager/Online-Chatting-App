/**
 * Silent Mode / Do Not Disturb Service
 * Allows users to temporarily silence all notifications
 */

class SilentModeService {
  constructor() {
    this.enabled = false;
    
    // Load preference from localStorage
    this.loadPreference();
  }

  /**
   * Load silent mode preference from localStorage
   */
  loadPreference() {
    // Only run in browser
    if (typeof window === 'undefined') return;
    
    try {
      const enabled = localStorage.getItem('silent-mode-enabled');
      
      if (enabled !== null) {
        this.enabled = enabled === 'true';
      }
    } catch (error) {
      console.error('Error loading silent mode preference:', error);
    }
  }

  /**
   * Save silent mode preference to localStorage
   */
  savePreference() {
    // Only run in browser
    if (typeof window === 'undefined') return;
    
    try {
      localStorage.setItem('silent-mode-enabled', this.enabled.toString());
    } catch (error) {
      console.error('Error saving silent mode preference:', error);
    }
  }

  /**
   * Enable silent mode
   */
  enable() {
    this.enabled = true;
    this.savePreference();
    this.notifyListeners();
  }

  /**
   * Disable silent mode
   */
  disable() {
    this.enabled = false;
    this.savePreference();
    this.notifyListeners();
  }

  /**
   * Toggle silent mode
   * @returns {boolean} New enabled state
   */
  toggle() {
    this.enabled = !this.enabled;
    this.savePreference();
    this.notifyListeners();
    return this.enabled;
  }

  /**
   * Check if silent mode is enabled
   * @returns {boolean}
   */
  isEnabled() {
    return this.enabled;
  }

  /**
   * Check if notifications should be silenced
   * @returns {boolean}
   */
  shouldSilence() {
    return this.enabled;
  }

  /**
   * Listeners for silent mode changes
   */
  listeners = new Set();

  /**
   * Add listener for silent mode changes
   * @param {Function} callback - Callback function
   * @returns {Function} Cleanup function
   */
  addListener(callback) {
    this.listeners.add(callback);
    return () => this.listeners.delete(callback);
  }

  /**
   * Notify all listeners of state change
   */
  notifyListeners() {
    this.listeners.forEach(callback => {
      try {
        callback(this.enabled);
      } catch (error) {
        console.error('Error in silent mode listener:', error);
      }
    });
  }
}

// Create singleton instance
const silentMode = new SilentModeService();

export default silentMode;
