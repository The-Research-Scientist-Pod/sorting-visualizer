import { SortingAlgorithm } from "@/algorithms/base.js";

export class StalinSort extends SortingAlgorithm {
    constructor(config) {
        super(config);
    }

    async sort(array) {
        try {
            await this.stalinSort(array, 0, array.length - 1);
            return array;
        } catch (error) {
            if (error.message === 'Sorting cancelled') {
                return array;
            }
            throw error;
        }
    }

    async stalinSort(array, start, end) {
        await this.checkState();
        let lastValue = array[start];
        let writeIndex = start + 1;
        let readIndex = start + 1;

        while (readIndex <= end) {
            await this.checkState();
            await this.compare(array, readIndex - 1, readIndex);

            if (array[readIndex] >= lastValue) {
                // Keep this element
                if (writeIndex !== readIndex) {
                    this.swap(array, writeIndex, readIndex);
                }
                lastValue = array[writeIndex];
                writeIndex++;
            }
            readIndex++;
            this.onStep?.(array);
        }

        // Truncate array to remove eliminated elements
        array.length = writeIndex;
        this.onStep?.(array);
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