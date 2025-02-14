import { SortingAlgorithm } from "@/algorithms/base.js";
import { RadixSortAudioManager } from "../components/SortingVisualizer/RadixSortAudioManager";

export class QuaternaryRadixSort extends SortingAlgorithm {
    constructor(config) {
        super(config);
        this.audioManager = new RadixSortAudioManager();
        this.totalPasses = 0;
        this.currentPass = 0;
        if (config.soundEnabled) {
            this.audioManager.initialize();
            this.audioManager.isEnabled = true;
        }
    }

    async sort(array) {
        try {
            const max = Math.max(...array);
            this.totalPasses = Math.floor(Math.log(max) / Math.log(4)) + 1;
            this.currentPass = 0;

            // Create output array once and reuse
            const output = new Array(array.length);

            for (let power = 0; power < this.totalPasses; power++) {
                await this.checkState();
                await this.countingSort(array, output, power);
                this.currentPass++;
                this.onStep?.(array, {
                    totalPasses: this.totalPasses,
                    currentPass: this.currentPass
                });
            }
            return array;
        } catch (error) {
            if (error.message === 'Sorting cancelled') {
                return array;
            }
            throw error;
        }
    }

    async countingSort(array, output, power) {
        const n = array.length;
        const count = new Array(4).fill(0);
        const shift = power * 2; // Each base-4 digit uses 2 bits

        // Count phase - only necessary comparisons
        for (let i = 0; i < n; i++) {
            await this.checkState();
            const digit = (array[i] >> shift) & 3; // Get 2 bits at a time
            count[digit]++;
            // Visual comparison for digit extraction
            this.onCompare?.(i, i);

            if (this.audioManager?.isEnabled) {
                this.audioManager.playBucketPlacement(digit * 3, array[i], n);
            }
            await new Promise(resolve => setTimeout(resolve, this.delay));
        }

        // Calculate cumulative count (no visualization needed)
        for (let i = 1; i < 4; i++) {
            count[i] += count[i - 1];
        }

        // Distribution phase
        for (let i = n - 1; i >= 0; i--) {
            await this.checkState();
            const digit = (array[i] >> shift) & 3;
            const position = --count[digit];
            output[position] = array[i];

            // Only swap visualization, no comparison needed
            this.onSwap?.(array);

            if (this.audioManager?.isEnabled) {
                this.audioManager.playBucketPlacement(digit * 3, array[i], n);
            }
            await new Promise(resolve => setTimeout(resolve, this.delay));
        }

        // Copy back phase - no comparisons needed
        for (let i = 0; i < n; i++) {
            await this.checkState();
            array[i] = output[i];
            // Only swap visualization
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