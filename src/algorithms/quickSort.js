import {SortingAlgorithm} from "@/algorithms/base.js";

export class QuickSort extends SortingAlgorithm {
    async sort(array) {
        try {
            if (this.isCancelled?.current) {
                throw new Error('Sorting cancelled');
            }
            await this.quickSort(array, 0, array.length - 1);
            return array;
        } catch (error) {
            if (error.message === 'Sorting cancelled') {
                return array;
            }
            throw error;
        }
    }

    async quickSort(array, low, high) {
        // Check cancelled state at each recursive call
        if (this.isCancelled?.current) {
            throw new Error('Sorting cancelled');
        }

        if (low < high) {
            // Always check if cancelled before each major operation
            if (this.isCancelled?.current) {
                throw new Error('Sorting cancelled');
            }

            const pivotIndex = await this.partition(array, low, high);

            if (this.isCancelled?.current) {
                throw new Error('Sorting cancelled');
            }

            await this.quickSort(array, low, pivotIndex - 1);

            if (this.isCancelled?.current) {
                throw new Error('Sorting cancelled');
            }

            await this.quickSort(array, pivotIndex + 1, high);
        }
    }

    async partition(array, low, high) {
        if (this.isCancelled?.current) {
            throw new Error('Sorting cancelled');
        }

        let i = low - 1;

        for (let j = low; j < high; j++) {
            if (this.isCancelled?.current) {
                throw new Error('Sorting cancelled');
            }

            // Use compare which includes its own state checks
            if (await this.compare(array, j, high)) {
                i++;
                if (this.isCancelled?.current) {
                    throw new Error('Sorting cancelled');
                }
                this.swap(array, i, j);
            }
        }

        if (this.isCancelled?.current) {
            throw new Error('Sorting cancelled');
        }

        this.swap(array, i + 1, high);
        return i + 1;
    }
}