import { SortingAlgorithm } from './base.js';

export class InPlaceMergeSort extends SortingAlgorithm {
    constructor(config) {
        super(config);
    }

    async merge(array, start, mid, end) {
        let left = start;
        let right = mid;

        // If arrays are already sorted, skip merging
        if (array[mid - 1] <= array[mid]) {
            return;
        }

        while (left < mid && right < end) {
            // Compare elements from both subarrays
            await this.compare(array, left, right);

            if (array[left] <= array[right]) {
                left++;
            } else {
                // Save the element to insert
                const value = array[right];

                // Shift all elements between left and right one position to the right
                for (let i = right; i > left; i--) {
                    array[i] = array[i - 1];
                    this.onSwap(array);
                    await this.sleep();
                }

                // Insert the element in its correct position
                array[left] = value;
                this.onSwap(array);

                // Update pointers
                left++;
                mid++;
                right++;
            }
        }
    }

    async sort(array) {
        const arrayClone = [...array];

        // Recursive divide function
        const divide = async (start, end) => {
            if (end - start <= 1) return;

            const mid = Math.floor((start + end) / 2);

            // Divide and sort left half
            await divide(start, mid);

            // Divide and sort right half
            await divide(mid, end);

            // Merge the sorted halves
            await this.merge(arrayClone, start, mid, end);

            // Notify visualization after each merge
            this.onStep(arrayClone);
        };

        await divide(0, arrayClone.length);
        return arrayClone;
    }
}