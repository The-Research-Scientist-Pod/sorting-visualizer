import { SortingAlgorithm } from "@/algorithms/base.js";

export class LibrarySort extends SortingAlgorithm {
    constructor(config) {
        super(config);
    }

    async sort(array) {
        const n = array.length;
        if (n <= 1) return array;

        // Create a temporary array with gaps
        const temp = new Array(n * 2).fill(null); // Using 2x space for gaps
        temp[0] = array[0];
        let insertedCount = 1;

        // Insert elements one by one
        for (let i = 1; i < n; i++) {
            const current = array[i];

            // Find insertion point through binary search
            let insertPos = await this.findInsertionPoint(temp, current, insertedCount);

            // Shift elements to make space if needed
            for (let j = insertedCount - 1; j >= insertPos; j--) {
                if (temp[j] !== null) {
                    temp[j + 2] = temp[j]; // Leave a gap
                }
            }

            // Insert the element
            temp[insertPos] = current;
            insertedCount++;

            // Rebalance the gaps when section becomes too crowded
            if (i % 10 === 0) { // Rebalance periodically
                await this.rebalance(temp, insertedCount);
            }

            // Update the original array for visualization
            await this.updateOriginalArray(array, temp);
            this.onStep(array);
        }

        return array;
    }

    async findInsertionPoint(temp, value, count) {
        let left = 0;
        let right = count * 2; // Search through the gapped space

        while (left < right) {
            const mid = Math.floor((left + right) / 2);

            // Find the nearest non-null element to compare
            let comparePos = mid;
            while (comparePos >= 0 && temp[comparePos] === null) {
                comparePos--;
            }

            if (comparePos < 0 || (temp[comparePos] !== null && temp[comparePos] < value)) {
                left = mid + 1;
            } else {
                right = mid;
            }

            await this.sleep();
        }

        // Find first non-null position from left
        while (left < temp.length && temp[left] !== null) {
            left++;
        }

        return left;
    }

    async rebalance(temp, count) {
        const nonNullElements = [];

        // Collect all non-null elements
        for (let i = 0; i < temp.length; i++) {
            if (temp[i] !== null) {
                nonNullElements.push(temp[i]);
            }
        }

        // Clear the temp array
        temp.fill(null);

        // Redistribute elements with even gaps
        for (let i = 0; i < nonNullElements.length; i++) {
            temp[i * 2] = nonNullElements[i];
            await this.sleep();
        }
    }

    async updateOriginalArray(array, temp) {
        let index = 0;
        for (let i = 0; i < temp.length && index < array.length; i++) {
            if (temp[i] !== null) {
                if (array[index] !== temp[i]) {
                    array[index] = temp[i];
                    this.onSwap(array);
                }
                index++;
            }
            this.onCompare(i, index);
        }
    }
}