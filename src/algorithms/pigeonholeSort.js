// pigeonholeSort.js

class PigeonholeSort {
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
        const n = array.length;

        // Find min and max values
        let min = array[0];
        let max = array[0];

        for (let i = 1; i < n; i++) {
            await this.sleep();
            this.onCompare(0, i);
            if (array[i] < min) {
                min = array[i];
            }
            if (array[i] > max) {
                max = array[i];
            }
        }

        // Size of the range of values
        const range = max - min + 1;

        // Create holes (pigeonholes)
        const holes = new Array(range).fill(0);

        // Put elements into holes (Distribution phase)
        for (let i = 0; i < n; i++) {
            await this.sleep();
            const index = array[i] - min;
            this.onCompare(i, index);
            holes[index]++;

            // Create a temporary array for visualization
            const tempArray = [...array];
            tempArray[i] = min + index;
            this.onSwap(tempArray);
        }

        // Put elements back into original array (Collection phase)
        let index = 0;

        for (let i = 0; i < range; i++) {
            while (holes[i] > 0) {
                await this.sleep();
                array[index] = i + min;

                // Visualize putting elements back
                this.onCompare(index, i);
                this.onSwap([...array]);

                holes[i]--;
                index++;
            }
        }

        return array;
    }
}

export { PigeonholeSort };