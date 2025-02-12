import AudioManager from "./AudioManager";
export class RadixSortAudioManager extends AudioManager {
    constructor() {
        super();
        this.bucketFrequencies = new Array(10).fill(0).map((_, i) =>
            200 + (i * 80)); // Create distinct frequencies for each bucket (0-9)
    }

    // Play sound when placing element in bucket
    playBucketPlacement(digit, value, arraySize) {
        if (!this.isEnabled || !this.audioContext) return;
        if (!this.shouldPlayNote()) return;

        try {
            const oscillator = this.audioContext.createOscillator();
            const gainNode = this.createSmoothGain();
            this.activeNodes.add(oscillator);

            // Base frequency determined by the bucket (digit 0-9)
            const baseFreq = this.bucketFrequencies[digit];

            // Modify frequency based on value's magnitude
            const valueFreq = this.calculateFrequency(value, arraySize);
            const finalFreq = (baseFreq + valueFreq) / 2;

            if (this.soundType === 'electronic') {
                oscillator.type = 'sine';
                oscillator.frequency.setValueAtTime(finalFreq, this.audioContext.currentTime);
                this.smoothStart(gainNode, 0.08);
                this.smoothStop(gainNode, 0.12);
            } else if (this.soundType === 'ambient') {
                oscillator.type = 'sine';
                oscillator.frequency.setValueAtTime(finalFreq * 0.5, this.audioContext.currentTime);
                this.smoothStart(gainNode, 0.1, 0.01);
                oscillator.frequency.exponentialRampToValueAtTime(
                    finalFreq * 0.75,
                    this.audioContext.currentTime + 0.2
                );
                this.smoothStop(gainNode, 0.3);
            } else if (this.soundType === 'retro') {
                oscillator.type = 'square';
                const filter = this.audioContext.createBiquadFilter();
                filter.type = 'lowpass';
                filter.frequency.value = finalFreq * 2;
                filter.Q.value = 1;

                this.activeNodes.add(filter);
                oscillator.connect(gainNode);
                gainNode.disconnect();
                gainNode.connect(filter);
                filter.connect(this.masterGain);

                oscillator.frequency.setValueAtTime(finalFreq * 0.5, this.audioContext.currentTime);
                this.smoothStart(gainNode, 0.06);
                this.smoothStop(gainNode, 0.1);

                setTimeout(() => this.activeNodes.delete(filter), 200);
            } else if (this.soundType === 'crystal') {
                const modulator = this.audioContext.createOscillator();
                const modGain = this.audioContext.createGain();

                this.activeNodes.add(modulator);
                this.activeNodes.add(modGain);

                oscillator.type = 'sine';
                modulator.type = 'sine';

                oscillator.frequency.setValueAtTime(finalFreq * 1.5, this.audioContext.currentTime);
                modulator.frequency.setValueAtTime(baseFreq * 0.25, this.audioContext.currentTime);
                modGain.gain.setValueAtTime(50, this.audioContext.currentTime);

                modulator.connect(modGain);
                modGain.connect(oscillator.frequency);
                this.smoothStart(gainNode, 0.05, 0.01);
                this.smoothStop(gainNode, 0.15);

                modulator.start();
                modulator.stop(this.audioContext.currentTime + 0.15);

                setTimeout(() => {
                    this.activeNodes.delete(modulator);
                    this.activeNodes.delete(modGain);
                }, 250);
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

    // Play sound when copying back from bucket
    playCopyBack(value, arraySize) {
        if (!this.isEnabled || !this.audioContext) return;
        if (!this.shouldPlayNote()) return;

        try {
            const oscillator = this.audioContext.createOscillator();
            const gainNode = this.createSmoothGain();
            this.activeNodes.add(oscillator);

            const frequency = this.calculateFrequency(value, arraySize);

            if (this.soundType === 'electronic') {
                oscillator.type = 'triangle';
                oscillator.frequency.setValueAtTime(frequency * 1.5, this.audioContext.currentTime);
                this.smoothStart(gainNode, 0.06);
                this.smoothStop(gainNode, 0.08);
            } else if (this.soundType === 'ambient') {
                oscillator.type = 'sine';
                oscillator.frequency.setValueAtTime(frequency, this.audioContext.currentTime);
                this.smoothStart(gainNode, 0.08, 0.01);
                this.smoothStop(gainNode, 0.2);
            } else if (this.soundType === 'crystal') {
                oscillator.type = 'sine';
                oscillator.frequency.setValueAtTime(frequency * 2, this.audioContext.currentTime);
                this.smoothStart(gainNode, 0.04);
                this.smoothStop(gainNode, 0.1);
            } else if (this.soundType === 'retro') {
                oscillator.type = 'square';
                const filter = this.audioContext.createBiquadFilter();
                filter.type = 'lowpass';
                filter.frequency.value = frequency * 3;
                filter.Q.value = 1;

                this.activeNodes.add(filter);
                oscillator.connect(gainNode);
                gainNode.disconnect();
                gainNode.connect(filter);
                filter.connect(this.masterGain);

                oscillator.frequency.setValueAtTime(frequency, this.audioContext.currentTime);
                this.smoothStart(gainNode, 0.05);
                this.smoothStop(gainNode, 0.08);

                setTimeout(() => this.activeNodes.delete(filter), 150);
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
}