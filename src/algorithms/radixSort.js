import { SortingAlgorithm } from "@/algorithms/base.js";
import { RadixSortAudioManager } from "../components/SortingVisualizer/RadixSortAudioManager";

export class RadixSort extends SortingAlgorithm {
    constructor(config) {
        super(config);
        this.audioManager = new RadixSortAudioManager();
        // Initialize audio if sound is enabled
        if (config.soundEnabled) {
            this.audioManager.initialize();
            this.audioManager.isEnabled = true;
        }
    }

    async sort(array) {
        try {
            let max = Math.max(...array);
            for (let exp = 1; Math.floor(max / exp) > 0; exp *= 10) {
                await this.checkState();
                await this.countingSort(array, exp);
            }
            return array;
        } catch (error) {
            if (error.message === 'Sorting cancelled') {
                return array;
            }
            throw error;
        }
    }

    async countingSort(array, exp) {
        const n = array.length;
        const output = new Array(n);
        const count = new Array(10).fill(0);

        // Count occurrences
        for (let i = 0; i < n; i++) {
            await this.checkState();
            const digit = Math.floor(array[i] / exp) % 10;
            count[digit]++;
            this.onCompare?.(i, Math.min(i + digit, n - 1));

            // Play bucket placement sound
            if (this.audioManager && this.audioManager.isEnabled) {
                this.audioManager.playBucketPlacement(digit, array[i], n);
            }

            await new Promise(resolve => setTimeout(resolve, this.delay));
        }

        // Calculate cumulative count
        for (let i = 1; i < 10; i++) {
            await this.checkState();
            count[i] += count[i - 1];
        }

        // Build output array
        for (let i = n - 1; i >= 0; i--) {
            await this.checkState();
            const digit = Math.floor(array[i] / exp) % 10;
            const position = --count[digit];
            output[position] = array[i];

            // Trigger visualizations
            this.onCompare?.(i, position);
            this.onSwap?.([...array.slice(0, position), array[i], ...array.slice(position + 1)]);

            // Play bucket placement sound
            if (this.audioManager && this.audioManager.isEnabled) {
                this.audioManager.playBucketPlacement(digit, array[i], n);
            }

            await new Promise(resolve => setTimeout(resolve, this.delay));
        }

        // Copy back to original array
        for (let i = 0; i < n; i++) {
            await this.checkState();
            array[i] = output[i];
            this.onCompare?.(i, i);
            this.onSwap?.(array);

            // Play copy back sound
            if (this.audioManager && this.audioManager.isEnabled) {
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