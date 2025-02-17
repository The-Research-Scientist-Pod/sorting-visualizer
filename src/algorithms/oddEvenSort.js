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

    async compare(array, i, j) {
        this.onCompare(i, j);
        await this.sleep();
    }

    async swap(array, i, j) {
        if (i !== j) {
            [array[i], array[j]] = [array[j], array[i]];
            this.onSwap([...array]);
            await this.sleep();
        }
    }

    async compareAndSwap(array, i) {
        await this.compare(array, i, i + 1);
        if (array[i] > array[i + 1]) {
            await this.swap(array, i, i + 1);
            return true; // Swap occurred
        }
        return false; // No swap needed
    }

    async sort(array) {
        const arrayClone = [...array];
        const n = arrayClone.length;
        let isSorted = false;

        while (!isSorted) {
            isSorted = true;

            // Odd phase (1, 3, 5, ...)
            for (let i = 1; i < n - 1; i += 2) {
                if (await this.compareAndSwap(arrayClone, i)) {
                    isSorted = false;
                }
            }

            // Update visualization after odd phase
            this.onStep([...arrayClone]);
            await this.sleep();

            // Even phase (0, 2, 4, ...)
            for (let i = 0; i < n - 1; i += 2) {
                if (await this.compareAndSwap(arrayClone, i)) {
                    isSorted = false;
                }
            }

            // Update visualization after even phase
            this.onStep([...arrayClone]);
            await this.sleep();
        }

        // Final visualization update
        this.onStep([...arrayClone]);
        return arrayClone;
    }
}

export { OddEvenSort };