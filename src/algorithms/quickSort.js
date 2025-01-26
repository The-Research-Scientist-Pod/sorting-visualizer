import { SortingAlgorithm } from './base';

export class QuickSort extends SortingAlgorithm {
    /**
     * Main sorting method that initiates the QuickSort algorithm
     * @param {Array} array The array to be sorted
     * @returns {Promise<Array>} The sorted array
     */
    async sort(array) {
        try {
            await this.quickSort(array, 0, array.length - 1);
            return array;
        } catch (error) {
            if (error.message === 'Sorting cancelled') {
                return array;
            }
            throw error;
        }
    }

    /**
     * Recursive QuickSort implementation
     */
    async quickSort(array, low, high) {
        if (low < high) {
            const pivotIndex = await this.partition(array, low, high);
            await this.quickSort(array, low, pivotIndex - 1);
            await this.quickSort(array, pivotIndex + 1, high);
        }
    }

    /**
     * Partitions the array around a pivot
     */
    async partition(array, low, high) {
        let i = low - 1;

        // Use the high element as pivot
        for (let j = low; j < high; j++) {
            // Compare current element with pivot (high)
            if (await this.compare(array, high, j)) {
                i++;
                if (i !== j) {
                    this.swap(array, i, j);
                }
            }
        }

        // Place pivot in its correct position
        const pivotPosition = i + 1;
        if (pivotPosition !== high) {
            this.swap(array, pivotPosition, high);
        }

        return pivotPosition;
    }
}