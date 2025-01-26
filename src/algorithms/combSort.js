import {SortingAlgorithm} from "@/algorithms/base.js";

export class CombSort extends SortingAlgorithm {
    async sort(array) {
        try {
            const n = array.length;

            // Initialize gap as array length
            let gap = n;

            // Set shrink factor
            const shrink = 1.3;

            // Initialize swapped as true to enter the loop
            let swapped = true;

            // Keep running while gap is more than 1 and last iteration caused a swap
            while (gap > 1 || swapped) {
                // Update the gap value for next iteration
                gap = Math.floor(gap / shrink);
                if (gap < 1) {
                    gap = 1;
                }

                swapped = false;

                // Compare all elements with current gap
                for (let i = 0; i + gap < n; i++) {
                    // Compare elements with gap
                    if (await this.compare(array, i, i + gap)) {
                        // Swap if elements are in wrong order
                        this.swap(array, i, i + gap);
                        swapped = true;
                    }
                }
            }

            return array;
        } catch (error) {
            if (error.message === 'Sorting cancelled') {
                return array;
            }
            throw error;
        }
    }
}