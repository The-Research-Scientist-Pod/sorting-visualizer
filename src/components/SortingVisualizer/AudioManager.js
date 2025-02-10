export default class AudioManager {
    constructor() {
        this.audioContext = null;
        this.masterGain = null;
        this.isEnabled = false;
        this.maxFreq = 1000;
        this.minFreq = 200;
        this.soundType = 'electronic';
        this.lastNoteTime = 0;
        this.MIN_NOTE_SPACING = 0.003; // 3ms minimum between notes
        this.activeNodes = new Set();
    }

    initialize() {
        if (!this.audioContext) {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();

            // Add master gain to prevent clipping
            this.masterGain = this.audioContext.createGain();
            this.masterGain.gain.value = 0.7;
            this.masterGain.connect(this.audioContext.destination);

            this.isEnabled = true;
        }
    }

    toggleSound() {
        this.isEnabled = !this.isEnabled;
        if (!this.isEnabled) {
            this.stopAllSounds();
        }
        return this.isEnabled;
    }

    stopAllSounds() {
        const now = this.audioContext.currentTime;
        for (const node of this.activeNodes) {
            try {
                if (node.gain) {
                    node.gain.cancelScheduledValues(now);
                    node.gain.setValueAtTime(node.gain.value, now);
                    node.gain.linearRampToValueAtTime(0, now + 0.001);
                }
                setTimeout(() => {
                    try {
                        node.disconnect();
                    } catch (e) {
                        // Ignore disconnection errors
                    }
                }, 10);
            } catch (e) {
                // Ignore any cleanup errors
            }
        }
        this.activeNodes.clear();
    }

    calculateFrequency(value, arraySize) {
        if (!Number.isFinite(value) || !Number.isFinite(arraySize) || arraySize <= 0) {
            return this.minFreq;
        }

        const normalizedValue = Math.max(1, Math.min(value, arraySize));
        const baseFreq = this.minFreq + ((normalizedValue - 1) / (arraySize - 1)) * (this.maxFreq - this.minFreq);
        const pitchMultiplier = 0.5 + (value / arraySize);
        const frequency = baseFreq * pitchMultiplier;
        const clampedFreq = Math.min(Math.max(frequency, this.minFreq), this.maxFreq * 2);

        return Number.isFinite(clampedFreq) ? clampedFreq : this.minFreq;
    }

    setSoundType(type) {
        this.soundType = type;
    }

    createSmoothGain() {
        const gainNode = this.audioContext.createGain();
        gainNode.connect(this.masterGain);
        this.activeNodes.add(gainNode);
        return gainNode;
    }

    smoothStart(gainNode, initialValue, time = 0.002) {
        const now = this.audioContext.currentTime;
        gainNode.gain.cancelScheduledValues(now);
        gainNode.gain.setValueAtTime(0, now);
        gainNode.gain.linearRampToValueAtTime(initialValue, now + time);
    }

    smoothStop(gainNode, duration) {
        const now = this.audioContext.currentTime;
        gainNode.gain.linearRampToValueAtTime(0.001, now + duration);
    }

    shouldPlayNote() {
        const now = this.audioContext.currentTime;
        if (now - this.lastNoteTime < this.MIN_NOTE_SPACING) {
            return false;
        }
        this.lastNoteTime = now;
        return true;
    }

    playNote(value, arraySize, type = 'compare') {
        if (!this.isEnabled || !this.audioContext) return;
        if (!this.shouldPlayNote()) return;

        try {
            const oscillator = this.audioContext.createOscillator();
            const gainNode = this.createSmoothGain();
            const frequency = this.calculateFrequency(value, arraySize);

            this.activeNodes.add(oscillator);

            if (this.soundType === 'electronic') {
                oscillator.frequency.setValueAtTime(frequency, this.audioContext.currentTime);

                switch (type) {
                    case 'compare':
                        oscillator.type = 'sine';
                        this.smoothStart(gainNode, 0.1);
                        this.smoothStop(gainNode, 0.1);
                        break;
                    case 'swap':
                        oscillator.type = 'triangle';
                        this.smoothStart(gainNode, 0.2);
                        this.smoothStop(gainNode, 0.15);
                        break;
                    case 'highlight':
                        oscillator.type = 'sawtooth';
                        this.smoothStart(gainNode, 0.15);
                        this.smoothStop(gainNode, 0.12);
                        oscillator.frequency.setValueAtTime(frequency * 1.25, this.audioContext.currentTime);
                        break;
                }
            } else if (this.soundType === 'ambient') {
                const baseFreq = frequency * 0.5;
                oscillator.frequency.setValueAtTime(baseFreq, this.audioContext.currentTime);

                switch (type) {
                    case 'compare':
                        oscillator.type = 'sine';
                        this.smoothStart(gainNode, 0.05, 0.01);
                        this.smoothStop(gainNode, 0.3);
                        oscillator.frequency.exponentialRampToValueAtTime(
                            baseFreq * 1.02,
                            this.audioContext.currentTime + 0.3
                        );
                        break;
                    case 'swap':
                        oscillator.type = 'sine';
                        this.smoothStart(gainNode, 0.1, 0.01);
                        this.smoothStop(gainNode, 0.4);
                        oscillator.frequency.exponentialRampToValueAtTime(
                            baseFreq * 1.5,
                            this.audioContext.currentTime + 0.4
                        );
                        break;
                    case 'highlight':
                        oscillator.type = 'sine';
                        this.smoothStart(gainNode, 0.07, 0.01);
                        this.smoothStop(gainNode, 0.35);
                        oscillator.frequency.exponentialRampToValueAtTime(
                            baseFreq * 1.25,
                            this.audioContext.currentTime + 0.35
                        );
                        break;
                }
            } else if (this.soundType === 'retro') {
                oscillator.type = 'square';
                const baseFreq = frequency * 0.25;

                const filter = this.audioContext.createBiquadFilter();
                filter.type = 'lowpass';
                filter.frequency.value = baseFreq * 4;
                filter.Q.value = 1;

                this.activeNodes.add(filter);

                oscillator.connect(gainNode);
                gainNode.disconnect();
                gainNode.connect(filter);
                filter.connect(this.masterGain);

                switch (type) {
                    case 'compare':
                        oscillator.frequency.setValueAtTime(baseFreq, this.audioContext.currentTime);
                        this.smoothStart(gainNode, 0.05);
                        this.smoothStop(gainNode, 0.1);
                        break;
                    case 'swap':
                        oscillator.frequency.setValueAtTime(baseFreq * 2, this.audioContext.currentTime);
                        this.smoothStart(gainNode, 0.08);
                        this.smoothStop(gainNode, 0.15);
                        break;
                    case 'highlight':
                        oscillator.frequency.setValueAtTime(baseFreq * 1.5, this.audioContext.currentTime);
                        this.smoothStart(gainNode, 0.06);
                        this.smoothStop(gainNode, 0.12);
                        break;
                }
            } else if (this.soundType === 'crystal') {
                oscillator.type = 'sine';
                const modulator = this.audioContext.createOscillator();
                const modGain = this.audioContext.createGain();

                this.activeNodes.add(modulator);
                this.activeNodes.add(modGain);

                switch (type) {
                    case 'compare':
                        oscillator.frequency.setValueAtTime(frequency * 2, this.audioContext.currentTime);
                        modulator.frequency.setValueAtTime(frequency * 0.5, this.audioContext.currentTime);
                        modGain.gain.setValueAtTime(50, this.audioContext.currentTime);
                        this.smoothStart(gainNode, 0.05, 0.01);
                        this.smoothStop(gainNode, 0.2);
                        break;
                    case 'swap':
                        oscillator.frequency.setValueAtTime(frequency * 3, this.audioContext.currentTime);
                        modulator.frequency.setValueAtTime(frequency * 0.75, this.audioContext.currentTime);
                        modGain.gain.setValueAtTime(100, this.audioContext.currentTime);
                        this.smoothStart(gainNode, 0.08, 0.01);
                        this.smoothStop(gainNode, 0.3);
                        break;
                    case 'highlight':
                        oscillator.frequency.setValueAtTime(frequency * 2.5, this.audioContext.currentTime);
                        modulator.frequency.setValueAtTime(frequency * 0.6, this.audioContext.currentTime);
                        modGain.gain.setValueAtTime(75, this.audioContext.currentTime);
                        this.smoothStart(gainNode, 0.06, 0.01);
                        this.smoothStop(gainNode, 0.25);
                        break;
                }

                modulator.connect(modGain);
                modGain.connect(oscillator.frequency);
                modulator.start();
                modulator.stop(this.audioContext.currentTime + (type === 'compare' ? 0.2 : 0.3));

                // Clean up modulation nodes
                setTimeout(() => {
                    this.activeNodes.delete(modulator);
                    this.activeNodes.delete(modGain);
                }, (type === 'compare' ? 0.2 : 0.3) * 1000 + 100);
            }

            if (this.soundType !== 'retro') {
                oscillator.connect(gainNode);
            }

            const duration = this.soundType === 'electronic' ?
                (type === 'compare' ? 0.1 : 0.15) :
                (type === 'compare' ? 0.3 : 0.4);

            oscillator.start();
            oscillator.stop(this.audioContext.currentTime + duration);

            // Clean up after sound is finished
            setTimeout(() => {
                this.activeNodes.delete(oscillator);
                this.activeNodes.delete(gainNode);
            }, duration * 1000 + 100);

        } catch (error) {
            console.error('Error playing note:', error);
        }
    }

    playCompletion() {
        if (!this.isEnabled || !this.audioContext) return;

        try {
            const oscillator = this.audioContext.createOscillator();
            const gainNode = this.createSmoothGain();
            this.activeNodes.add(oscillator);

            switch (this.soundType) {
                case 'electronic': {
                    const duration = 0.3;
                    oscillator.type = 'sine';
                    oscillator.frequency.setValueAtTime(440, this.audioContext.currentTime);
                    oscillator.frequency.exponentialRampToValueAtTime(880, this.audioContext.currentTime + 0.2);
                    this.smoothStart(gainNode, 0.3);
                    this.smoothStop(gainNode, duration);
                    oscillator.start();
                    oscillator.stop(this.audioContext.currentTime + duration);
                    break;
                }

                case 'ambient': {
                    const duration = 0.8;
                    oscillator.type = 'sine';
                    oscillator.frequency.setValueAtTime(220, this.audioContext.currentTime);
                    oscillator.frequency.exponentialRampToValueAtTime(440, this.audioContext.currentTime + 0.5);
                    this.smoothStart(gainNode, 0.1, 0.05);
                    gainNode.gain.exponentialRampToValueAtTime(0.2, this.audioContext.currentTime + 0.3);
                    this.smoothStop(gainNode, duration);
                    oscillator.start();
                    oscillator.stop(this.audioContext.currentTime + duration);
                    break;
                }

                case 'retro': {
                    const duration = 0.3;
                    oscillator.type = 'square';
                    const filter = this.audioContext.createBiquadFilter();
                    filter.type = 'lowpass';
                    filter.frequency.value = 2000;
                    filter.Q.value = 1;

                    this.activeNodes.add(filter);

                    oscillator.connect(gainNode);
                    gainNode.disconnect();
                    gainNode.connect(filter);
                    filter.connect(this.masterGain);

                    oscillator.frequency.setValueAtTime(440, this.audioContext.currentTime);
                    oscillator.frequency.setValueAtTime(880, this.audioContext.currentTime + 0.1);
                    oscillator.frequency.setValueAtTime(1320, this.audioContext.currentTime + 0.2);
                    this.smoothStart(gainNode, 0.2);
                    this.smoothStop(gainNode, duration);
                    oscillator.start();
                    oscillator.stop(this.audioContext.currentTime + duration);

                    setTimeout(() => this.activeNodes.delete(filter), duration * 1000 + 100);
                    break;
                }

                case 'crystal': {
                    const duration = 0.5;
                    const modulator = this.audioContext.createOscillator();
                    const modGain = this.audioContext.createGain();

                    this.activeNodes.add(modulator);
                    this.activeNodes.add(modGain);

                    oscillator.type = 'sine';
                    modulator.type = 'sine';

                    oscillator.frequency.setValueAtTime(880, this.audioContext.currentTime);
                    modulator.frequency.setValueAtTime(440, this.audioContext.currentTime);
                    modGain.gain.setValueAtTime(200, this.audioContext.currentTime);
                    this.smoothStart(gainNode, 0.2, 0.01);
                    this.smoothStop(gainNode, duration);

                    modulator.connect(modGain);
                    modGain.connect(oscillator.frequency);
                    modulator.start();
                    oscillator.start();
                    modulator.stop(this.audioContext.currentTime + duration);
                    oscillator.stop(this.audioContext.currentTime + duration);

                    // Clean up crystal completion nodes
                    setTimeout(() => {
                        this.activeNodes.delete(modulator);
                        this.activeNodes.delete(modGain);
                    }, duration * 1000 + 100);
                    break;
                }
            }

            if (!['retro'].includes(this.soundType)) {
                oscillator.connect(gainNode);
            }

            // Clean up completion sound nodes
            const duration = this.soundType === 'ambient' ? 0.8 :
                this.soundType === 'crystal' ? 0.5 : 0.3;

            setTimeout(() => {
                this.activeNodes.delete(oscillator);
                this.activeNodes.delete(gainNode);
            }, duration * 1000 + 100);

        } catch (error) {
            console.error('Error playing completion sound:', error);
        }
    }
}