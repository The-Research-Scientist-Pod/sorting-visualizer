import { Howl } from 'howler';

class SortingAudioSystem {
    constructor() {
        this.isEnabled = false;
        this.activeOperations = new Map();
        this.volume = 0.5;

        // Base sounds for common operations
        this.sounds = {
            compare: new Howl({
                src: ['/sounds/compare.mp3'],
                volume: this.volume
            }),
            swap: new Howl({
                src: ['/sounds/swap.mp3'],
                volume: this.volume
            }),
            complete: new Howl({
                src: ['/sounds/complete.mp3'],
                volume: this.volume
            })
        };

        // Algorithm-specific sound collections
        this.algorithmSounds = {
            mergeSort: {
                merge: new Howl({
                    src: ['/sounds/merge.mp3'],
                    volume: this.volume,
                    loop: true
                }),
                split: new Howl({
                    src: ['/sounds/split.mp3'],
                    volume: this.volume
                })
            },
            quickSort: {
                partition: new Howl({
                    src: ['/sounds/partition.mp3'],
                    volume: this.volume,
                    loop: true
                }),
                pivot: new Howl({
                    src: ['/sounds/pivot.mp3'],
                    volume: this.volume
                })
            },
            heapSort: {
                heapify: new Howl({
                    src: ['/sounds/heapify.mp3'],
                    volume: this.volume,
                    loop: true
                }),
                siftDown: new Howl({
                    src: ['/sounds/sift.mp3'],
                    volume: this.volume
                })
            },
            radixSort: {
                bucket: new Howl({
                    src: ['/sounds/bucket.mp3'],
                    volume: this.volume
                }),
                digitShift: new Howl({
                    src: ['/sounds/digit-shift.mp3'],
                    volume: this.volume,
                    loop: true
                })
            }
        };
    }

    enable() {
        this.isEnabled = true;
    }

    disable() {
        this.isEnabled = false;
        this.stopAllSounds();
    }

    setVolume(volume) {
        this.volume = Math.max(0, Math.min(1, volume));

        // Update volume for all sounds
        Object.values(this.sounds).forEach(sound => {
            sound.volume(this.volume);
        });

        Object.values(this.algorithmSounds).forEach(algorithmSound => {
            Object.values(algorithmSound).forEach(sound => {
                sound.volume(this.volume);
            });
        });
    }

    // Play a one-shot sound for basic operations
    playOperationSound(operation, value, maxValue) {
        if (!this.isEnabled) return;

        const sound = this.sounds[operation];
        if (sound) {
            // Adjust pitch based on value if needed
            const rate = 0.5 + (value / maxValue);
            sound.rate(rate);
            sound.play();
        }
    }

    // Start a continuous sound for algorithm-specific operations
    startAlgorithmSound(algorithm, operation, id, value, maxValue) {
        if (!this.isEnabled) return;

        const algorithmSounds = this.algorithmSounds[algorithm];
        if (!algorithmSounds) return;

        const sound = algorithmSounds[operation];
        if (sound) {
            // Stop any existing sound with this ID
            this.stopAlgorithmSound(algorithm, operation, id);

            // Start new sound
            const rate = 0.5 + (value / maxValue);
            sound.rate(rate);
            const soundId = sound.play();

            // Store the sound ID and instance
            this.activeOperations.set(id, {
                algorithm,
                operation,
                soundId,
                sound
            });
        }
    }

    // Update the pitch of a continuous sound
    updateAlgorithmSound(id, value, maxValue) {
        if (!this.isEnabled) return;

        const operation = this.activeOperations.get(id);
        if (operation) {
            const rate = 0.5 + (value / maxValue);
            operation.sound.rate(rate, operation.soundId);
        }
    }

    // Stop a specific algorithm sound
    stopAlgorithmSound(id) {
        const operation = this.activeOperations.get(id);
        if (operation) {
            operation.sound.stop(operation.soundId);
            this.activeOperations.delete(id);
        }
    }

    // Stop all active sounds
    stopAllSounds() {
        // Stop all basic sounds
        Object.values(this.sounds).forEach(sound => {
            sound.stop();
        });

        // Stop all algorithm-specific sounds
        this.activeOperations.forEach((operation, id) => {
            this.stopAlgorithmSound(id);
        });
        this.activeOperations.clear();
    }

    // Play completion sound
    playCompletion() {
        if (!this.isEnabled) return;
        this.sounds.complete.play();
    }
}

export default SortingAudioSystem;