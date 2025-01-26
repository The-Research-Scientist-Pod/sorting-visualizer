// bogoSort.js

class BogoSort {
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

    async isSorted(array) {
        for (let i = 1; i < array.length; i++) {
            await this.sleep();
            this.onCompare(i - 1, i);
            if (array[i - 1] > array[i]) {
                return false;
            }
        }
        return true;
    }

    async shuffle(array) {
        const n = array.length;

        // Fisher-Yates shuffle
        for (let i = n - 1; i > 0; i--) {
            await this.sleep();
            const j = Math.floor(Math.random() * (i + 1));

            // Visualize comparison
            this.onCompare(i, j);

            // Swap elements
            [array[i], array[j]] = [array[j], array[i]];

            // Visualize swap
            this.onSwap([...array]);
        }
    }

    async sort(array) {
        // Add a safety limit to prevent infinite loops
        const MAX_ITERATIONS = 1000;
        let iterations = 0;

        while (!(await this.isSorted(array)) && iterations < MAX_ITERATIONS) {
            await this.shuffle(array);
            iterations++;
        }

        if (iterations >= MAX_ITERATIONS) {
            throw new Error('Bogo Sort exceeded maximum iterations');
        }

        return array;
    }
}

export { BogoSort };