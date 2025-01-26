import {SortingAlgorithm} from "@/algorithms/base.js";

export class CocktailSort extends SortingAlgorithm {
    async sort(array) {
        try {
            if (this.isCancelled?.current) {
                throw new Error('Sorting cancelled');
            }

            let start = 0;
            let end = array.length - 1;
            let swapped = true;

            while (swapped) {
                if (this.isCancelled?.current) {
                    throw new Error('Sorting cancelled');
                }

                // Reset swapped flag for forward pass
                swapped = false;

                // Forward pass (left to right)
                for (let i = start; i < end; i++) {
                    if (this.isCancelled?.current) {
                        throw new Error('Sorting cancelled');
                    }

                    if (await this.compare(array, i, i + 1)) {
                        this.swap(array, i, i + 1);
                        swapped = true;
                    }
                }

                // If nothing was swapped, array is sorted
                if (!swapped) {
                    break;
                }

                // Move end point back as largest element is in place
                end--;

                // Reset swapped flag for backward pass
                swapped = false;

                // Backward pass (right to left)
                for (let i = end - 1; i >= start; i--) {
                    if (this.isCancelled?.current) {
                        throw new Error('Sorting cancelled');
                    }

                    if (await this.compare(array, i, i + 1)) {
                        this.swap(array, i, i + 1);
                        swapped = true;
                    }
                }

                // Move start point forward as smallest element is in place
                start++;
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