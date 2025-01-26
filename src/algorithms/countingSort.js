// countingSort.js

class CountingSort {
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

    async sort(array) {
        const n = array.length;
        const max = Math.max(...array);
        const min = Math.min(...array);
        const range = max - min + 1;

        // Create count array and output array
        const count = new Array(range).fill(0);
        const output = new Array(n);

        // Store count of each element
        for (let i = 0; i < n; i++) {
            await this.sleep();
            const value = array[i];
            count[value - min]++;
            // Visualize counting process
            this.onCompare(i, value - min);
        }

        // Modify count array to contain actual positions
        for (let i = 1; i < range; i++) {
            count[i] += count[i - 1];
        }

        // Build the output array from right to left to maintain stability
        for (let i = n - 1; i >= 0; i--) {
            await this.sleep();
            const value = array[i];
            const pos = count[value - min] - 1;
            output[pos] = value;
            count[value - min]--;

            // Create temporary array for visualization
            const tempArray = [...array];
            tempArray[i] = output[pos];

            // Visualize placement
            this.onCompare(i, pos);
            this.onSwap(tempArray);
        }

        // Copy output array back to original array with visualization
        for (let i = 0; i < n; i++) {
            await this.sleep();
            array[i] = output[i];
            this.onSwap([...array]);
        }

        return array;
    }
}

export { CountingSort };