import {SortingAlgorithm} from "@/algorithms/base.js";

export class TimSort extends SortingAlgorithm {
    async sort(array) {
        try {
            const n = array.length;
            const RUN_LENGTH = 32;  // Traditional TimSort run length

            // Create runs using insertion sort
            for (let i = 0; i < n; i += RUN_LENGTH) {
                await this.insertionSort(array, i, Math.min(i + RUN_LENGTH, n));
            }

            // Start merging runs
            for (let size = RUN_LENGTH; size < n; size *= 2) {
                for (let start = 0; start < n - size; start += size * 2) {
                    const mid = start + size;
                    const end = Math.min(start + size * 2, n);
                    await this.merge(array, start, mid, end);
                }
            }

            return array;
        } catch (error) {
            if (error.message === 'Sorting cancelled') {
                return array;
            }
            throw error;
        }
    }

    async insertionSort(array, left, right) {
        for (let i = left + 1; i < right; i++) {
            for (let j = i; j > left; j--) {
                if (await this.compare(array, j - 1, j)) {
                    this.swap(array, j - 1, j);
                } else {
                    break;
                }
            }
        }
    }

    async merge(array, left, mid, right) {
        const temp = new Array(right - left);
        let i = left;
        let j = mid;
        let k = 0;

        while (i < mid && j < right) {
            if (await this.compare(array, j, i)) {
                temp[k++] = array[i++];
            } else {
                temp[k++] = array[j++];
            }
        }

        // Copy remaining elements
        while (i < mid) {
            temp[k++] = array[i++];
        }
        while (j < right) {
            temp[k++] = array[j++];
        }

        // Copy back to original array
        for (i = 0; i < k; i++) {
            array[left + i] = temp[i];
            this.onStep?.(array);
        }
    }
}