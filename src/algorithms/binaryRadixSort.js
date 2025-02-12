import { RadixSort } from './RadixSort';
import { BinaryRadixSortAudioManager } from '../components/SortingVisualizer/BinaryRadixSortAudioManager';

export class BinaryRadixSort extends RadixSort {
    constructor(config) {
        super(config);
        this.base = 2;
        this.audioManager = new BinaryRadixSortAudioManager();
        if (config.soundEnabled) {
            this.audioManager.initialize();
            this.audioManager.isEnabled = true;
        }
    }

    // Override for binary-specific optimization
    getDigit(number, exp) {
        return (number & exp) ? 1 : 0;
    }

    // Override sort for binary-specific optimization
    async sort(array) {
        try {
            let max = Math.max(...array);
            let maxBits = Math.floor(Math.log2(max)) + 1;

            for (let bit = 0; bit < maxBits; bit++) {
                await this.checkState();
                await this.countingSort(array, 1 << bit);
            }
            return array;
        } catch (error) {
            if (error.message === 'Sorting cancelled') {
                return array;
            }
            throw error;
        }
    }
}