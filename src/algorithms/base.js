import { AudioHelper } from './audioHelper';

export class SortingAlgorithm {
    constructor({ delay, isPaused, isCancelled, onStep, onCompare, onSwap, isSoundEnabled }) {
        this.delay = delay;
        this.isPaused = isPaused;
        this.isCancelled = isCancelled;
        this.onStep = onStep;
        this.onCompare = onCompare;
        this.onSwap = onSwap;
        this.isSoundEnabled = isSoundEnabled;
        this.audioHelper = new AudioHelper();
    }

    async checkState() {
        if (this.isCancelled?.current) {
            throw new Error('Sorting cancelled');
        }

        while (this.isPaused?.current && !this.isCancelled?.current) {
            await new Promise(resolve => setTimeout(resolve, 100));
        }

        if (this.isCancelled?.current) {
            throw new Error('Sorting cancelled');
        }
    }

    async compare(array, i, j) {
        await this.checkState();
        this.onCompare?.(i, j);
        if (this.isSoundEnabled?.current) {
            this.audioHelper.createCompareSound();
        }
        await new Promise(resolve => setTimeout(resolve, this.delay));
        return array[i] > array[j];
    }

    swap(array, i, j) {
        [array[i], array[j]] = [array[j], array[i]];
        this.onSwap?.(array);
        if (this.isSoundEnabled?.current) {
            this.audioHelper.createSwapSound();
        }
    }
}