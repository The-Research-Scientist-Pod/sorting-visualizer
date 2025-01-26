// threeWayQuickSort.js

class ThreeWayQuickSort {
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

    // Choose pivot - using median of three
    async choosePivot(array, low, high) {
        const mid = Math.floor((low + high) / 2);

        await this.sleep();
        this.onCompare(low, mid);
        if (array[low] > array[mid]) {
            await this.swap(array, low, mid);
        }

        await this.sleep();
        this.onCompare(low, high);
        if (array[low] > array[high]) {
            await this.swap(array, low, high);
        }

        await this.sleep();
        this.onCompare(mid, high);
        if (array[mid] > array[high]) {
            await this.swap(array, mid, high);
        }

        // Use middle element as pivot
        await this.swap(array, mid, high - 1);
        return array[high - 1];
    }

    async partition(array, low, high) {
        const pivot = await this.choosePivot(array, low, high);

        let lt = low;      // Less than pivot
        let i = low;       // Current element
        let gt = high;     // Greater than pivot

        while (i <= gt) {
            await this.sleep();
            this.onCompare(i, high - 1); // Compare with pivot

            if (array[i] < pivot) {
                await this.swap(array, lt++, i++);
            } else if (array[i] > pivot) {
                await this.swap(array, i, gt--);
            } else {
                i++;
            }
        }

        return { lt, gt }; // Return the boundaries of equal elements
    }

    async quickSort(array, low, high) {
        if (low >= high) return;

        if (high - low <= 10) {
            // Use insertion sort for small subarrays
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
            return;
        }

        const { lt, gt } = await this.partition(array, low, high);

        // Recursively sort elements less than and greater than pivot
        await this.quickSort(array, low, lt - 1);
        await this.quickSort(array, gt + 1, high);
    }

    async sort(array) {
        await this.quickSort(array, 0, array.length - 1);
        return array;
    }
}

export { ThreeWayQuickSort };