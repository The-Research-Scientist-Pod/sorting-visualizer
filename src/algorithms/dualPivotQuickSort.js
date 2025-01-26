// dualPivotQuickSort.js

class DualPivotQuickSort {
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

    // Initialize pivots - ensure left pivot is smaller than right pivot
    async initializePivots(array, left, right) {
        await this.sleep();
        this.onCompare(left, right);
        if (array[left] > array[right]) {
            await this.swap(array, left, right);
        }
        return { leftPivot: array[left], rightPivot: array[right] };
    }

    async dualPivotPartition(array, left, right) {
        const { leftPivot, rightPivot } = await this.initializePivots(array, left, right);

        let less = left + 1;      // pointer for elements < leftPivot
        let greater = right - 1;   // pointer for elements > rightPivot
        let k = less;             // scanning pointer

        while (k <= greater) {
            await this.sleep();

            if (array[k] < leftPivot) {
                // Element belongs to first part
                this.onCompare(k, left);
                await this.swap(array, k, less);
                less++;
                k++;
            } else if (array[k] > rightPivot) {
                // Element belongs to third part
                this.onCompare(k, right);
                await this.swap(array, k, greater);
                greater--;
                // Don't increment k as we need to check the swapped element
            } else {
                // Element belongs to middle part
                this.onCompare(k, left);
                this.onCompare(k, right);
                k++;
            }
        }

        // Put pivots in their final positions
        less--;
        greater++;
        await this.swap(array, left, less);
        await this.swap(array, right, greater);

        return { less, greater };
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

            const { less, greater } = await this.dualPivotPartition(array, left, right);

            // Recursively sort subarrays
            await this.sort(array, left, less - 1);      // Elements smaller than left pivot
            await this.sort(array, less + 1, greater - 1); // Elements between pivots
            await this.sort(array, greater + 1, right);    // Elements larger than right pivot
        }
        return array;
    }
}

export { DualPivotQuickSort };