// gnomeSort.js

class GnomeSort {
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

    async sort(array) {
        let index = 0;

        while (index < array.length) {
            // If we're at the start or current element is greater/equal to previous
            if (index === 0 || array[index] >= array[index - 1]) {
                if (index > 0) {
                    await this.sleep();
                    this.onCompare(index, index - 1);
                }
                index++;
            } else {
                // If current element is less than previous, swap them
                await this.sleep();
                this.onCompare(index, index - 1);

                // Perform swap
                [array[index], array[index - 1]] = [array[index - 1], array[index]];
                this.onSwap([...array]);

                // Move back one position
                index--;
            }
        }

        return array;
    }
}

export { GnomeSort };