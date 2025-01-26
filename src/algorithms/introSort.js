import {SortingAlgorithm} from "@/algorithms/base.js";

export class IntroSort extends SortingAlgorithm {
    async sort(array) {
        try {
            const maxDepth = Math.floor(2 * Math.log2(array.length));
            await this.introSortUtil(array, 0, array.length - 1, maxDepth);
            return array;
        } catch (error) {
            if (error.message === 'Sorting cancelled') {
                return array;
            }
            throw error;
        }
    }

    async introSortUtil(array, low, high, maxDepth) {
        // Size of the array
        const size = high - low + 1;

        // If array size is small, use insertion sort
        if (size < 16) {
            await this.insertionSort(array, low, high);
            return;
        }

        // If max depth is 0, switch to heap sort
        if (maxDepth === 0) {
            await this.heapSort(array, low, high);
            return;
        }

        // Otherwise, use quicksort
        const pivot = await this.partition(array, low, high);
        await this.introSortUtil(array, low, pivot - 1, maxDepth - 1);
        await this.introSortUtil(array, pivot + 1, high, maxDepth - 1);
    }

    async insertionSort(array, low, high) {
        for (let i = low + 1; i <= high; i++) {
            for (let j = i; j > low; j--) {
                if (await this.compare(array, j - 1, j)) {
                    this.swap(array, j - 1, j);
                } else {
                    break;
                }
            }
        }
    }

    async heapSort(array, low, high) {
        const n = high - low + 1;

        // Build heap
        for (let i = Math.floor(n / 2) - 1; i >= 0; i--) {
            await this.heapify(array, n, i, low);
        }

        // Extract elements from heap one by one
        for (let i = n - 1; i > 0; i--) {
            this.swap(array, low, low + i);
            await this.heapify(array, i, 0, low);
        }
    }

    async heapify(array, n, i, low) {
        let largest = i;
        const left = 2 * i + 1;
        const right = 2 * i + 2;

        if (left < n && await this.compare(array, low + largest, low + left)) {
            largest = left;
        }

        if (right < n && await this.compare(array, low + largest, low + right)) {
            largest = right;
        }

        if (largest !== i) {
            this.swap(array, low + i, low + largest);
            await this.heapify(array, n, largest, low);
        }
    }

    async partition(array, low, high) {
        // Use median-of-three for pivot selection
        const mid = low + Math.floor((high - low) / 2);

        // Sort low, mid, high
        if (await this.compare(array, low, mid)) {
            this.swap(array, low, mid);
        }
        if (await this.compare(array, low, high)) {
            this.swap(array, low, high);
        }
        if (await this.compare(array, mid, high)) {
            this.swap(array, mid, high);
        }

        // Place pivot at second-to-last position
        this.swap(array, mid, high - 1);
        const pivot = array[high - 1];

        // Partition
        let i = low - 1;

        for (let j = low; j < high - 1; j++) {
            if (array[j] <= pivot) {
                i++;
                this.swap(array, i, j);
            }
        }

        this.swap(array, i + 1, high - 1);
        return i + 1;
    }
}