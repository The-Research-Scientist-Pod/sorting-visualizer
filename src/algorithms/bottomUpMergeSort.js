import { SortingAlgorithm } from './base.js';

export class BottomUpMergeSort extends SortingAlgorithm {
    constructor(config) {
        super(config);
    }

    async merge(array, start, mid, end) {
        const left = array.slice(start, mid);
        const right = array.slice(mid, end);
        let i = 0, j = 0, k = start;

        // Signal start of merge
        this.onCompare(start, end - 1, 'merge');

        while (i < left.length && j < right.length) {
            const progress = (k - start) / (end - start);
            this.onCompare(k, k, 'mergeProgress', progress);

            this.onCompare(start + i, mid + j);
            if (left[i] <= right[j]) {
                array[k] = left[i];
                i++;
            } else {
                array[k] = right[j];
                j++;
            }
            this.onSwap(array);
            k++;
            await this.sleep();
        }

        // Handle remaining elements
        while (i < left.length) {
            const progress = (k - start) / (end - start);
            this.onCompare(k, k, 'mergeProgress', progress);
            array[k] = left[i];
            this.onSwap(array);
            i++;
            k++;
            await this.sleep();
        }

        while (j < right.length) {
            const progress = (k - start) / (end - start);
            this.onCompare(k, k, 'mergeProgress', progress);
            array[k] = right[j];
            this.onSwap(array);
            j++;
            k++;
            await this.sleep();
        }

        this.onCompare(start, end - 1, 'mergeEnd');
        this.onStep(array);
    }

    async sort(array) {
        const n = array.length;

        // Iterate through different sizes of subarrays to merge
        for (let width = 1; width < n; width *= 2) {
            // Merge subarrays of current width
            for (let i = 0; i < n - width; i += width * 2) {
                const end = Math.min(i + width * 2, n);
                await this.merge(array, i, i + width, end);
            }
        }
        return array;
    }
}