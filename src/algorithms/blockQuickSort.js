// blockQuickSort.js
class BlockQuickSort {
    constructor(config) {
        this.delay = config.delay;
        this.isPaused = config.isPaused;
        this.isCancelled = config.isCancelled;
        this.onStep = config.onStep;
        this.onCompare = config.onCompare;
        this.onSwap = config.onSwap;
        this.blockSize = 128; // Typical cache line size
    }

    async sleep() {
        if (this.isCancelled.current) {
            throw new Error('Sorting cancelled');
        }
        while (this.isPaused.current) {
            await new Promise(resolve => setTimeout(resolve, 100));
            if (this.isCancelled.current) {
                throw new Error('Sorting cancelled');
            }
        }
        return new Promise(resolve => setTimeout(resolve, this.delay));
    }

    async swap(array, i, j) {
        if (i !== j) {
            [array[i], array[j]] = [array[j], array[i]];
            this.onSwap([...array]);
        }
    }

    async blockPartition(array, low, high) {
        const pivot = array[high];
        const offsets = new Array(this.blockSize).fill(0);
        let lastOffset = 0;

        // Process blocks
        for (let i = low; i < high; i += this.blockSize) {
            const blockEnd = Math.min(i + this.blockSize, high);
            let numSmaller = 0;

            // Count elements smaller than pivot in block
            for (let j = i; j < blockEnd; j++) {
                await this.sleep();
                this.onCompare(j, high);
                if (array[j] <= pivot) {
                    offsets[numSmaller++] = j;
                }
            }

            // Swap elements in block
            for (let j = 0; j < numSmaller; j++) {
                if (offsets[j] !== lastOffset) {
                    await this.swap(array, offsets[j], low + lastOffset);
                }
                lastOffset++;
            }
        }

        await this.swap(array, low + lastOffset, high);
        return low + lastOffset;
    }

    async sort(array, left = 0, right = array.length - 1) {
        if (left < right) {
            if (right - left <= 10) {
                // Use insertion sort for small subarrays
                for (let i = left + 1; i <= right; i++) {
                    let j = i;
                    while (j > left) {
                        await this.sleep();
                        this.onCompare(j, j - 1);
                        if (array[j] < array[j - 1]) {
                            await this.swap(array, j, j - 1);
                            j--;
                        } else {
                            break;
                        }
                    }
                }
                return array;
            }

            const pi = await this.blockPartition(array, left, right);
            await this.sort(array, left, pi - 1);
            await this.sort(array, pi + 1, right);
        }
        return array;
    }
}

export {BlockQuickSort};