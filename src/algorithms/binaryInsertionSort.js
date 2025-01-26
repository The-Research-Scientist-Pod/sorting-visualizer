// binaryInsertionSort.js

class BinaryInsertionSort {
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

    // Binary search to find the insertion position
    async binarySearch(array, item, start, end) {
        while (start <= end) {
            await this.sleep();
            const mid = Math.floor((start + end) / 2);

            // Visualize the binary search comparison
            this.onCompare(mid, item);

            if (array[mid] === item) {
                return mid + 1;
            } else if (array[mid] < item) {
                start = mid + 1;
            } else {
                end = mid - 1;
            }
        }
        return start;
    }

    // Function to shift elements right to make space for insertion
    async shiftElements(array, pos, i) {
        const temp = array[i];
        for (let j = i; j > pos; j--) {
            await this.sleep();
            array[j] = array[j - 1];
            // Visualize each shift operation
            this.onSwap([...array]);
        }
        array[pos] = temp;
        this.onSwap([...array]);
    }

    async sort(array) {
        const n = array.length;

        for (let i = 1; i < n; i++) {
            const key = array[i];
            const pos = await this.binarySearch(array, key, 0, i - 1);

            // If the element is not already in position
            if (pos < i) {
                await this.shiftElements(array, pos, i);
            }
        }

        return array;
    }
}

export { BinaryInsertionSort };