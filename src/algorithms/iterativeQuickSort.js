class IterativeQuickSort {
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
            [array[i], array[j]] = [array[j], array[i]];
            this.onSwap([...array]);
        }
    }

    async partition(array, low, high) {
        const pivot = array[high];
        let i = low - 1;

        for (let j = low; j < high; j++) {
            await this.sleep();
            this.onCompare(j, high);
            if (array[j] <= pivot) {
                i++;
                await this.swap(array, i, j);
            }
        }
        await this.swap(array, i + 1, high);
        return i + 1;
    }

    async insertionSort(array, low, high) {
        for (let i = low + 1; i <= high; i++) {
            let j = i;
            while (j > low) {
                await this.sleep();
                this.onCompare(j, j - 1);
                if (array[j] < array[j - 1]) {
                    await this.swap(array, j, j - 1);
                    j--;
                } else {
                    break;
                }
            }
        }
    }

    async sort(array) {
        const arrayClone = [...array];
        const stack = [];

        // Initial partition
        stack.push(0);
        stack.push(arrayClone.length - 1);

        while (stack.length > 0) {
            const high = stack.pop();
            const low = stack.pop();

            // Use insertion sort for small subarrays
            if (high - low <= 10) {
                await this.insertionSort(arrayClone, low, high);
                continue;
            }

            if (low < high) {
                const pi = await this.partition(arrayClone, low, high);

                // Push subarrays to stack
                if (pi - 1 > low) {
                    stack.push(low);
                    stack.push(pi - 1);
                }
                if (pi + 1 < high) {
                    stack.push(pi + 1);
                    stack.push(high);
                }
            }
        }

        return arrayClone;
    }
}

export { IterativeQuickSort };