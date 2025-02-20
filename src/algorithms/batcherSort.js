class BatcherSort {
    constructor(config = {}) {
        // Provide sensible defaults
        this.delay = config.delay ?? 100;

        // Handle refs or plain objects for control flags
        this.isPaused = config.isPaused && typeof config.isPaused === "object"
            ? config.isPaused
            : { current: !!config.isPaused };
        this.isCancelled = config.isCancelled && typeof config.isCancelled === "object"
            ? config.isCancelled
            : { current: !!config.isCancelled };

        // Callbacks with proper defaults
        this.onStep = config.onStep || ((array) => {});
        this.onCompare = config.onCompare || ((i, j) => {});
        this.onSwap = config.onSwap || ((array) => {});

        // Store comparators
        this.comparators = [];
    }

    async sleep() {
        if (this.isCancelled.current) {
            throw new Error("Sorting cancelled");
        }

        while (this.isPaused.current) {
            await new Promise(resolve => setTimeout(resolve, 100));
            if (this.isCancelled.current) {
                throw new Error("Sorting cancelled");
            }
        }

        return new Promise(resolve => setTimeout(resolve, this.delay));
    }

    async compare(array, i, j) {
        this.onCompare(i, j);
        await this.sleep();
        return array[i] > array[j];
    }

    async swap(array, i, j) {
        if (i === j) return;

        [array[i], array[j]] = [array[j], array[i]];
        this.onSwap([...array]);
        await this.sleep();
    }

    async compareAndSwap(array, i, j) {
        const shouldSwap = await this.compare(array, i, j);
        if (shouldSwap) {
            await this.swap(array, i, j);
            return true;
        }
        return false;
    }

    // S function handles the merging of two sorted sequences
    S(procsUp, procsDown) {
        const procCount = procsUp.length + procsDown.length;

        if (procCount === 1) {
            return;
        } else if (procCount === 2) {
            this.comparators.push([procsUp[0], procsDown[0]]);
            return;
        }

        // Split into odd and even indices
        const procsUpOdd = procsUp.filter((_, i) => i % 2 === 0);
        const procsUpEven = procsUp.filter((_, i) => i % 2 === 1);
        const procsDownOdd = procsDown.filter((_, i) => i % 2 === 0);
        const procsDownEven = procsDown.filter((_, i) => i % 2 === 1);

        // Recursive calls
        this.S(procsUpOdd, procsDownOdd);
        this.S(procsUpEven, procsDownEven);

        // Combine results
        const procsResult = [...procsUp, ...procsDown];

        // Add comparators for adjacent elements
        for (let i = 1; i + 1 < procsResult.length; i += 2) {
            this.comparators.push([procsResult[i], procsResult[i + 1]]);
        }
    }

    // B function handles the recursive splitting
    B(procs) {
        if (procs.length <= 1) {
            return;
        }

        const mid = Math.floor(procs.length / 2);
        const procsUp = procs.slice(0, mid);
        const procsDown = procs.slice(mid);

        // Recursive calls
        this.B(procsUp);
        this.B(procsDown);
        this.S(procsUp, procsDown);
    }

    // Generate comparison network
    generateComparisonNetwork(n) {
        this.comparators = [];
        // Create array of indices [0, 1, 2, ..., n-1]
        const indices = Array.from({ length: n }, (_, i) => i);
        this.B(indices);
        return this.comparators;
    }

    async sort(array) {
        if (!array || !array.length) {
            return array;
        }

        // Create a copy of the input array
        let arrayClone = [...array];
        const originalLength = arrayClone.length;

        // Calculate next power of 2 and pad if necessary
        const nextPow2 = Math.pow(2, Math.ceil(Math.log2(originalLength)));
        const needsPadding = nextPow2 !== originalLength;

        if (needsPadding) {
            const padValue = Number.MAX_SAFE_INTEGER;
            arrayClone = arrayClone.concat(new Array(nextPow2 - originalLength).fill(padValue));
        }

        // Generate the comparison network
        const comparators = this.generateComparisonNetwork(arrayClone.length);

        try {
            // Process each comparator pair
            for (const [i, j] of comparators) {
                await this.compareAndSwap(arrayClone, i, j);
                this.onStep(needsPadding ? arrayClone.slice(0, originalLength) : [...arrayClone]);
            }
        } catch (error) {
            if (error.message === "Sorting cancelled") {
                throw error;
            }
            console.error("Error during sorting:", error);
            throw error;
        }

        // Remove padding before returning
        const result = needsPadding ? arrayClone.slice(0, originalLength) : arrayClone;
        this.onStep([...result]);
        return result;
    }
}

export { BatcherSort };