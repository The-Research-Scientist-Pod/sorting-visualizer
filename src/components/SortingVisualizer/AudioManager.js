// AudioManager.js

export default class AudioManager {
    constructor() {
        this.audioContext = null;
        this.isEnabled = false;
        this.maxFreq = 1000;
        this.minFreq = 200;
        this.soundType = 'electronic'; // 'electronic', 'ambient', 'retro', 'crystal', or 'percussion'
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

        // Calculate base frequency based on array size
        const baseFreq = this.minFreq + ((normalizedValue - 1) / (arraySize - 1)) * (this.maxFreq - this.minFreq);

        // Add pitch variation based on the value
        const pitchMultiplier = 0.5 + (value / arraySize);
        const frequency = baseFreq * pitchMultiplier;

        // Clamp the final frequency between minFreq and maxFreq * 2
        const clampedFreq = Math.min(Math.max(frequency, this.minFreq), this.maxFreq * 2);

        // Ensure we return a valid frequency
        return Number.isFinite(clampedFreq) ? clampedFreq : this.minFreq;
    }

    playNote(value, arraySize, type = 'compare') { // type can be 'compare' or 'swap'
        if (!this.isEnabled || !this.audioContext) return;

        try {
            const oscillator = this.audioContext.createOscillator();
            const gainNode = this.audioContext.createGain();
            const frequency = this.calculateFrequency(value, arraySize);

            if (this.soundType === 'electronic') {
                // Electronic sound profile
                oscillator.frequency.setValueAtTime(frequency, this.audioContext.currentTime);
                
                switch (type) {
                    case 'compare':
                        oscillator.type = 'sine';
                        gainNode.gain.setValueAtTime(0.1, this.audioContext.currentTime);
                        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.1);
                        break;
                    case 'swap':
                        oscillator.type = 'triangle';
                        gainNode.gain.setValueAtTime(0.2, this.audioContext.currentTime);
                        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.15);
                        break;
                }
            } else if (this.soundType === 'ambient') {
                // Ambient sound profile
                const baseFreq = frequency * 0.5;
                oscillator.frequency.setValueAtTime(baseFreq, this.audioContext.currentTime);
                
                switch (type) {
                    case 'compare':
                        oscillator.type = 'sine';
                        gainNode.gain.setValueAtTime(0.05, this.audioContext.currentTime);
                        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.3);
                        oscillator.frequency.exponentialRampToValueAtTime(
                            baseFreq * 1.02, 
                            this.audioContext.currentTime + 0.3
                        );
                        break;
                    case 'swap':
                        oscillator.type = 'sine';
                        gainNode.gain.setValueAtTime(0.1, this.audioContext.currentTime);
                        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.4);
                        oscillator.frequency.exponentialRampToValueAtTime(
                            baseFreq * 1.5, 
                            this.audioContext.currentTime + 0.4
                        );
                        break;
                }
            } else if (this.soundType === 'retro') {
                // Retro 8-bit style sounds
                oscillator.type = 'square';
                const baseFreq = frequency * 0.25;
                
                if (type === 'compare') {
                    oscillator.frequency.setValueAtTime(baseFreq, this.audioContext.currentTime);
                    gainNode.gain.setValueAtTime(0.05, this.audioContext.currentTime);
                    gainNode.gain.linearRampToValueAtTime(0, this.audioContext.currentTime + 0.1);
                } else if (type === 'swap') {
                    oscillator.frequency.setValueAtTime(baseFreq * 2, this.audioContext.currentTime);
                    gainNode.gain.setValueAtTime(0.08, this.audioContext.currentTime);
                    gainNode.gain.linearRampToValueAtTime(0, this.audioContext.currentTime + 0.15);
                }
            } else if (this.soundType === 'crystal') {
                // Crystal-like bell sounds
                oscillator.type = 'sine';
                const modulator = this.audioContext.createOscillator();
                const modGain = this.audioContext.createGain();
                
                if (type === 'compare') {
                    oscillator.frequency.setValueAtTime(frequency * 2, this.audioContext.currentTime);
                    modulator.frequency.setValueAtTime(frequency * 0.5, this.audioContext.currentTime);
                    modGain.gain.setValueAtTime(50, this.audioContext.currentTime);
                    gainNode.gain.setValueAtTime(0.05, this.audioContext.currentTime);
                    gainNode.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + 0.2);
                } else if (type === 'swap') {
                    oscillator.frequency.setValueAtTime(frequency * 3, this.audioContext.currentTime);
                    modulator.frequency.setValueAtTime(frequency * 0.75, this.audioContext.currentTime);
                    modGain.gain.setValueAtTime(100, this.audioContext.currentTime);
                    gainNode.gain.setValueAtTime(0.08, this.audioContext.currentTime);
                    gainNode.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + 0.3);
                }
                
                modulator.connect(modGain);
                modGain.connect(oscillator.frequency);
                modulator.start();
                modulator.stop(this.audioContext.currentTime + (type === 'compare' ? 0.2 : 0.3));
            } else if (this.soundType === 'percussion') {
                // Percussion-like sounds
                const noise = this.audioContext.createBufferSource();
                const buffer = this.audioContext.createBuffer(1, this.audioContext.sampleRate * 0.1, this.audioContext.sampleRate);
                const data = buffer.getChannelData(0);
                
                for (let i = 0; i < buffer.length; i++) {
                    data[i] = Math.random() * 2 - 1;
                }
                
                noise.buffer = buffer;
                const filter = this.audioContext.createBiquadFilter();
                filter.type = 'bandpass';
                
                if (type === 'compare') {
                    filter.frequency.setValueAtTime(frequency, this.audioContext.currentTime);
                    filter.Q.value = 1;
                    gainNode.gain.setValueAtTime(0.05, this.audioContext.currentTime);
                    gainNode.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + 0.1);
                } else if (type === 'swap') {
                    filter.frequency.setValueAtTime(frequency * 1.5, this.audioContext.currentTime);
                    filter.Q.value = 2;
                    gainNode.gain.setValueAtTime(0.08, this.audioContext.currentTime);
                    gainNode.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + 0.15);
                }
                
                noise.connect(filter);
                filter.connect(gainNode);
                noise.start();
                noise.stop(this.audioContext.currentTime + (type === 'compare' ? 0.1 : 0.15));
                return; // Skip the regular oscillator connection
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

            switch (this.soundType) {
                case 'electronic':
                    oscillator.type = 'sine';
                    oscillator.frequency.setValueAtTime(440, this.audioContext.currentTime);
                    oscillator.frequency.exponentialRampToValueAtTime(880, this.audioContext.currentTime + 0.2);
                    gainNode.gain.setValueAtTime(0.3, this.audioContext.currentTime);
                    gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.3);
                    oscillator.start();
                    oscillator.stop(this.audioContext.currentTime + 0.3);
                    break;

                case 'ambient':
                    oscillator.type = 'sine';
                    oscillator.frequency.setValueAtTime(220, this.audioContext.currentTime);
                    oscillator.frequency.exponentialRampToValueAtTime(440, this.audioContext.currentTime + 0.5);
                    gainNode.gain.setValueAtTime(0.1, this.audioContext.currentTime);
                    gainNode.gain.exponentialRampToValueAtTime(0.2, this.audioContext.currentTime + 0.3);
                    gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.8);
                    oscillator.start();
                    oscillator.stop(this.audioContext.currentTime + 0.8);
                    break;

                case 'retro':
                    oscillator.type = 'square';
                    oscillator.frequency.setValueAtTime(440, this.audioContext.currentTime);
                    oscillator.frequency.setValueAtTime(880, this.audioContext.currentTime + 0.1);
                    oscillator.frequency.setValueAtTime(1320, this.audioContext.currentTime + 0.2);
                    gainNode.gain.setValueAtTime(0.2, this.audioContext.currentTime);
                    gainNode.gain.linearRampToValueAtTime(0, this.audioContext.currentTime + 0.3);
                    oscillator.start();
                    oscillator.stop(this.audioContext.currentTime + 0.3);
                    break;

                case 'crystal':
                    const modulator = this.audioContext.createOscillator();
                    const modGain = this.audioContext.createGain();
                    oscillator.type = 'sine';
                    modulator.type = 'sine';
                    
                    oscillator.frequency.setValueAtTime(880, this.audioContext.currentTime);
                    modulator.frequency.setValueAtTime(440, this.audioContext.currentTime);
                    modGain.gain.setValueAtTime(200, this.audioContext.currentTime);
                    gainNode.gain.setValueAtTime(0.2, this.audioContext.currentTime);
                    gainNode.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + 0.5);
                    
                    modulator.connect(modGain);
                    modGain.connect(oscillator.frequency);
                    modulator.start();
                    oscillator.start();
                    modulator.stop(this.audioContext.currentTime + 0.5);
                    oscillator.stop(this.audioContext.currentTime + 0.5);
                    break;

                case 'percussion':
                    const noise = this.audioContext.createBufferSource();
                    const buffer = this.audioContext.createBuffer(1, this.audioContext.sampleRate * 0.5, this.audioContext.sampleRate);
                    const data = buffer.getChannelData(0);
                    const filter = this.audioContext.createBiquadFilter();
                    
                    for (let i = 0; i < buffer.length; i++) {
                        data[i] = Math.random() * 2 - 1;
                    }
                    
                    noise.buffer = buffer;
                    filter.type = 'bandpass';
                    filter.frequency.setValueAtTime(800, this.audioContext.currentTime);
                    filter.Q.value = 5;
                    
                    gainNode.gain.setValueAtTime(0.3, this.audioContext.currentTime);
                    gainNode.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + 0.3);
                    
                    noise.connect(filter);
                    filter.connect(gainNode);
                    noise.start();
                    noise.stop(this.audioContext.currentTime + 0.3);
                    return; // Skip the regular oscillator connection
            }

            oscillator.connect(gainNode);
            gainNode.connect(this.audioContext.destination);

        } catch (error) {
            console.error('Error playing completion sound:', error);
            // Fail silently - don't break the sorting visualization if audio fails
        }
    }
}
