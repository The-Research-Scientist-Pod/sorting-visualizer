import { SortingAlgorithm } from './base.js';


export class NaturalMergeSort extends SortingAlgorithm {
    constructor(config) {
        super(config);
    }

    // Find naturally sorted runs in the array
    async findRuns(array) {
        const runs = [];
        let start = 0;

        while (start < array.length) {
            let end = start + 1;
            // Find the end of the current sorted run
            while (end < array.length) {
                this.onCompare(end - 1, end);
                if (array[end - 1] > array[end]) break;
                end++;
                await this.sleep();
            }
            runs.push({ start, end });
            start = end;
        }
        return runs;
    }

    async merge(array, start, mid, end) {
        const left = array.slice(start, mid);
        const right = array.slice(mid, end);
        let i = 0, j = 0, k = start;

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
        let isSorted = false;

        while (!isSorted) {
            // Find naturally sorted runs
            const runs = await this.findRuns(array);

            // If we only have one run, the array is sorted
            if (runs.length === 1) {
                isSorted = true;
                break;
            }

            // Merge pairs of runs
            for (let i = 0; i < runs.length - 1; i += 2) {
                const run1 = runs[i];
                const run2 = runs[i + 1];
                await this.merge(array, run1.start, run1.end, run2.end);
            }
        }

        return array;
    }
}
