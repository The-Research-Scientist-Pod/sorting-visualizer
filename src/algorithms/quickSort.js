import {SortingAlgorithm} from "@/algorithms/base.js";

export class QuickSort extends SortingAlgorithm {
    constructor(config) {
        super(config);
    }

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

    async quickSort(array, low, high) {
        if (low < high) {
            await this.checkState();
            const pivotIndex = await this.partition(array, low, high);
            await this.quickSort(array, low, pivotIndex - 1);
            await this.quickSort(array, pivotIndex + 1, high);
        }
    }

    async partition(array, low, high) {
        const pivot = array[high];
        let i = low - 1;

        for (let j = low; j < high; j++) {
            await this.checkState();
            await this.compare(array, j, high);

            if (array[j] < pivot) {
                i++;
                this.swap(array, i, j);
                this.onStep?.(array);
            }
        }

        this.swap(array, i + 1, high);
        this.onStep?.(array);
        return i + 1;
    }

    async checkState() {
        if (this.isCancelled?.current) {
            throw new Error('Sorting cancelled');
        }

        while (this.isPaused?.current && !this.isCancelled?.current) {
            await new Promise(resolve => setTimeout(resolve, 100));
        }

        if (this.isCancelled?.current) {
            throw new Error('Sorting cancelled');
        }
    }

    async compare(array, i, j) {
        await this.checkState();
        this.onCompare?.(i, j);
        await new Promise(resolve => setTimeout(resolve, this.delay));
        return array[i] > array[j];
    }

    swap(array, i, j) {
        [array[i], array[j]] = [array[j], array[i]];
        this.onSwap?.(array);
    }
}