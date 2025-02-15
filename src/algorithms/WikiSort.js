import { SortingAlgorithm } from './base.js';

// Block Merge Sort (also known as Wikisort)
export class WikiSort extends SortingAlgorithm {
    constructor(config) {
        super(config);
        this.blockSize = 32; // Adjustable block size
    }

    async sort(array) {
        const n = array.length;
        const arrayClone = [...array];

        // First pass: sort individual blocks
        for (let i = 0; i < n; i += this.blockSize) {
            const blockEnd = Math.min(i + this.blockSize, n);
            await this.insertionSort(arrayClone, i, blockEnd);
        }

        // Merge sorted blocks
        for (let width = this.blockSize; width < n; width *= 2) {
            for (let i = 0; i < n; i += 2 * width) {
                const mid = Math.min(i + width, n);
                const end = Math.min(i + 2 * width, n);
                await this.merge(arrayClone, i, mid, end);
            }
        }

        return arrayClone;
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
        let left = start;
        let right = mid;

        while (left < mid && right < end) {
            await this.compare(array, left, right);

            if (array[left] <= array[right]) {
                left++;
            } else {
                const value = array[right];
                let index = right;

                // Shift elements
                while (index > left) {
                    array[index] = array[index - 1];
                    this.onSwap(array);
                    index--;
                }

                array[left] = value;
                this.onSwap(array);

                left++;
                mid++;
                right++;
            }
        }
    }
}