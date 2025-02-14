import { SortingAlgorithm } from "@/algorithms/base.js";

export class MergeSort extends SortingAlgorithm {
    constructor(config) {
        super(config);
        this.totalElements = 0;
    }

    async sort(array) {
        try {
            this.totalElements = array.length;
            const result = await this.mergeSort(array, 0, array.length - 1);
            return result;
        } catch (error) {
            if (error.message === "Sorting cancelled") {
                return array;
            }
            throw error;
        }
    }

    async mergeSort(array, left, right) {
        await this.checkState();
        if (left < right) {
            const mid = Math.floor((left + right) / 2);
            // Sort the left and right halves recursively
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
        const mergeSize = right - left + 1;

        // Create temporary arrays
        const L = new Array(n1);
        const R = new Array(n2);
        for (let i = 0; i < n1; i++) {
            L[i] = array[left + i];
        }
        for (let j = 0; j < n2; j++) {
            R[j] = array[mid + 1 + j];
        }

        let i = 0, j = 0, k = left;
        let mergedCount = 0;

        // Merge the two arrays
        while (i < n1 && j < n2) {
            await this.checkState();
            // Delay to control speed
            await new Promise(resolve => setTimeout(resolve, this.delay));

            // Report a regular comparison event
            if (this.onCompare) {
                this.onCompare(left + i, mid + 1 + j, "compare");
            }

            if (L[i] <= R[j]) {
                if (array[k] !== L[i]) {
                    array[k] = L[i];
                    if (this.onSwap) this.onSwap(array);
                }
                i++;
            } else {
                if (array[k] !== R[j]) {
                    array[k] = R[j];
                    if (this.onSwap) this.onSwap(array);
                }
                j++;
            }

            mergedCount++;
            // Trigger merge progress so that the merge sound can start or update.
            if (this.onCompare) {
                const progress = mergedCount / mergeSize;
                this.onCompare(k, k, "mergeProgress", progress);
            }
            if (this.onStep) this.onStep(array);
            k++;
        }

        // Copy any remaining elements from L
        while (i < n1) {
            await this.checkState();
            if (array[k] !== L[i]) {
                array[k] = L[i];
                if (this.onSwap) this.onSwap(array);
            }
            mergedCount++;
            if (this.onCompare) {
                const progress = mergedCount / mergeSize;
                this.onCompare(k, k, "mergeProgress", progress);
            }
            if (this.onStep) this.onStep(array);
            i++;
            k++;
        }

        // Copy any remaining elements from R
        while (j < n2) {
            await this.checkState();
            if (array[k] !== R[j]) {
                array[k] = R[j];
                if (this.onSwap) this.onSwap(array);
            }
            mergedCount++;
            if (this.onCompare) {
                const progress = mergedCount / mergeSize;
                this.onCompare(k, k, "mergeProgress", progress);
            }
            if (this.onStep) this.onStep(array);
            j++;
            k++;
        }

        // End the merge phase by signaling mergeEnd.
        // This event can be used by the visualizer to schedule cleanup of the merge sound.
        if (this.onCompare) {
            this.onCompare(left, right, "mergeEnd");
        }
    }

    async checkState() {
        if (this.isPaused && this.isPaused.current) {
            // Signal the end of merge sound when pausing
            if (this.onCompare) {
                this.onCompare(0, 0, "mergeEnd");
            }
            while (this.isPaused.current) {
                await new Promise(resolve => setTimeout(resolve, 100));
            }
        }
        if (this.isCancelled && this.isCancelled.current) {
            if (this.onCompare) {
                this.onCompare(0, 0, "mergeEnd");
            }
            throw new Error("Sorting cancelled");
        }
    }
}
