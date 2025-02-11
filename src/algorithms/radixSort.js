import { SortingAlgorithm } from "@/algorithms/base.js";

export class RadixSort extends SortingAlgorithm {
    async sort(array) {
        try {
            let max = Math.max(...array);

            // Track the number of digits for progress
            const totalDigits = Math.floor(Math.log10(max)) + 1;
            let currentDigit = 1;

            // Perform counting sort for each digit (1s, 10s, 100s, ...)
            for (let exp = 1; Math.floor(max / exp) > 0; exp *= 10) {
                // Highlight the current digit position we're sorting
                this.onStep?.([...array]);
                await this.countingSort(array, exp, currentDigit / totalDigits);
                currentDigit++;
            }

            return array;
        } catch (error) {
            if (error.message === "Sorting cancelled") {
                return array; // Allow graceful cancellation
            }
            throw error;
        }
    }

    async countingSort(array, exp, progressFactor) {
        const n = array.length;
        const output = new Array(n);
        const count = new Array(10).fill(0);

        // Phase 1: Count occurrences of digits
        for (let i = 0; i < n; i++) {
            await this.sleep();
            const digit = Math.floor(array[i] / exp) % 10;
            count[digit]++;

            // Play sound based on the digit being counted (0-9)
            // Use a higher pitch for larger digits
            const normalizedValue = (digit + 1) * (array.length / 10);
            this.onCompare?.(i, Math.floor(normalizedValue * progressFactor));
        }

        // Calculate cumulative count
        for (let i = 1; i < 10; i++) {
            count[i] += count[i - 1];
        }

        // Phase 2: Build output array with audio feedback
        for (let i = n - 1; i >= 0; i--) {
            await this.sleep();
            const digit = Math.floor(array[i] / exp) % 10;
            const position = count[digit] - 1;
            output[position] = array[i];
            count[digit]--;

            // Play movement sound
            // Use the value being moved for pitch
            this.onCompare?.(i, position);

            // Visualize and play sound for each placement
            const tempArray = new Array(n).fill(0);
            for (let j = 0; j <= i; j++) {
                if (output[j] !== undefined) {
                    tempArray[j] = output[j];
                } else {
                    tempArray[j] = array[j];
                }
            }
            this.onSwap?.(tempArray);
        }

        // Phase 3: Copy back to original array with final audio feedback
        for (let i = 0; i < n; i++) {
            await this.sleep();
            const oldValue = array[i];
            array[i] = output[i];

            // Play sound based on the final position
            // Higher pitch for larger values
            const normalizedValue = (array[i] / Math.max(...array)) * array.length;
            this.onCompare?.(i, Math.floor(normalizedValue));

            // Only trigger swap sound if values actually changed
            if (oldValue !== array[i]) {
                this.onSwap?.([...array]);
            }
        }

        return array;
    }
}