// base.js
export class SortingAlgorithm {
    constructor({ delay, isPaused, isCancelled, onStep, onCompare, onSwap }) {
        this.delay = delay;
        this.isPaused = isPaused;
        this.isCancelled = isCancelled;  // Add cancellation support
        this.onStep = onStep;
        this.onCompare = onCompare;
        this.onSwap = onSwap;
    }

    // Add a method to check for cancellation and handle pausing
    async checkState() {
        // If cancelled, throw an error to stop the sorting process
        if (this.isCancelled?.current) {
            throw new Error('Sorting cancelled');
        }

        // Handle pausing by waiting until unpaused or cancelled
        while (this.isPaused?.current && !this.isCancelled?.current) {
            await new Promise(resolve => setTimeout(resolve, 100));
        }

        // Check cancellation one more time after unpausing
        if (this.isCancelled?.current) {
            throw new Error('Sorting cancelled');
        }
    }

    async compare(array, i, j) {
        await this.checkState();  // Check state before comparison
        this.onCompare?.(i, j);
        await new Promise(resolve => setTimeout(resolve, this.delay));
        return array[i] > array[j];
    }

    swap(array, i, j) {
        [array[i], array[j]] = [array[j], array[i]];
        this.onSwap?.(array);
    }
}

// bubbleSort.js
export class BubbleSort extends SortingAlgorithm {
    async sort(array) {
        try {
            const n = array.length;
            for (let i = 0; i < n - 1; i++) {
                for (let j = 0; j < n - i - 1; j++) {
                    // The checkState call is now handled in the compare method
                    if (await this.compare(array, j, j + 1)) {
                        this.swap(array, j, j + 1);
                    }
                }
            }
            return array;
        } catch (error) {
            // If sorting was cancelled, we'll catch the error here
            if (error.message === 'Sorting cancelled') {
                // We can handle cancellation cleanup here if needed
                return array;
            }
            throw error; // Re-throw any other errors
        }
    }
}