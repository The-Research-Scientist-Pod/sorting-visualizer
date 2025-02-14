import { SortingAlgorithm } from "@/algorithms/base.js";
import { RadixSortAudioManager } from "../components/SortingVisualizer/RadixSortAudioManager";

export class BinaryRadixSort extends SortingAlgorithm {
    constructor(config) {
        super(config);
        this.audioManager = new RadixSortAudioManager();
        if (config.soundEnabled) {
            this.audioManager.initialize();
            this.audioManager.isEnabled = true;
        }
    }

    async sort(array) {
        try {
            let max = Math.max(...array);
            let maxBits = Math.floor(Math.log2(max)) + 1;

            for (let bit = 0; bit < maxBits; bit++) {
                await this.checkState();
                await this.countingSort(array, bit);
            }
            return array;
        } catch (error) {
            if (error.message === 'Sorting cancelled') {
                return array;
            }
            throw error;
        }
    }

    async countingSort(array, bit) {
        const n = array.length;
        const output = new Array(n);
        const count = [0, 0]; // Only 0 and 1 for binary

        // Count occurrences of 0s and 1s at current bit position
        for (let i = 0; i < n; i++) {
            await this.checkState();
            const digit = (array[i] >> bit) & 1;
            count[digit]++;
            this.onCompare?.(i, Math.min(i + digit, n - 1));

            if (this.audioManager?.isEnabled) {
                // Map binary digit (0,1) to a wider frequency range
                this.audioManager.playBucketPlacement(digit * 9, array[i], n);
            }

            await new Promise(resolve => setTimeout(resolve, this.delay));
        }

        // Calculate cumulative count
        count[1] += count[0];

        // Build output array
        for (let i = n - 1; i >= 0; i--) {
            await this.checkState();
            const digit = (array[i] >> bit) & 1;
            const position = --count[digit];
            output[position] = array[i];

            this.onCompare?.(i, position);
            this.onSwap?.([...array.slice(0, position), array[i], ...array.slice(position + 1)]);

            if (this.audioManager?.isEnabled) {
                this.audioManager.playBucketPlacement(digit * 9, array[i], n);
            }

            await new Promise(resolve => setTimeout(resolve, this.delay));
        }

        // Copy back to original array
        for (let i = 0; i < n; i++) {
            await this.checkState();
            array[i] = output[i];
            this.onCompare?.(i, i);
            this.onSwap?.(array);

            if (this.audioManager?.isEnabled) {
                this.audioManager.playCopyBack(array[i], n);
            }

            await new Promise(resolve => setTimeout(resolve, this.delay));
        }

        return array;
    }

    async checkState() {
        if (this.isCancelled?.current) {
            throw new Error('Sorting cancelled');
        }

        while (this.isPaused?.current && !this.isCancelled?.current) {
            await new Promise(resolve => setTimeout(resolve, 100));
        }

        if (this.isCancelled?.current) {
            throw new Error('Sorting cancelled');
        }
    }
}