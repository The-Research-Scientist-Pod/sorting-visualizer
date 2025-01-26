// stoogeSort.js

class StoogeSort {
    constructor(config) {
        this.delay = config.delay;
        this.isPaused = config.isPaused;
        this.isCancelled = config.isCancelled;
        this.onStep = config.onStep;
        this.onCompare = config.onCompare;
        this.onSwap = config.onSwap;
    }

    async sleep() {
        if (this.isCancelled.current) {
            throw new Error('Sorting cancelled');
        }
        while (this.isPaused.current) {
            await new Promise(resolve => setTimeout(resolve, 100));
            if (this.isCancelled.current) {
                throw new Error('Sorting cancelled');
            }
        }
        return new Promise(resolve => setTimeout(resolve, this.delay));
    }

    async swap(array, i, j) {
        if (i !== j) {
            await this.sleep();
            this.onCompare(i, j);
            if (array[i] > array[j]) {
                [array[i], array[j]] = [array[j], array[i]];
                this.onSwap([...array]);
            }
        }
    }

    async stoogeSortRecursive(array, start, end) {
        // If first element is larger than last, swap them
        await this.swap(array, start, end);

        // If there are at least 3 elements in the subarray
        if (end - start + 1 > 2) {
            const third = Math.floor((end - start + 1) / 3);

            // Recursively sort first 2/3 elements
            await this.stoogeSortRecursive(array, start, end - third);

            // Recursively sort last 2/3 elements
            await this.stoogeSortRecursive(array, start + third, end);

            // Recursively sort first 2/3 elements again
            await this.stoogeSortRecursive(array, start, end - third);
        }
    }

    async sort(array) {
        await this.stoogeSortRecursive(array, 0, array.length - 1);
        return array;
    }
}

export { StoogeSort };