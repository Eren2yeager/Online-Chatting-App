/**
 * Silent Mode / Do Not Disturb Service
 * Allows users to temporarily silence all notifications
 */

class SilentModeService {
  constructor() {
    this.enabled = false;
    this.initialized = false;
    
    // Load preference from localStorage first (for immediate UI)
    this.loadPreference();
    
    // Then load from server (will override localStorage if different)
    this.initialize();
  }

  /**
   * Initialize by loading from server
   */
  async initialize() {
    if (this.initialized) return;
    this.initialized = true;
    await this.loadFromServer();
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
   * @param {boolean} syncToServer - Whether to sync to server
   */
  async enable(syncToServer = true) {
    this.enabled = true;
    this.savePreference();
    this.notifyListeners();
    
    if (syncToServer) {
      await this.syncToServer();
    }
  }

  /**
   * Disable silent mode
   * @param {boolean} syncToServer - Whether to sync to server
   */
  async disable(syncToServer = true) {
    this.enabled = false;
    this.savePreference();
    this.notifyListeners();
    
    if (syncToServer) {
      await this.syncToServer();
    }
  }

  /**
   * Toggle silent mode
   * @param {boolean} syncToServer - Whether to sync to server
   * @returns {boolean} New enabled state
   */
  async toggle(syncToServer = true) {
    this.enabled = !this.enabled;
    this.savePreference();
    this.notifyListeners();
    
    if (syncToServer) {
      await this.syncToServer();
    }
    
    return this.enabled;
  }

  /**
   * Sync silent mode to server settings
   */
  async syncToServer() {
    if (typeof window === 'undefined') return;
    
    try {
      // Fetch current settings
      const response = await fetch('/api/settings');
      const data = await response.json();
      
      if (data.success) {
        // Update with new silent mode value
        await fetch('/api/settings', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...data.data,
            silentMode: this.enabled,
          }),
        });
      }
    } catch (error) {
      console.error('Error syncing silent mode to server:', error);
    }
  }

  /**
   * Load silent mode from server settings
   */
  async loadFromServer() {
    if (typeof window === 'undefined') return;
    
    try {
      const response = await fetch('/api/settings');
      const data = await response.json();
      
      if (data.success && data.data) {
        this.enabled = data.data.silentMode || false;
        this.savePreference();
        this.notifyListeners();
      }
    } catch (error) {
      console.error('Error loading silent mode from server:', error);
    }
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
