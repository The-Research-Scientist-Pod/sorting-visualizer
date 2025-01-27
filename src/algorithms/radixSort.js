import { SortingAlgorithm } from "@/algorithms/base.js";

export class RadixSort extends SortingAlgorithm {
    async sort(array) {
        try {
            let max = Math.max(...array);

            // Perform counting sort for each digit (1s, 10s, 100s, ...)
            for (let exp = 1; Math.floor(max / exp) > 0; exp *= 10) {
                await this.countingSort(array, exp);
            }

            return array;
        } catch (error) {
            if (error.message === "Sorting cancelled") {
                return array; // Allow graceful cancellation
            }
            throw error;
        }
    }

    async countingSort(array, exp) {
        const n = array.length;
        const output = new Array(n);
        const count = new Array(10).fill(0);

        // Count occurrences of digits
        for (let i = 0; i < n; i++) {
            await this.sleep();
            const digit = Math.floor(array[i] / exp) % 10;
            count[digit]++;
            this.onCompare?.(i, digit); // Visualize count phase
        }

        // Calculate positions
        for (let i = 1; i < 10; i++) {
            count[i] += count[i - 1];
        }

        // Build the output array
        for (let i = n - 1; i >= 0; i--) {
            await this.sleep();
            const digit = Math.floor(array[i] / exp) % 10;
            const position = count[digit] - 1;
            output[position] = array[i];
            count[digit]--;

            // Visualize movement
            this.onCompare?.(i, position);
            this.onSwap?.([...output]); // Show progress of building output
        }

        // Copy output back to the original array
        for (let i = 0; i < n; i++) {
            await this.sleep();
            array[i] = output[i];

            // Visualize the updated array
            this.onSwap?.([...array]);
        }

        return array;
    }
}
