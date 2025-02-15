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
        this.mergeOscillators = null;
        this.mergeGains = null;
        this.currentMergeGainValue = 0;
    }

    initialize() {
        if (!this.audioContext) {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
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
        const now = this.audioContext?.currentTime || 0;
        for (const node of this.activeNodes) {
            try {
                if (node.gain) {
                    node.gain.cancelScheduledValues(now);
                    node.gain.setValueAtTime(node.gain.value, now);
                    node.gain.linearRampToValueAtTime(0.0001, now + 0.01);
                }
                setTimeout(() => {
                    try {
                        node.disconnect();
                    } catch (e) {
                        // Ignore disconnection errors
                    }
                }, 20);
            } catch (e) {
                // Ignore cleanup errors
            }
        }
        this.activeNodes.clear();
        this.cleanupMergeSounds();
    }

    calculateFrequency(value, arraySize) {
        if (!Number.isFinite(value) || !Number.isFinite(arraySize) || arraySize <= 0) {
            return this.minFreq;
        }
        const normalizedValue = Math.max(1, Math.min(value, arraySize));
        const baseFreq =
            this.minFreq +
            ((normalizedValue - 1) / (arraySize - 1)) *
            (this.maxFreq - this.minFreq);
        const pitchMultiplier = 0.5 + value / arraySize;
        const frequency = baseFreq * pitchMultiplier;
        const clampedFreq = Math.min(
            Math.max(frequency, this.minFreq),
            this.maxFreq * 2
        );
        return Number.isFinite(clampedFreq) ? clampedFreq : this.minFreq;
    }

    setSoundType(type) {
        this.soundType = type;
        this.cleanupMergeSounds();
    }

    createSmoothGain() {
        const gainNode = this.audioContext.createGain();
        gainNode.connect(this.masterGain);
        this.activeNodes.add(gainNode);
        return gainNode;
    }

    smoothStart(gainNode, initialValue, time = 0.02) {
        const now = this.audioContext.currentTime;
        gainNode.gain.cancelScheduledValues(now);
        gainNode.gain.setValueAtTime(0.0001, now);
        gainNode.gain.exponentialRampToValueAtTime(initialValue, now + time);
    }

    smoothStop(gainNode, duration = 0.1) {
        const now = this.audioContext.currentTime;
        gainNode.gain.cancelScheduledValues(now);
        gainNode.gain.exponentialRampToValueAtTime(0.0001, now + duration);
    }

    smoothMergeStart(gainNode, targetValue, time = 0.05) {
        const now = this.audioContext.currentTime;
        gainNode.gain.cancelScheduledValues(now);
        const startValue = Math.max(0.0001, this.currentMergeGainValue);
        gainNode.gain.setValueAtTime(startValue, now);
        gainNode.gain.exponentialRampToValueAtTime(targetValue, now + time);
        this.currentMergeGainValue = targetValue;
    }

    smoothMergeStop(gainNode, duration = 0.1) {
        const now = this.audioContext.currentTime;
        gainNode.gain.cancelScheduledValues(now);
        gainNode.gain.setValueAtTime(this.currentMergeGainValue, now);
        gainNode.gain.exponentialRampToValueAtTime(0.0001, now + duration);
        this.currentMergeGainValue = 0.0001;
    }

    shouldPlayNote() {
        const now = this.audioContext.currentTime;
        if (now - this.lastNoteTime < this.MIN_NOTE_SPACING) {
            return false;
        }
        this.lastNoteTime = now;
        return true;
    }

    cleanupMergeSounds() {
        if (this.mergeGains) {
            const now = this.audioContext.currentTime;
            this.mergeGains.forEach((gain) => {
                try {
                    this.smoothMergeStop(gain, 0.1);
                } catch (e) {
                    // Ignore cleanup errors
                }
            });

            setTimeout(() => {
                if (this.mergeOscillators) {
                    this.mergeOscillators.forEach((osc) => {
                        try {
                            osc.stop(now + 0.15);
                            osc.disconnect();
                            this.activeNodes.delete(osc);
                        } catch (e) {
                            // Ignore errors
                        }
                    });
                }
                if (this.mergeGains) {
                    this.mergeGains.forEach((gain) => {
                        try {
                            gain.disconnect();
                            this.activeNodes.delete(gain);
                        } catch (e) {
                            // Ignore errors
                        }
                    });
                }
                this.mergeOscillators = null;
                this.mergeGains = null;
                this.currentMergeGainValue = 0;
            }, 200);
        }
    }

    playNote(value, arraySize, type = 'compare') {
        if (!this.isEnabled || !this.audioContext) return;
        if (
            !this.shouldPlayNote() &&
            type !== 'mergeProgress' &&
            type !== 'merge' &&
            type !== 'mergeEnd'
        )
            return;

        try {
            if (type === 'mergeEnd') {
                this.cleanupMergeSounds();
                return;
            }

            const frequency = this.calculateFrequency(value, arraySize);

            if (type === 'merge') {
                this.cleanupMergeSounds();
                let oscillator, gainNode, startFreq, osc2, gain2;
                let modulator, modGain, filter;
                const now = this.audioContext.currentTime;

                switch (this.soundType) {
                    case 'electronic':
                        oscillator = this.audioContext.createOscillator();
                        gainNode = this.createSmoothGain();
                        oscillator.type = 'sine';
                        this.smoothMergeStart(gainNode, 0.15);

                        startFreq = frequency * 0.5;
                        oscillator.frequency.setValueAtTime(startFreq, now);

                        osc2 = this.audioContext.createOscillator();
                        gain2 = this.createSmoothGain();
                        osc2.type = 'sine';
                        osc2.frequency.setValueAtTime(startFreq * 1.5, now);
                        this.smoothMergeStart(gain2, 0.08);

                        oscillator.connect(gainNode);
                        osc2.connect(gain2);

                        oscillator.start();
                        osc2.start();

                        this.mergeOscillators = [oscillator, osc2];
                        this.mergeGains = [gainNode, gain2];
                        this.activeNodes.add(oscillator);
                        this.activeNodes.add(osc2);
                        this.activeNodes.add(gainNode);
                        this.activeNodes.add(gain2);
                        break;

                    case 'ambient':
                        oscillator = this.audioContext.createOscillator();
                        gainNode = this.createSmoothGain();
                        startFreq = frequency * 0.25;

                        oscillator.type = 'sine';
                        oscillator.frequency.setValueAtTime(startFreq, now);
                        this.smoothMergeStart(gainNode, 0.1);

                        oscillator.connect(gainNode);
                        oscillator.start();

                        this.mergeOscillators = [oscillator];
                        this.mergeGains = [gainNode];
                        this.activeNodes.add(oscillator);
                        this.activeNodes.add(gainNode);
                        break;

                    case 'retro':
                        oscillator = this.audioContext.createOscillator();
                        gainNode = this.createSmoothGain();
                        filter = this.audioContext.createBiquadFilter();
                        startFreq = frequency * 0.125;

                        oscillator.type = 'square';
                        filter.type = 'lowpass';
                        filter.frequency.value = startFreq * 8;
                        filter.Q.value = 1;

                        oscillator.frequency.setValueAtTime(startFreq, now);
                        this.smoothMergeStart(gainNode, 0.1);

                        oscillator.connect(gainNode);
                        gainNode.connect(filter);
                        filter.connect(this.masterGain);

                        oscillator.start();

                        this.mergeOscillators = [oscillator];
                        this.mergeGains = [gainNode];
                        this.activeNodes.add(oscillator);
                        this.activeNodes.add(gainNode);
                        this.activeNodes.add(filter);
                        break;

                    case 'crystal':
                        oscillator = this.audioContext.createOscillator();
                        gainNode = this.createSmoothGain();
                        modulator = this.audioContext.createOscillator();
                        modGain = this.audioContext.createGain();
                        startFreq = frequency * 0.75;

                        oscillator.type = 'sine';
                        modulator.type = 'sine';

                        oscillator.frequency.setValueAtTime(startFreq, now);
                        modulator.frequency.setValueAtTime(startFreq * 0.25, now);
                        modGain.gain.setValueAtTime(150, now);

                        this.smoothMergeStart(gainNode, 0.1);

                        modulator.connect(modGain);
                        modGain.connect(oscillator.frequency);
                        oscillator.connect(gainNode);

                        modulator.start();
                        oscillator.start();

                        this.mergeOscillators = [oscillator, modulator];
                        this.mergeGains = [gainNode, modGain];
                        this.activeNodes.add(oscillator);
                        this.activeNodes.add(modulator);
                        this.activeNodes.add(gainNode);
                        this.activeNodes.add(modGain);
                        break;
                }
                return;
            }

            if (type === 'mergeProgress' && this.mergeOscillators) {
                const now = this.audioContext.currentTime;
                const progress = Math.max(0, Math.min(1, value));
                let baseFreq = this.minFreq + (this.maxFreq - this.minFreq) * progress;

                switch (this.soundType) {
                    case 'electronic':
                        this.mergeOscillators.forEach((osc, idx) => {
                            osc.frequency.linearRampToValueAtTime(
                                baseFreq * (idx === 0 ? 1 : 1.5),
                                now + 0.016
                            );
                        });
                        break;
                    case 'ambient':
                        this.mergeOscillators[0].frequency.linearRampToValueAtTime(
                            baseFreq * 0.5,
                            now + 0.016
                        );
                        break;
                    case 'retro':
                        this.mergeOscillators[0].frequency.linearRampToValueAtTime(
                            baseFreq * 0.25,
                            now + 0.016
                        );
                        break;
                    case 'crystal':
                        this.mergeOscillators[0].frequency.linearRampToValueAtTime(
                            baseFreq * 0.75,
                            now + 0.016
                        );
                        this.mergeOscillators[1].frequency.linearRampToValueAtTime(
                            baseFreq * 0.25,
                            now + 0.016
                        );
                        break;
                }
                return;
            }

            // Regular sound handling (compare, swap, highlight)
            let oscillator = this.audioContext.createOscillator();
            let gainNode = this.createSmoothGain();
            let now = this.audioContext.currentTime;
            let duration = 0.1;
            let filter;
            let modulator;
            let modGain;

            switch (this.soundType) {
                case 'electronic':
                    oscillator.frequency.setValueAtTime(frequency, now);
                    switch (type) {
                        case 'compare':
                            oscillator.type = 'sine';
                            this.smoothStart(gainNode, 0.1);
                            duration = 0.1;
                            break;
                        case 'swap':
                            oscillator.type = 'triangle';
                            this.smoothStart(gainNode, 0.2);
                            duration = 0.15;
                            break;
                        case 'highlight':
                            oscillator.type = 'sawtooth';
                            this.smoothStart(gainNode, 0.15);
                            oscillator.frequency.setValueAtTime(frequency * 1.25, now);
                            duration = 0.12;
                            break;
                    }
                    break;

                case 'ambient':
                    oscillator.type = 'sine';
                    switch (type) {
                        case 'compare':
                            this.smoothStart(gainNode, 0.05, 0.01);
                            duration = 0.3;
                            oscillator.frequency.setValueAtTime(frequency * 0.5, now);
                            oscillator.frequency.exponentialRampToValueAtTime(
                                frequency * 0.51,
                                now + 0.3
                            );
                            break;
                        case 'swap':
                            this.smoothStart(gainNode, 0.1, 0.01);
                            duration = 0.4;
                            oscillator.frequency.setValueAtTime(frequency * 0.5, now);
                            oscillator.frequency.exponentialRampToValueAtTime(
                                frequency * 0.75,
                                now + 0.4
                            );
                            break;
                        case 'highlight':
                            this.smoothStart(gainNode, 0.07, 0.01);
                            duration = 0.35;
                            oscillator.frequency.setValueAtTime(frequency * 0.5, now);
                            oscillator.frequency.exponentialRampToValueAtTime(
                                frequency * 0.625,
                                now + 0.35
                            );
                            break;
                    }
                    break;

                case 'retro':
                    oscillator.type = 'square';
                    filter = this.audioContext.createBiquadFilter();
                    filter.type = 'lowpass';
                    filter.frequency.value = frequency;
                    filter.Q.value = 1;
                    this.activeNodes.add(filter);
                    oscillator.connect(gainNode);
                    gainNode.disconnect();
                    gainNode.connect(filter);
                    filter.connect(this.masterGain);
                    switch (type) {
                        case 'compare':
                            oscillator.frequency.setValueAtTime(frequency * 0.25, now);
                            this.smoothStart(gainNode, 0.05);
                            duration = 0.1;
                            break;
                        case 'swap':
                            oscillator.frequency.setValueAtTime(frequency * 0.5, now);
                            this.smoothStart(gainNode, 0.08);
                            duration = 0.15;
                            break;
                        case 'highlight':
                            oscillator.frequency.setValueAtTime(frequency * 0.375, now);
                            this.smoothStart(gainNode, 0.06);
                            duration = 0.12;
                            break;
                    }
                    setTimeout(() => this.activeNodes.delete(filter), duration * 1000 + 100);
                    break;

                case 'crystal':
                    oscillator.type = 'sine';
                    modulator = this.audioContext.createOscillator();
                    modGain = this.audioContext.createGain();
                    this.activeNodes.add(modulator);
                    this.activeNodes.add(modGain);
                    switch (type) {
                        case 'compare':
                            oscillator.frequency.setValueAtTime(frequency * 2, now);
                            modulator.frequency.setValueAtTime(frequency * 0.5, now);
                            modGain.gain.setValueAtTime(50, now);
                            this.smoothStart(gainNode, 0.05, 0.01);
                            duration = 0.2;
                            break;
                        case 'swap':
                            oscillator.frequency.setValueAtTime(frequency * 3, now);
                            modulator.frequency.setValueAtTime(frequency * 0.75, now);
                            modGain.gain.setValueAtTime(100, now);
                            this.smoothStart(gainNode, 0.08, 0.01);
                            duration = 0.3;
                            break;
                        case 'highlight':
                            oscillator.frequency.setValueAtTime(frequency * 2.5, now);
                            modulator.frequency.setValueAtTime(frequency * 0.6, now);
                            modGain.gain.setValueAtTime(75, now);
                            this.smoothStart(gainNode, 0.06, 0.01);
                            duration = 0.25;
                            break;
                    }
                    modulator.connect(modGain);
                    modGain.connect(oscillator.frequency);
                    modulator.start();
                    modulator.stop(now + duration);
                    setTimeout(() => {
                        this.activeNodes.delete(modulator);
                        this.activeNodes.delete(modGain);
                    }, duration * 1000 + 100);
                    break;
            }

            if (this.soundType !== 'retro') {
                oscillator.connect(gainNode);
            }
            oscillator.start();
            this.smoothStop(gainNode, duration);
            oscillator.stop(now + duration + 0.05);
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
                    oscillator.frequency.setValueAtTime(
                        440,
                        this.audioContext.currentTime
                    );
                    oscillator.frequency.exponentialRampToValueAtTime(
                        880,
                        this.audioContext.currentTime + 0.2
                    );
                    this.smoothStart(gainNode, 0.3);
                    this.smoothStop(gainNode, duration);
                    oscillator.start();
                    oscillator.stop(this.audioContext.currentTime + duration);
                    break;
                }
                case 'ambient': {
                    const duration = 0.8;
                    oscillator.type = 'sine';
                    oscillator.frequency.setValueAtTime(
                        220,
                        this.audioContext.currentTime
                    );
                    oscillator.frequency.exponentialRampToValueAtTime(
                        440,
                        this.audioContext.currentTime + 0.5
                    );
                    this.smoothStart(gainNode, 0.1, 0.05);
                    gainNode.gain.exponentialRampToValueAtTime(
                        0.2,
                        this.audioContext.currentTime + 0.3
                    );
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
                    oscillator.frequency.setValueAtTime(
                        440,
                        this.audioContext.currentTime
                    );
                    oscillator.frequency.setValueAtTime(
                        880,
                        this.audioContext.currentTime + 0.1
                    );
                    oscillator.frequency.setValueAtTime(
                        1320,
                        this.audioContext.currentTime + 0.2
                    );
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
                    oscillator.frequency.setValueAtTime(
                        880,
                        this.audioContext.currentTime
                    );
                    modulator.frequency.setValueAtTime(
                        440,
                        this.audioContext.currentTime
                    );
                    modGain.gain.setValueAtTime(200, this.audioContext.currentTime);
                    this.smoothStart(gainNode, 0.2, 0.01);
                    this.smoothStop(gainNode, duration);
                    modulator.connect(modGain);
                    modGain.connect(oscillator.frequency);
                    modulator.start();
                    oscillator.start();
                    modulator.stop(this.audioContext.currentTime + duration);
                    oscillator.stop(this.audioContext.currentTime + duration);
                    setTimeout(() => {
                        this.activeNodes.delete(modulator);
                        this.activeNodes.delete(modGain);
                    }, duration * 1000 + 100);
                    break;
                }
            }
            const duration =
                this.soundType === 'ambient'
                    ? 0.8
                    : this.soundType === 'crystal'
                        ? 0.5
                        : 0.3;
            setTimeout(() => {
                this.activeNodes.delete(oscillator);
                this.activeNodes.delete(gainNode);
            }, duration * 1000 + 100);
        } catch (error) {
            console.error('Error playing completion sound:', error);
        }
    }
}