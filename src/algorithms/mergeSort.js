import {SortingAlgorithm} from "@/algorithms/base.js";

export class MergeSort extends SortingAlgorithm {
    constructor(config) {
        super(config);
    }

    async sort(array) {
        try {
            const result = await this.mergeSort(array, 0, array.length - 1);
            return result;
        } catch (error) {
            if (error.message === 'Sorting cancelled') {
                return array;
            }
            throw error;
        }
    }

    async mergeSort(array, left, right) {
        await this.checkState();

        if (left < right) {
            const mid = Math.floor((left + right) / 2);

            // Sort first and second halves
            await this.mergeSort(array, left, mid);
            await this.mergeSort(array, mid + 1, right);

            // Merge the sorted halves
            await this.merge(array, left, mid, right);
        }

        return array;
    }

    async merge(array, left, mid, right) {
        const n1 = mid - left + 1;
        const n2 = right - mid;

        // Create temp arrays
        const L = new Array(n1);
        const R = new Array(n2);

        // Copy data to temp arrays L[] and R[]
        for (let i = 0; i < n1; i++) {
            L[i] = array[left + i];
        }
        for (let j = 0; j < n2; j++) {
            R[j] = array[mid + 1 + j];
        }

        let i = 0;
        let j = 0;
        let k = left;

        // Merge temp arrays back into array[left..right]
        while (i < n1 && j < n2) {
            await this.checkState();

            // Visualize comparison of elements
            this.onCompare?.(left + i, mid + 1 + j);
            await new Promise(resolve => setTimeout(resolve, this.delay));

            if (L[i] <= R[j]) {
                array[k] = L[i];
                i++;
            } else {
                array[k] = R[j];
                j++;
            }

            // Visualize the placement of element
            this.onStep?.(array);
            // Play merge sound every few elements to create a sweeping effect
            if (this.onCompare && k % 3 === 0) {
                this.onCompare(k, k, 'merge');
            }
            k++;
        }

        // Copy remaining elements of L[] if any
        while (i < n1) {
            await this.checkState();
            array[k] = L[i];
            this.onStep?.(array);
            i++;
            k++;
        }

        // Copy remaining elements of R[] if any
        while (j < n2) {
            await this.checkState();
            array[k] = R[j];
            this.onStep?.(array);
            j++;
            k++;
        }
    }

    async checkState() {
        if (this.isCancelled?.current) {
            throw new Error('Sorting cancelled');
        }

        while (this.isPaused?.current && !this.isCancelled?.current) {
            await new Promise(resolve => setTimeout(resolve, 100));
        }

        if (this.isCancelled?.current) {
            throw new Error('Sorting cancelled');
        }
    }

    async compare(array, i, j) {
        await this.checkState();
        this.onCompare?.(i, j);
        await new Promise(resolve => setTimeout(resolve, this.delay));
        return array[i] > array[j];
    }

    swap(array, i, j) {
        [array[i], array[j]] = [array[j], array[i]];
        this.onSwap?.(array);
    }
}
