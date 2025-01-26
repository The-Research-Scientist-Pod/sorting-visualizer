import {SortingAlgorithm} from "@/algorithms/base.js";

export class HeapSort extends SortingAlgorithm {
    constructor(config) {
        super(config);
    }

    async sort(array) {
        try {
            const n = array.length;

            // Build heap (rearrange array)
            for (let i = Math.floor(n / 2) - 1; i >= 0; i--) {
                await this.heapify(array, n, i);
            }

            // One by one extract an element from heap
            for (let i = n - 1; i > 0; i--) {
                await this.checkState();

                // Move current root to end
                this.swap(array, 0, i);

                // Call max heapify on the reduced heap
                await this.heapify(array, i, 0);
            }

            return array;
        } catch (error) {
            if (error.message === 'Sorting cancelled') {
                return array;
            }
            throw error;
        }
    }

    async heapify(array, n, i) {
        await this.checkState();

        let largest = i; // Initialize largest as root
        const left = 2 * i + 1; // Left child
        const right = 2 * i + 2; // Right child

        // Compare with left child
        if (left < n) {
            await this.compare(array, left, largest);
            if (array[left] > array[largest]) {
                largest = left;
            }
        }

        // Compare with right child
        if (right < n) {
            await this.compare(array, right, largest);
            if (array[right] > array[largest]) {
                largest = right;
            }
        }

        // If largest is not root
        if (largest !== i) {
            this.swap(array, i, largest);
            this.onStep?.(array);

            // Recursively heapify the affected sub-tree
            await this.heapify(array, n, largest);
        }
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

    async compare(array, i, j) {
        await this.checkState();
        this.onCompare?.(i, j);
        await new Promise(resolve => setTimeout(resolve, this.delay));
        return array[i] > array[j];
    }

    swap(array, i, j) {
        [array[i], array[j]] = [array[j], array[i]];
        this.onSwap?.(array);
    }
}