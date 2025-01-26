import {SortingAlgorithm} from "@/algorithms/base.js";

export class SelectionSort extends SortingAlgorithm {
    constructor(config) {
        super(config);
    }

    async sort(array) {
        try {
            const n = array.length;

            for (let i = 0; i < n - 1; i++) {
                await this.checkState();

                // Find the minimum element in the unsorted portion
                let minIdx = i;
                for (let j = i + 1; j < n; j++) {
                    await this.checkState();

                    // Visualize comparison
                    await this.compare(array, j, minIdx);

                    if (array[j] < array[minIdx]) {
                        minIdx = j;
                    }
                }

                // Swap the found minimum element with the first element of unsorted portion
                if (minIdx !== i) {
                    this.swap(array, i, minIdx);
                }

                this.onStep?.(array);
            }

            return array;
        } catch (error) {
            if (error.message === 'Sorting cancelled') {
                return array;
            }
            throw error;
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