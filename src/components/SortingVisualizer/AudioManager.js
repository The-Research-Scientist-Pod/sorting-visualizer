// AudioManager.js

export default class AudioManager {
    constructor() {
        this.audioContext = null;
        this.isEnabled = false;
        this.maxFreq = 1000;
        this.minFreq = 200;
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
            // Create oscillator and gain nodes
            const oscillator = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();

            // Calculate frequency with validation
            const frequency = this.calculateFrequency(value, arraySize);

            // Set the frequency safely
            oscillator.frequency.setValueAtTime(frequency, this.audioContext.currentTime);

            // Set waveform type and duration based on operation
            if (type === 'compare') {
                oscillator.type = 'sine';
                gainNode.gain.setValueAtTime(0.1, this.audioContext.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.1);
            } else if (type === 'swap') {
                oscillator.type = 'triangle';
                gainNode.gain.setValueAtTime(0.2, this.audioContext.currentTime);
                gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.15);
            }

            // Connect nodes
            oscillator.connect(gainNode);
            gainNode.connect(this.audioContext.destination);

            // Play sound
            oscillator.start();
            oscillator.stop(this.audioContext.currentTime + (type === 'compare' ? 0.1 : 0.15));

        } catch (error) {
            console.error('Error playing note:', error);
            // Fail silently - don't break the sorting visualization if audio fails
        }
    }

    playCompletion() {
        if (!this.isEnabled || !this.audioContext) return;

        try {
            // Create nodes for completion sound
            const oscillator = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();

            // Set up completion sound parameters
            oscillator.type = 'sine';
            oscillator.frequency.setValueAtTime(440, this.audioContext.currentTime);
            oscillator.frequency.exponentialRampToValueAtTime(880, this.audioContext.currentTime + 0.2);

            gainNode.gain.setValueAtTime(0.3, this.audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.3);

            // Connect nodes
            oscillator.connect(gainNode);
            gainNode.connect(this.audioContext.destination);

            // Play completion sound
            oscillator.start();
            oscillator.stop(this.audioContext.currentTime + 0.3);

        } catch (error) {
            console.error('Error playing completion sound:', error);
            // Fail silently - don't break the sorting visualization if audio fails
        }
    }
}