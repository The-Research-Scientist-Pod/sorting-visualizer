import {SortingAlgorithm} from "@/algorithms/base.js";

export class ShellSort extends SortingAlgorithm {
    constructor(config) {
        super(config);
    }

    async sort(array) {
        try {
            const n = array.length;

            // Start with a big gap, then reduce the gap
            for (let gap = Math.floor(n/2); gap > 0; gap = Math.floor(gap/2)) {
                await this.checkState();

                // Do a gapped insertion sort for this gap size
                for (let i = gap; i < n; i++) {
                    await this.checkState();

                    // Add a[i] to the elements that have been gap sorted
                    let temp = array[i];
                    let j;

                    // Shift earlier gap-sorted elements up until the correct location for a[i] is found
                    for (j = i; j >= gap; j -= gap) {
                        await this.checkState();

                        // Visualize comparison
                        await this.compare(array, j - gap, j);

                        if (array[j - gap] > temp) {
                            array[j] = array[j - gap];
                            this.onStep?.(array);
                        } else {
                            break;
                        }
                    }

                    // Put temp (the original a[i]) in its correct location
                    array[j] = temp;
                    this.onStep?.(array);
                }
            }

            return array;
        } catch (error) {
            if (error.message === 'Sorting cancelled') {
                return array;
            }
            throw error;
        }
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