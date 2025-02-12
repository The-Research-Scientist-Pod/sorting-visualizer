import { RadixSortAudioManager } from './RadixSortAudioManager';

export class BinaryRadixSortAudioManager extends RadixSortAudioManager {
    constructor() {
        super(2); // Initialize with base 2
        this.minFreq = 220;  // A3
        this.maxFreq = 440;  // A4
        this.initializeFrequencies();
    }

    playBucketPlacement(digit, value, arraySize) {
        if (!this.isEnabled || !this.audioContext) return;
        if (!this.shouldPlayNote()) return;

        try {
            const oscillator = this.audioContext.createOscillator();
            const gainNode = this.createSmoothGain();
            this.activeNodes.add(oscillator);

            // Use perfect octave for binary distinction
            const baseFreq = digit === 0 ? this.minFreq : this.maxFreq;
            const valueFreq = this.calculateFrequency(value, arraySize);
            const finalFreq = (baseFreq + valueFreq) / 2;

            let filter;
            let modulator;
            let modGain;

            switch (this.soundType) {
                case 'electronic':
                    oscillator.type = 'sine';
                    oscillator.frequency.setValueAtTime(finalFreq, this.audioContext.currentTime);
                    this.smoothStart(gainNode, 0.1);
                    this.smoothStop(gainNode, 0.15);
                    break;
                case 'ambient':
                    oscillator.type = 'sine';
                    oscillator.frequency.setValueAtTime(finalFreq * 0.5, this.audioContext.currentTime);
                    this.smoothStart(gainNode, 0.15, 0.01);
                    oscillator.frequency.exponentialRampToValueAtTime(
                        finalFreq * 0.75,
                        this.audioContext.currentTime + 0.3
                    );
                    this.smoothStop(gainNode, 0.4);
                    break;
                case 'retro':
                    oscillator.type = 'square';
                    filter = this.createRetroFilter(finalFreq * 2);
                    this.setupRetroConnection(oscillator, gainNode, filter);
                    oscillator.frequency.setValueAtTime(finalFreq * 0.5, this.audioContext.currentTime);
                    this.smoothStart(gainNode, 0.08);
                    this.smoothStop(gainNode, 0.12);
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
            console.error('Error playing binary bucket placement sound:', error);
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
                    oscillator.frequency.setValueAtTime(frequency * 1.2, this.audioContext.currentTime);
                    this.smoothStart(gainNode, 0.07);
                    this.smoothStop(gainNode, 0.1);
                    break;
                case 'ambient':
                    oscillator.type = 'sine';
                    oscillator.frequency.setValueAtTime(frequency * 0.8, this.audioContext.currentTime);
                    this.smoothStart(gainNode, 0.12, 0.01);
                    this.smoothStop(gainNode, 0.25);
                    break;
                case 'retro':
                    oscillator.type = 'square';
                    filter = this.createRetroFilter(frequency * 1.5);
                    this.setupRetroConnection(oscillator, gainNode, filter);
                    oscillator.frequency.setValueAtTime(frequency * 0.7, this.audioContext.currentTime);
                    this.smoothStart(gainNode, 0.06);
                    this.smoothStop(gainNode, 0.08);
                    setTimeout(() => this.activeNodes.delete(filter), 150);
                    break;
                case 'crystal':
                    ({ modulator, modGain } = this.createCrystalModulation(frequency, frequency * 0.75));
                    this.setupCrystalSound(oscillator, gainNode, modulator, modGain, frequency * 1.2);
                    this.smoothStart(gainNode, 0.05, 0.01);
                    this.smoothStop(gainNode, 0.12);
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
            console.error('Error playing binary copy back sound:', error);
        }
    }
}