import { RadixSort } from './RadixSort';
import { DecimalRadixSortAudioManager } from '../components/SortingVisualizer/DecimalRadixSortAudioManager';

export class DecimalRadixSort extends RadixSort {
    constructor(config) {
        super(config);
        this.base = 10;
        this.audioManager = new DecimalRadixSortAudioManager();
        if (config.soundEnabled) {
            this.audioManager.initialize();
            this.audioManager.isEnabled = true;
        }
    }

    // Override for decimal-specific optimization
    getDigit(number, exp) {
        return Math.floor(number / exp) % 10;
    }

    // No need to override sort as the base implementation is already optimized for base 10
}