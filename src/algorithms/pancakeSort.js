// pancakeSort.js

class PancakeSort {
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

    // Helper function to flip a portion of the array from start to end
    async flip(array, end) {
        let start = 0;
        while (start < end) {
            await this.sleep();
            this.onCompare(start, end);

            // Swap elements
            const temp = array[start];
            array[start] = array[end];
            array[end] = temp;

            this.onSwap([...array]);
            start++;
            end--;
        }
    }

    // Helper function to find index of maximum element in the array from 0 to end
    async findMaxIndex(array, end) {
        let maxIndex = 0;
        for (let i = 1; i <= end; i++) {
            await this.sleep();
            this.onCompare(i, maxIndex);
            if (array[i] > array[maxIndex]) {
                maxIndex = i;
            }
        }
        return maxIndex;
    }

    async sort(array) {
        const n = array.length;

        // Start from the whole array and reduce size by one in each iteration
        for (let currentSize = n; currentSize > 1; currentSize--) {
            // Find index of maximum element in the unsorted portion
            const maxIndex = await this.findMaxIndex(array, currentSize - 1);

            if (maxIndex !== currentSize - 1) {
                // If the maximum element is not at its correct position

                // First flip: Bring maximum element to the beginning
                if (maxIndex !== 0) {
                    await this.flip(array, maxIndex);
                }

                // Second flip: Move maximum element to its correct position
                await this.flip(array, currentSize - 1);
            }
        }

        return array;
    }
}

export { PancakeSort };