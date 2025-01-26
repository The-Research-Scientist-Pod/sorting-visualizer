import {SortingAlgorithm} from "@/algorithms/base.js";

export class RadixSort extends SortingAlgorithm {
    async sort(array) {
        try {
            // Find the maximum number to know number of digits
            let max = Math.max(...array);

            // Do counting sort for every digit
            for (let exp = 1; Math.floor(max / exp) > 0; exp *= 10) {
                await this.countingSort(array, exp);
            }

            return array;
        } catch (error) {
            if (error.message === 'Sorting cancelled') {
                return array;
            }
            throw error;
        }
    }

    async countingSort(array, exp) {
        const n = array.length;
        const output = new Array(n);
        const count = new Array(10).fill(0);

        // Store count of occurrences in count[]
        for (let i = 0; i < n; i++) {
            const digit = Math.floor(array[i] / exp) % 10;
            count[digit]++;
            await this.compare(array, i, i); // Visualize current element being counted
        }

        // Change count[i] so that count[i] now contains actual
        // position of this digit in output[]
        for (let i = 1; i < 10; i++) {
            count[i] += count[i - 1];
        }

        // Build the output array
        for (let i = n - 1; i >= 0; i--) {
            const digit = Math.floor(array[i] / exp) % 10;
            output[count[digit] - 1] = array[i];
            count[digit]--;

            // Update visualization
            await this.compare(array, i, count[digit]); // Show element being placed
        }

        // Copy the output array to array[], so that array[] now
        // contains sorted numbers according to current digit
        for (let i = 0; i < n; i++) {
            array[i] = output[i];
            this.onStep?.(array);
        }

        return array;
    }
}