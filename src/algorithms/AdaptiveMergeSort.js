// Adaptive Merge Sort
import {SortingAlgorithm} from "@/algorithms/base.js";

export class AdaptiveMergeSort extends SortingAlgorithm {
    constructor(config) {
        super(config);
        this.runSize = 32; // Minimum run size for TimSort-like behavior
    }

    async sort(array) {
        const arrayClone = [...array];
        const n = arrayClone.length;

        // Find natural runs and extend them to minimum run size
        const runs = await this.identifyRuns(arrayClone);

        // Merge runs until only one remains
        while (runs.length > 1) {
            await this.mergeRuns(arrayClone, runs);
        }

        return arrayClone;
    }

    async identifyRuns(array) {
        const runs = [];
        let start = 0;
        const n = array.length;

        while (start < n) {
            let end = start + 1;

            // Find naturally sorted sequence
            while (end < n) {
                await this.compare(array, end - 1, end);
                if (array[end - 1] > array[end]) break;
                end++;
            }

            // If run is too small, extend it using insertion sort
            if (end - start < this.runSize) {
                end = Math.min(start + this.runSize, n);
                await this.insertionSort(array, start, end);
            }

            runs.push({ start, end });
            start = end;
        }

        return runs;
    }

    async mergeRuns(array, runs) {
        const newRuns = [];

        for (let i = 0; i < runs.length - 1; i += 2) {
            const run1 = runs[i];
            const run2 = runs[i + 1];

            await this.merge(array, run1.start, run2.start, run2.end);
            newRuns.push({ start: run1.start, end: run2.end });
        }

        // Add remaining run if odd number of runs
        if (runs.length % 2 === 1) {
            newRuns.push(runs[runs.length - 1]);
        }

        runs.length = 0;
        runs.push(...newRuns);
    }

    async insertionSort(array, start, end) {
        for (let i = start + 1; i < end; i++) {
            const key = array[i];
            let j = i - 1;

            while (j >= start) {
                await this.compare(array, j, j + 1);
                if (array[j] <= key) break;

                array[j + 1] = array[j];
                this.onSwap(array);
                j--;
            }

            array[j + 1] = key;
            this.onSwap(array);
        }
    }

    async merge(array, start, mid, end) {
        const temp = [];
        let left = start;
        let right = mid;

        while (left < mid && right < end) {
            await this.compare(array, left, right);

            if (array[left] <= array[right]) {
                temp.push(array[left++]);
            } else {
                temp.push(array[right++]);
            }
        }

        while (left < mid) temp.push(array[left++]);
        while (right < end) temp.push(array[right++]);

        for (let i = 0; i < temp.length; i++) {
            array[start + i] = temp[i];
            this.onSwap(array);
            await this.sleep();
        }
    }
}