// Parallel Merge Sort (simulated for visualization)
import {SortingAlgorithm} from "@/algorithms/base.js";

export class ParallelMergeSort extends SortingAlgorithm {
    constructor(config) {
        super(config);
        this.numThreads = 4; // Simulated thread count
    }

    async sort(array) {
        const arrayClone = [...array];
        const n = arrayClone.length;
        const chunkSize = Math.ceil(n / this.numThreads);

        // Simulate parallel sorting of chunks
        const chunks = [];
        for (let i = 0; i < n; i += chunkSize) {
            const end = Math.min(i + chunkSize, n);
            chunks.push(this.sortChunk(arrayClone, i, end));
        }

        // Wait for all chunks to be sorted
        await Promise.all(chunks);

        // Merge sorted chunks
        let width = chunkSize;
        while (width < n) {
            const mergeOps = [];
            for (let i = 0; i < n; i += 2 * width) {
                const mid = Math.min(i + width, n);
                const end = Math.min(i + 2 * width, n);
                mergeOps.push(this.merge(arrayClone, i, mid, end));
            }
            await Promise.all(mergeOps);
            width *= 2;
        }

        return arrayClone;
    }

    async sortChunk(array, start, end) {
        // Use regular merge sort for each chunk
        const mergeSort = async (left, right) => {
            if (right - left <= 1) return;

            const mid = Math.floor((left + right) / 2);
            await mergeSort(left, mid);
            await mergeSort(mid, right);
            await this.merge(array, left, mid, right);
        };

        await mergeSort(start, end);
    }

    async merge(array, start, mid, end) {
        let left = start;
        let right = mid;
        const temp = [];

        while (left < mid && right < end) {
            await this.compare(array, left, right);

            if (array[left] <= array[right]) {
                temp.push(array[left++]);
            } else {
                temp.push(array[right++]);
            }
        }

        // Copy remaining elements
        while (left < mid) temp.push(array[left++]);
        while (right < end) temp.push(array[right++]);

        // Copy back to original array
        for (let i = 0; i < temp.length; i++) {
            array[start + i] = temp[i];
            this.onSwap(array);
            await this.sleep();
        }
    }
}
