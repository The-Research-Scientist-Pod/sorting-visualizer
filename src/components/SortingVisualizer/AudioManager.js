// AudioManager.js

export default class AudioManager {
    constructor() {
        this.audioContext = null;
        this.isEnabled = false;
        this.maxFreq = 1000;
        this.minFreq = 200;
        this.soundType = 'electronic'; // 'electronic' or 'ambient'
    }

    initialize() {
        if (!this.audioContext) {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            this.isEnabled = true;
        }
    }

    toggleSound() {
        this.isEnabled = !this.isEnabled;
        return this.isEnabled;
    }

    calculateFrequency(value, arraySize) {
        // Validate inputs
        if (!Number.isFinite(value) || !Number.isFinite(arraySize) || arraySize <= 0) {
            return this.minFreq;
        }

        // Ensure value is within bounds
        const normalizedValue = Math.max(1, Math.min(value, arraySize));

        // Calculate frequency with validated values
        const frequency = this.minFreq + ((normalizedValue - 1) / (arraySize - 1)) * (this.maxFreq - this.minFreq);

        // Ensure we return a valid frequency
        return Number.isFinite(frequency) ? frequency : this.minFreq;
    }

    playNote(value, arraySize, type = 'compare') {
        if (!this.isEnabled || !this.audioContext) return;

        try {
            const oscillator = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();
            const frequency = this.calculateFrequency(value, arraySize);

            if (this.soundType === 'electronic') {
                // Electronic sound profile
                oscillator.frequency.setValueAtTime(frequency, this.audioContext.currentTime);
                
                if (type === 'compare') {
                    oscillator.type = 'sine';
                    gainNode.gain.setValueAtTime(0.1, this.audioContext.currentTime);
                    gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.1);
                } else if (type === 'swap') {
                    oscillator.type = 'triangle';
                    gainNode.gain.setValueAtTime(0.2, this.audioContext.currentTime);
                    gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.15);
                }
            } else {
                // Ambient sound profile
                const baseFreq = frequency * 0.5;
                oscillator.frequency.setValueAtTime(baseFreq, this.audioContext.currentTime);
                
                if (type === 'compare') {
                    oscillator.type = 'sine';
                    gainNode.gain.setValueAtTime(0.05, this.audioContext.currentTime);
                    gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.3);
                    oscillator.frequency.exponentialRampToValueAtTime(
                        baseFreq * 1.02, 
                        this.audioContext.currentTime + 0.3
                    );
                } else if (type === 'swap') {
                    oscillator.type = 'sine';
                    gainNode.gain.setValueAtTime(0.1, this.audioContext.currentTime);
                    gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.4);
                    oscillator.frequency.exponentialRampToValueAtTime(
                        baseFreq * 1.5, 
                        this.audioContext.currentTime + 0.4
                    );
                }
            }

            oscillator.connect(gainNode);
            gainNode.connect(this.audioContext.destination);

            oscillator.start();
            oscillator.stop(this.audioContext.currentTime + 
                (this.soundType === 'electronic' ? 
                    (type === 'compare' ? 0.1 : 0.15) : 
                    (type === 'compare' ? 0.3 : 0.4)
                )
            );

        } catch (error) {
            console.error('Error playing note:', error);
            // Fail silently - don't break the sorting visualization if audio fails
        }
    }

    setSoundType(type) {
        this.soundType = type;
    }

    playCompletion() {
        if (!this.isEnabled || !this.audioContext) return;

        try {
            const oscillator = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();

            if (this.soundType === 'electronic') {
                oscillator.type = 'sine';
                oscillator.frequency.setValueAtTime(440, this.audioContext.currentTime);
                oscillator.frequency.exponentialRampToValueAtTime(880, this.audioContext.currentTime + 0.2);
                gainNode.gain.setValueAtTime(0.3, this.audioContext.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.3);
                oscillator.start();
                oscillator.stop(this.audioContext.currentTime + 0.3);
            } else {
                // Ambient completion sound
                oscillator.type = 'sine';
                oscillator.frequency.setValueAtTime(220, this.audioContext.currentTime);
                oscillator.frequency.exponentialRampToValueAtTime(440, this.audioContext.currentTime + 0.5);
                
                gainNode.gain.setValueAtTime(0.1, this.audioContext.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.2, this.audioContext.currentTime + 0.3);
                gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.8);
                
                oscillator.start();
                oscillator.stop(this.audioContext.currentTime + 0.8);
            }

            oscillator.connect(gainNode);
            gainNode.connect(this.audioContext.destination);

        } catch (error) {
            console.error('Error playing completion sound:', error);
            // Fail silently - don't break the sorting visualization if audio fails
        }
    }
}
