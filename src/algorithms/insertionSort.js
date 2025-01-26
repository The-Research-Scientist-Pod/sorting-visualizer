import {SortingAlgorithm} from "@/algorithms/base.js";

export class InsertionSort extends SortingAlgorithm {
    constructor(config) {
        super(config);
    }

    async sort(array) {
        try {
            const n = array.length;

            for (let i = 1; i < n; i++) {
                await this.checkState();

                let key = array[i];
                let j = i - 1;

                // Compare the current element with previous elements
                while (j >= 0) {
                    await this.checkState();

                    // Visualize comparison
                    await this.compare(array, j, j + 1);

                    if (array[j] > key) {
                        // Move elements forward
                        array[j + 1] = array[j];
                        this.onStep?.(array);
                        j--;
                    } else {
                        break;
                    }
                }

                // Place the key in its correct position
                array[j + 1] = key;
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