export class SortingAlgorithm {
    constructor(config) {
        this.delay = config.delay || 100;
        this.isPaused = config.isPaused || { current: false };
        this.onStep = config.onStep || (() => {});
        this.onCompare = config.onCompare || (() => {});
        this.onSwap = config.onSwap || (() => {});
    }

    async sleep() {
        return new Promise(resolve => {
            const check = () => {
                if (!this.isPaused.current) {
                    setTimeout(resolve, this.delay);
                } else {
                    setTimeout(check, 100);
                }
            };
            check();
        });
    }

    // Helper method to swap elements and notify visualization
    swap(array, i, j) {
        [array[i], array[j]] = [array[j], array[i]];
        this.onSwap(array);
    }

    // Helper method to compare elements and notify visualization
    async compare(array, i, j) {
        this.onCompare(i, j);
        await this.sleep();
        return array[i] > array[j];
    }

    // Abstract method that must be implemented by concrete sorting algorithms
    async sort() {  // Removed unused parameter
        throw new Error('sort() method must be implemented');
    }
}