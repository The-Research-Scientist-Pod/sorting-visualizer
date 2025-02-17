class BitonicSort {
    constructor(config) {
        this.delay = config.delay;
        this.isPaused = config.isPaused;
        this.isCancelled = config.isCancelled;
        this.onStep = config.onStep;
        this.onCompare = config.onCompare;
        this.onSwap = config.onSwap;
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

    async compare(array, i, j) {
        if (i < this.originalLength && j < this.originalLength) {
            this.onCompare(i, j);
            await this.sleep();
        }
    }

    async swap(array, i, j) {
        if (i !== j) {
            await this.compare(array, i, j);
            [array[i], array[j]] = [array[j], array[i]];
            if (i < this.originalLength || j < this.originalLength) {
                const visArray = array.slice(0, this.originalLength);
                this.onSwap([...visArray]);
            }
            await this.sleep();
        }
    }

    async compareAndSwap(array, i, j, dir) {
        await this.compare(array, i, j);

        // For ascending order (dir=1), swap if first > second
        // For descending order (dir=0), swap if first < second
        const shouldSwap = (dir === 1) ? (array[i] > array[j]) : (array[i] < array[j]);

        if (shouldSwap) {
            await this.swap(array, i, j);
        }

        const visArray = array.slice(0, this.originalLength);
        this.onStep([...visArray]);
    }

    async bitonicSubsequence(array, start, length, ascending) {
        if (length <= 1) return;

        const mid = Math.floor(length / 2);

        // Create bitonic subsequences recursively
        await this.bitonicSubsequence(array, start, mid, true);
        await this.bitonicSubsequence(array, start + mid, length - mid, false);

        // Merge the subsequences
        await this.bitonicMerge(array, start, length, ascending);
    }

    async bitonicMerge(array, start, length, ascending) {
        if (length <= 1) return;

        const mid = Math.floor(length / 2);

        // Compare and swap corresponding elements
        for (let i = 0; i < mid; i++) {
            await this.compareAndSwap(array, start + i, start + i + mid, ascending ? 1 : 0);
        }

        // Recursively merge smaller sequences
        await this.bitonicMerge(array, start, mid, ascending);
        await this.bitonicMerge(array, start + mid, length - mid, ascending);
    }

    async sort(array) {
        this.originalLength = array.length;

        // Create padded array
        const workingArray = [...array];
        const nextPowerOfTwo = Math.pow(2, Math.ceil(Math.log2(workingArray.length)));

        // Pad with infinities for proper bitonic sequence
        while (workingArray.length < nextPowerOfTwo) {
            workingArray.push(Infinity);
        }

        // Create initial bitonic sequence and merge
        await this.bitonicSubsequence(workingArray, 0, workingArray.length, true);

        // Get result without padding
        const result = workingArray.slice(0, this.originalLength);

        // Show final state
        this.onStep([...result]);

        return result;
    }
}

export { BitonicSort };