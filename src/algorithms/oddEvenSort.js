// oddEvenSort.js

class OddEvenSort {
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

    async compareAndSwap(array, i, j) {
        await this.sleep();
        this.onCompare(i, j);

        if (array[i] > array[j]) {
            [array[i], array[j]] = [array[j], array[i]];
            this.onSwap([...array]);
            return true;
        }
        return false;
    }

    async sort(array) {
        const n = array.length;
        let sorted = false;

        while (!sorted) {
            sorted = true;

            // Odd phase (1, 3, 5, ...)
            for (let i = 1; i < n - 1; i += 2) {
                if (await this.compareAndSwap(array, i, i + 1)) {
                    sorted = false;
                }
            }

            // Even phase (0, 2, 4, ...)
            for (let i = 0; i < n - 1; i += 2) {
                if (await this.compareAndSwap(array, i, i + 1)) {
                    sorted = false;
                }
            }
        }

        return array;
    }
}

export { OddEvenSort };