class MedianQuickSort {
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

    async partition(array, left, right) {
        // Choose the median of three elements as pivot
        const mid = Math.floor((left + right) / 2);

        // Compare and sort left, middle, and right elements
        await this.sleep();
        this.onCompare(left, mid);
        if (array[left] > array[mid]) {
            await this.swap(array, left, mid);
        }

        await this.sleep();
        this.onCompare(mid, right);
        if (array[mid] > array[right]) {
            await this.swap(array, mid, right);
        }

        await this.sleep();
        this.onCompare(left, mid);
        if (array[left] > array[mid]) {
            await this.swap(array, left, mid);
        }

        // Place pivot at the end
        const pivot = array[mid];
        await this.swap(array, mid, right);

        // Partition around the pivot
        let i = left - 1;

        for (let j = left; j < right; j++) {
            await this.sleep();
            this.onCompare(j, right);
            if (array[j] <= pivot) {
                i++;
                await this.swap(array, i, j);
            }
        }

        // Put pivot in its final position
        await this.swap(array, i + 1, right);
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

            const pivotIndex = await this.partition(array, left, right);
            await this.sort(array, left, pivotIndex - 1);
            await this.sort(array, pivotIndex + 1, right);
        }
        return array;
    }
}

export { MedianQuickSort };