class AudioManager {
  constructor() {
    this.audio = null;
    this.isPlaying = false;
    this.hasUserInteracted = false;
    this.isInitialized = false;
    this.isMobile = this.detectMobile();
  }

  detectMobile() {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
           (navigator.maxTouchPoints && navigator.maxTouchPoints > 2) ||
           window.innerWidth <= 768;
  }

  init() {
    // Always create a fresh audio element for each page load
    this.audio = new Audio('/sounds/JingleBells.mp3');
    this.audio.loop = false; // No looping - play only once
    this.audio.volume = 0.9;
    this.audio.preload = 'metadata';
    
    // Mobile-specific settings for autoplay
    if (this.isMobile) {
      this.audio.setAttribute('playsinline', 'true');
      this.audio.setAttribute('webkit-playsinline', 'true');
      // Don't auto-play on mobile - require user interaction
      this.isInitialized = true;
      return;
    }
    
    // Desktop: Initialize audio and attempt to play
    this.isInitialized = true;
    
    // Try multiple strategies to play audio on desktop
    this.playAudioWithRetry();
  }

  // New method to handle audio playback with better error handling
  async playAudioWithRetry() {
    if (!this.audio) return;
    
    // Strategy 1: Try to play unmuted audio immediately
    try {
      await this.audio.play();
      this.isPlaying = true;
      this.hasUserInteracted = true;
      console.log('Audio playing successfully (unmuted)');
      return;
    } catch (error) {
      console.log('Unmuted audio failed, trying muted approach:', error);
    }
    
    // Strategy 2: Try to play with muted audio first (often allowed)
    try {
      const wasMuted = this.audio.muted;
      this.audio.muted = true;
      await this.audio.play();
      this.isPlaying = true;
      console.log('Audio playing (muted)');
      
      // Unmute after a short delay or on first user interaction
      const unmuteAudio = () => {
        this.audio.muted = false;
        this.hasUserInteracted = true;
        document.removeEventListener('click', unmuteAudio);
        document.removeEventListener('touchstart', unmuteAudio);
        document.removeEventListener('keydown', unmuteAudio);
        console.log('Audio unmuted after user interaction');
      };
      
      // Wait 1 second and try to unmute
      setTimeout(() => {
        try {
          this.audio.muted = false;
        } catch (e) {
          // If unmuting fails silently, wait for user interaction
          document.addEventListener('click', unmuteAudio, { once: true });
          document.addEventListener('touchstart', unmuteAudio, { once: true });
          document.addEventListener('keydown', unmuteAudio, { once: true });
        }
      }, 1000);
      
      return;
    } catch (error) {
      console.log('Muted audio also failed:', error);
    }
    
    // Strategy 3: Fallback - wait for user interaction
    this.isPlaying = false;
    const enableAudio = () => {
      this.audio.muted = false;
      this.audio.play().then(() => {
        this.isPlaying = true;
        this.hasUserInteracted = true;
        console.log('Audio enabled after user interaction');
      }).catch((err) => {
        console.log('Audio still failed after user interaction:', err);
      });
      document.removeEventListener('click', enableAudio);
      document.removeEventListener('touchstart', enableAudio);
      document.removeEventListener('keydown', enableAudio);
    };
    
    document.addEventListener('click', enableAudio, { once: true });
    document.addEventListener('touchstart', enableAudio, { once: true });
    document.addEventListener('keydown', enableAudio, { once: true });
  }


  async play() {
    if (!this.audio) return;
    
    try {
      // Try to play audio
      await this.audio.play();
      this.isPlaying = true;
    } catch (error) {
      console.log('Audio play failed:', error);
      this.isPlaying = false;
      
      // If audio failed to play, try the more aggressive fallback strategies
      try {
        // Strategy 1: Try again after short delay
        setTimeout(() => {
          this.audio.play().catch(() => {
            // Strategy 2: Try with muted first then unmute
            this.audio.muted = true;
            this.audio.play().then(() => {
              this.audio.muted = false;
              this.isPlaying = true;
            }).catch(() => {
              // Strategy 3: Try with very low volume
              this.audio.volume = 0.01;
              this.audio.play().then(() => {
                this.audio.volume = 0.5;
                this.isPlaying = true;
              }).catch(() => {
                console.log('All audio playback strategies failed');
              });
            });
          });
        }, 100);
      } catch (fallbackError) {
        console.log('Fallback strategies also failed:', fallbackError);
      }
    }
  }

  pause() {
    if (!this.audio) return;
    
    this.audio.pause();
    this.isPlaying = false;
  }

  stop() {
    if (!this.audio) return;
    
    this.audio.pause();
    this.audio.currentTime = 0;
    this.isPlaying = false;
  }


  isAudioPlaying() {
    return this.isPlaying && this.audio && !this.audio.paused;
  }

  getAudioElement() {
    return this.audio;
  }

  // Method to enable audio on mobile devices after user interaction
  enableAudioOnMobile() {
    if (this.isMobile && !this.hasUserInteracted) {
      this.hasUserInteracted = true;
      this.isPlaying = true;
      this.play();
    }
  }

  // Method to check if audio is available for mobile
  isAudioAvailableOnMobile() {
    return this.isMobile && this.isInitialized;
  }

  // Cleanup method
  destroy() {
    if (this.audio) {
      this.audio.pause();
      this.audio.currentTime = 0;
    }
    this.isPlaying = false;
  }
}

// Create a singleton instance
const audioManager = new AudioManager();

// Audio will play in the background - no visibility change handling needed

// Handle page unload - no need to save state since we want fresh play each time

export default audioManager;

