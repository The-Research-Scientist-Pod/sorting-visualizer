import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { BubbleSort } from '@/algorithms/index.js';
import { QuickSort } from "@/algorithms/index.js";

import {
    ARRAY_SIZE,
    MIN_SPEED,
    MAX_SPEED,
    DEFAULT_SPEED,
    ALGORITHMS
} from './constants';

/**
 * Creates an initial rainbow-colored array where each element's value corresponds
 * to its position, creating a smooth color gradient when visualized.
 * This could be modified for different initial states for different algorithms.
 */
const INITIAL_RAINBOW = Array.from({ length: ARRAY_SIZE }, (_, i) => i + 1);

/**
 * SortingVisualizer is a React component that provides an interactive visualization
 * of various sorting algorithms. It supports multiple sorting algorithms, animation
 * controls, and real-time visualization of the sorting process.
 */
const SortingVisualizer = () => {
    // Core state for managing the array and sorting process
    const [array, setArray] = useState(INITIAL_RAINBOW);
    const [currentIndices, setCurrentIndices] = useState([]);
    const [isSorting, setIsSorting] = useState(false);
    const [speed, setSpeed] = useState(DEFAULT_SPEED);
    const [selectedAlgorithm, setSelectedAlgorithm] = useState(ALGORITHMS.BUBBLE_SORT);

    // Refs for controlling the sorting process across re-renders
    const isPaused = useRef(false);
    const isCancelled = useRef(false);
    const currentSorter = useRef(null);

    // UI state for button text
    const [pauseText, setPauseText] = useState('Pause');

    // Initialize component and handle cleanup
    useEffect(() => {
        resetToRainbow();
        // Cleanup function to ensure sorting stops when component unmounts
        return () => {
            isCancelled.current = true;
        };
    }, []);

    /**
     * Converts a numeric value to an HSL color string, creating a rainbow effect
     * where each array element gets a unique color based on its value.
     */
    const getColor = (value) => {
        const hue = (value / ARRAY_SIZE) * 360;
        return `hsl(${hue}, 100%, 50%)`;
    };

    /**
     * Calculates the delay between sorting operations based on the current speed.
     * Uses an exponential function to provide smooth speed control.
     */
    const calculateDelay = (speed) => {
        return Math.max(0, Math.floor(200 * Math.pow(0.95, speed)));
    };

    /**
     * Factory function that creates a new sorter instance based on the selected
     * algorithm. This makes it easy to add new sorting algorithms without
     * modifying the visualization logic.
     */
    const createSorter = () => {
        const config = {
            delay: calculateDelay(speed),
            isPaused,
            isCancelled,
            onStep: (newArray) => setArray([...newArray]),
            onCompare: (i, j) => setCurrentIndices([i, j]),
            onSwap: (newArray) => setArray([...newArray])
        };

        // Add new algorithm cases here as they're implemented
        switch (selectedAlgorithm) {
            case ALGORITHMS.BUBBLE_SORT:
                return new BubbleSort(config);
            case ALGORITHMS.QUICK_SORT:
                return new QuickSort(config);
            default:
                return new BubbleSort(config);
        }
    };

    /**
     * Resets the visualization to its initial rainbow state.
     * Handles cleanup of any running sort operation.
     */
    const resetToRainbow = () => {
        // Signal any running sort to stop
        isCancelled.current = true;

        // Reset all state variables
        setArray([...INITIAL_RAINBOW]);
        setCurrentIndices([]);
        setIsSorting(false);
        isPaused.current = false;
        setPauseText('Pause');

        // Clear the cancel flag after ensuring the sort has stopped
        setTimeout(() => {
            isCancelled.current = false;
        }, 100);
    };

    /**
     * Performs a Fisher-Yates shuffle on the current array.
     * Only available when not currently sorting.
     */
    const shuffleArray = () => {
        if (isSorting) return;

        const newArray = [...array];
        for (let i = newArray.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
        }
        setArray(newArray);
        setCurrentIndices([]);
    };

    /**
     * Initiates or resumes the sorting process using the selected algorithm.
     * Handles the complete lifecycle of a sort operation including error cases.
     */
    const startSort = async () => {
        if (isSorting && !isPaused.current) return;

        // Reset cancellation state and create new sorter
        isCancelled.current = false;
        currentSorter.current = createSorter();

        // Update UI state
        setIsSorting(true);
        isPaused.current = false;
        setPauseText('Pause');

        try {
            await currentSorter.current.sort([...array]);
            // Only reset states if we weren't cancelled
            if (!isCancelled.current) {
                setIsSorting(false);
                isPaused.current = false;
                setPauseText('Pause');
                setCurrentIndices([]);
            }
        } catch (error) {
            console.error('Sorting error:', error);
            // Only reset on actual errors, not cancellation
            if (error.message !== 'Sorting cancelled') {
                resetToRainbow();
            }
        }
    };

    /**
     * Toggles the pause state of the current sorting operation.
     */
    const togglePause = () => {
        if (!isSorting) return;
        isPaused.current = !isPaused.current;
        setPauseText(isPaused.current ? 'Resume' : 'Pause');
    };

    return (
        <div className="p-4 w-full max-w-4xl mx-auto">
            {/* Algorithm selection and speed control section */}
            <div className="mb-2 flex gap-4 justify-between">
                <select
                    value={selectedAlgorithm}
                    onChange={(e) => {
                        // Only allow algorithm change when not sorting
                        if (!isSorting) {
                            setSelectedAlgorithm(e.target.value);
                        }
                    }}
                    disabled={isSorting}
                    className="px-3 py-2 border rounded-md text-sm"
                >
                    {Object.values(ALGORITHMS).map((algo) => (
                        <option key={algo} value={algo}>
                            {algo}
                        </option>
                    ))}
                </select>
                <div className="flex items-center gap-4 min-w-[300px]">
                    <span className="text-sm whitespace-nowrap">Speed: {speed}x</span>
                    <input
                        type="range"
                        min={MIN_SPEED}
                        max={MAX_SPEED}
                        value={speed}
                        onChange={(e) => setSpeed(parseInt(e.target.value))}
                        disabled={isSorting && !isPaused.current}
                        className="w-full"
                    />
                    <span className="text-sm text-gray-500">
                        {calculateDelay(speed)}ms
                    </span>
                </div>
            </div>

            {/* Control buttons section */}
            <div className="mb-4 flex gap-4">
                <Button
                    onClick={resetToRainbow}
                    disabled={!isSorting && array.every((value, index) => value === INITIAL_RAINBOW[index])}
                    className="bg-blue-500 hover:bg-blue-600"
                >
                    Reset to Rainbow
                </Button>
                <Button
                    onClick={shuffleArray}
                    disabled={isSorting}
                    className="bg-yellow-500 hover:bg-yellow-600"
                >
                    Shuffle Array
                </Button>
                <Button
                    onClick={startSort}
                    disabled={isSorting && !isPaused.current}
                    className="bg-green-500 hover:bg-green-600"
                >
                    Start {selectedAlgorithm}
                </Button>
                {isSorting && (
                    <Button
                        onClick={togglePause}
                        className={isPaused.current ? "bg-blue-500 hover:bg-blue-600" : "bg-yellow-500 hover:bg-yellow-600"}
                    >
                        {pauseText}
                    </Button>
                )}
            </div>

            {/* Visualization section */}
            <div className="h-96 bg-gray-100 rounded-lg flex">
                {array.map((value, idx) => (
                    <div
                        key={idx}
                        style={{
                            width: `${100 / ARRAY_SIZE}%`,
                            height: '100%',
                            backgroundColor: getColor(value),
                            display: 'inline-block',
                            transition: 'background-color 0.1s ease',
                            opacity: currentIndices.includes(idx) ? '0.7' : '1'
                        }}
                    />
                ))}
            </div>
        </div>
    );
};

export default SortingVisualizer;