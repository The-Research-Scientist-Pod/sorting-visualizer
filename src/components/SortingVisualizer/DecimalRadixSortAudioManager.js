import { RadixSortAudioManager } from './RadixSortAudioManager';

export class DecimalRadixSortAudioManager extends RadixSortAudioManager {
    constructor() {
        super(10); // Initialize with base 10
        // Use frequencies that form a major scale
        this.minFreq = 220;  // A3
        this.maxFreq = 880;  // A5
        this.initializeFrequencies();
    }

    initializeFrequencies() {
        // Create a major scale frequency mapping for digits 0-9
        const majorScaleRatios = [1, 1.125, 1.25, 1.333, 1.5, 1.667, 1.875, 2, 2.25, 2.5];
        this.bucketFrequencies = majorScaleRatios.map(ratio => this.minFreq * ratio);
    }

    playBucketPlacement(digit, value, arraySize) {
        if (!this.isEnabled || !this.audioContext) return;
        if (!this.shouldPlayNote()) return;

        try {
            const oscillator = this.audioContext.createOscillator();
            const gainNode = this.createSmoothGain();
            this.activeNodes.add(oscillator);

            // Use musical scale frequencies for better harmony
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
            console.error('Error playing decimal bucket placement sound:', error);
        }
    }

    // Override playCopyBack to use musical scale for final array reconstruction
    playCopyBack(value, arraySize) {
        if (!this.isEnabled || !this.audioContext) return;
        if (!this.shouldPlayNote()) return;

        try {
            const oscillator = this.audioContext.createOscillator();
            const gainNode = this.createSmoothGain();
            this.activeNodes.add(oscillator);

            // Use a frequency that corresponds to the value's position in the scale
            const normalizedValue = value / arraySize;
            const scaleIndex = Math.floor(normalizedValue * 10);
            const baseFreq = this.bucketFrequencies[Math.min(scaleIndex, 9)];
            const frequency = (baseFreq + this.calculateFrequency(value, arraySize)) / 2;

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
            console.error('Error playing decimal copy back sound:', error);
        }
    }
}