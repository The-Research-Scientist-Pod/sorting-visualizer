import AudioManager from "./AudioManager";

export class RadixSortAudioManager extends AudioManager {
    constructor(base = 10) {
        super();
        this.base = base;
        this.minFreq = 200;
        this.maxFreq = 1000;
        this.initializeFrequencies();
    }

    initializeFrequencies() {
        this.bucketFrequencies = new Array(this.base).fill(0).map((_, i) =>
            this.minFreq + (i * ((this.maxFreq - this.minFreq) / (this.base - 1)))
        );
    }

    playBucketPlacement(digit, value, arraySize) {
        if (!this.isEnabled || !this.audioContext) return;
        if (!this.shouldPlayNote()) return;

        try {
            const oscillator = this.audioContext.createOscillator();
            const gainNode = this.createSmoothGain();
            this.activeNodes.add(oscillator);

            const baseFreq = this.bucketFrequencies[digit];
            const valueFreq = this.calculateFrequency(value, arraySize);
            const finalFreq = (baseFreq + valueFreq) / 2;

            let filter;
            let modulator;
            let modGain;

            switch (this.soundType) {
                case 'electronic':
                    oscillator.type = 'sine';
                    oscillator.frequency.setValueAtTime(finalFreq, this.audioContext.currentTime);
                    this.smoothStart(gainNode, 0.08);
                    this.smoothStop(gainNode, 0.12);
                    break;
                case 'ambient':
                    oscillator.type = 'sine';
                    oscillator.frequency.setValueAtTime(finalFreq * 0.5, this.audioContext.currentTime);
                    this.smoothStart(gainNode, 0.1, 0.01);
                    oscillator.frequency.exponentialRampToValueAtTime(
                        finalFreq * 0.75,
                        this.audioContext.currentTime + 0.2
                    );
                    this.smoothStop(gainNode, 0.3);
                    break;
                case 'retro':
                    oscillator.type = 'square';
                    filter = this.createRetroFilter(finalFreq * 2);
                    this.setupRetroConnection(oscillator, gainNode, filter);
                    oscillator.frequency.setValueAtTime(finalFreq * 0.5, this.audioContext.currentTime);
                    this.smoothStart(gainNode, 0.06);
                    this.smoothStop(gainNode, 0.1);
                    setTimeout(() => this.activeNodes.delete(filter), 200);
                    break;
                case 'crystal':
                    ({ modulator, modGain } = this.createCrystalModulation(finalFreq, baseFreq));
                    this.setupCrystalSound(oscillator, gainNode, modulator, modGain, finalFreq * 1.5);
                    this.smoothStart(gainNode, 0.05, 0.01);
                    this.smoothStop(gainNode, 0.15);
                    this.connectAndPlayCrystal(oscillator, gainNode, modulator, modGain, 0.2, 300);
                    return;
            }

            if (this.soundType !== 'retro') {
                oscillator.connect(gainNode);
            }

            oscillator.start();
            oscillator.stop(this.audioContext.currentTime + 0.2);

            setTimeout(() => {
                this.activeNodes.delete(oscillator);
                this.activeNodes.delete(gainNode);
            }, 300);

        } catch (error) {
            console.error('Error playing bucket placement sound:', error);
        }
    }

    playCopyBack(value, arraySize) {
        if (!this.isEnabled || !this.audioContext) return;
        if (!this.shouldPlayNote()) return;

        try {
            const oscillator = this.audioContext.createOscillator();
            const gainNode = this.createSmoothGain();
            this.activeNodes.add(oscillator);

            const frequency = this.calculateFrequency(value, arraySize);

            let filter;
            let modulator;
            let modGain;

            switch (this.soundType) {
                case 'electronic':
                    oscillator.type = 'triangle';
                    oscillator.frequency.setValueAtTime(frequency * 1.5, this.audioContext.currentTime);
                    this.smoothStart(gainNode, 0.06);
                    this.smoothStop(gainNode, 0.08);
                    break;
                case 'ambient':
                    oscillator.type = 'sine';
                    oscillator.frequency.setValueAtTime(frequency, this.audioContext.currentTime);
                    this.smoothStart(gainNode, 0.08, 0.01);
                    this.smoothStop(gainNode, 0.2);
                    break;
                case 'retro':
                    oscillator.type = 'square';
                    filter = this.createRetroFilter(frequency * 3);
                    this.setupRetroConnection(oscillator, gainNode, filter);
                    oscillator.frequency.setValueAtTime(frequency, this.audioContext.currentTime);
                    this.smoothStart(gainNode, 0.05);
                    this.smoothStop(gainNode, 0.08);
                    setTimeout(() => this.activeNodes.delete(filter), 150);
                    break;
                case 'crystal':
                    ({ modulator, modGain } = this.createCrystalModulation(frequency, frequency));
                    this.setupCrystalSound(oscillator, gainNode, modulator, modGain, frequency * 2);
                    this.smoothStart(gainNode, 0.04);
                    this.smoothStop(gainNode, 0.1);
                    this.connectAndPlayCrystal(oscillator, gainNode, modulator, modGain, 0.15, 250);
                    return;
            }

            if (this.soundType !== 'retro') {
                oscillator.connect(gainNode);
            }

            oscillator.start();
            oscillator.stop(this.audioContext.currentTime + 0.15);

            setTimeout(() => {
                this.activeNodes.delete(oscillator);
                this.activeNodes.delete(gainNode);
            }, 250);

        } catch (error) {
            console.error('Error playing copy back sound:', error);
        }
    }

    // Helper methods
    createRetroFilter(frequency) {
        const filter = this.audioContext.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value = frequency;
        filter.Q.value = 1;
        this.activeNodes.add(filter);
        return filter;
    }

    setupRetroConnection(oscillator, gainNode, filter) {
        oscillator.connect(gainNode);
        gainNode.disconnect();
        gainNode.connect(filter);
        filter.connect(this.masterGain);
    }

    createCrystalModulation(frequency, baseFreq) {
        const modulator = this.audioContext.createOscillator();
        const modGain = this.audioContext.createGain();

        this.activeNodes.add(modulator);
        this.activeNodes.add(modGain);

        modulator.type = 'sine';
        modulator.frequency.setValueAtTime(baseFreq * 0.25, this.audioContext.currentTime);
        modGain.gain.setValueAtTime(50, this.audioContext.currentTime);

        return { modulator, modGain };
    }

    setupCrystalSound(oscillator, gainNode, modulator, modGain, frequency) {
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(frequency, this.audioContext.currentTime);
        modulator.connect(modGain);
        modGain.connect(oscillator.frequency);
    }

    connectAndPlayCrystal(oscillator, gainNode, modulator, modGain, duration, cleanupDelay) {
        oscillator.connect(gainNode);
        modulator.start();
        oscillator.start();
        modulator.stop(this.audioContext.currentTime + duration);
        oscillator.stop(this.audioContext.currentTime + duration);
        setTimeout(() => {
            this.activeNodes.delete(modulator);
            this.activeNodes.delete(modGain);
        }, cleanupDelay);
    }
}