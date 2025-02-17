// randomQuickSort.js
class RandomQuickSort {
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
        // Randomly select pivot
        const randomPivotIndex = Math.floor(Math.random() * (high - low + 1)) + low;
        await this.swap(array, randomPivotIndex, high);

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

    async sort(array, left = 0, right = array.length - 1) {
        if (left < right) {
            if (right - left <= 10) {
                // Use insertion sort for small subarrays
                for (let i = left + 1; i <= right; i++) {
                    let j = i;
                    while (j > left) {
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
                return array;
            }

            const pi = await this.partition(array, left, right);
            await this.sort(array, left, pi - 1);
            await this.sort(array, pi + 1, right);
        }
        return array;
    }
}

export {RandomQuickSort};