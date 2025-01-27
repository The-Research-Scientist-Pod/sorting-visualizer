import { SortingAlgorithm } from "@/algorithms/base.js";

export class InsertionSort extends SortingAlgorithm {
    constructor(config) {
        super(config);
    }

    async sort(array) {
        try {
            const n = array.length;

            for (let i = 1; i < n; i++) {
                await this.checkState();

                const key = array[i];
                let j = i - 1;

                // Compare and shift elements
                while (j >= 0 && (await this.compare(array, j, j + 1))) {
                    array[j + 1] = array[j];
                    j--;
                    this.onStep?.([...array]); // Visualize shifting
                }

                // Insert the key at the correct position
                array[j + 1] = key;
                this.onStep?.([...array]); // Visualize the updated array
            }

            return array;
        } catch (error) {
            if (error.message === "Sorting cancelled") {
                return array; // Graceful handling
            }
            throw error;
        }
    }

    async checkState() {
        // Check if sorting is canceled
        if (this.isCancelled?.current) {
            throw new Error("Sorting cancelled");
        }

        // Pause execution if paused
        while (this.isPaused?.current && !this.isCancelled?.current) {
            await new Promise(resolve => setTimeout(resolve, 100));
        }

        // Check again for cancellation after unpausing
        if (this.isCancelled?.current) {
            throw new Error("Sorting cancelled");
        }
    }

    async compare(array, i, j) {
        await this.checkState();
        this.onCompare?.(i, j); // Visualize the comparison
        await new Promise(resolve => setTimeout(resolve, this.delay || 100)); // Delay for visualization
        return array[i] > array[j];
    }
}
