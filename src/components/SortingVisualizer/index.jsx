import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import * as SortingAlgorithms from '@/algorithms/index.js';
import {
    ARRAY_SIZE,
    MIN_SPEED,
    MAX_SPEED,
    DEFAULT_SPEED,
    ALGORITHMS
} from './constants';

const INITIAL_RAINBOW = Array.from({ length: ARRAY_SIZE }, (_, i) => i + 1);

const SortingVisualizer = () => {
    // Core state
    const [array, setArray] = useState(INITIAL_RAINBOW);
    const [currentIndices, setCurrentIndices] = useState([]);
    const [isSorting, setIsSorting] = useState(false);
    const [speed, setSpeed] = useState(DEFAULT_SPEED);
    const [selectedAlgorithm, setSelectedAlgorithm] = useState(ALGORITHMS.BUBBLE_SORT);
    const [isComplete, setIsComplete] = useState(false);

    // Refs
    const isPaused = useRef(false);
    const isCancelled = useRef(false);
    const currentSorter = useRef(null);
    const [pauseText, setPauseText] = useState('Pause');

    useEffect(() => {
        setArray([...INITIAL_RAINBOW]);
        return () => {
            isCancelled.current = true;
        };
    }, []);

    const getColor = (value, index) => {
        if (currentIndices.includes(index)) {
            const hue = (value / ARRAY_SIZE) * 360;
            return `hsla(${hue}, 100%, 50%, 0.7)`;
        }
        const hue = (value / ARRAY_SIZE) * 360;
        return `hsl(${hue}, 100%, 50%)`;
    };

    const calculateDelay = (speed) => {
        const baseDelay = 500;
        return Math.max(0, Math.floor(baseDelay * Math.pow(0.97, speed)));
    };

    const createSorter = () => {
        const config = {
            delay: calculateDelay(speed),
            isPaused,
            isCancelled,
            onStep: (newArray) => setArray([...newArray]),
            onCompare: (i, j) => setCurrentIndices([i, j]),
            onSwap: (newArray) => setArray([...newArray])
        };

        const Algorithm = SortingAlgorithms[selectedAlgorithm.replace(/\s+/g, '')];
        return new Algorithm(config);
    };

    const shuffleArray = () => {
        if (isSorting) return;

        const newArray = [...array];
        for (let i = newArray.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
        }
        setArray(newArray);
        setCurrentIndices([]);
        setIsComplete(false);
    };

    const showCompletion = () => {
        setIsComplete(true);
    };

    const startSort = async () => {
        if ((isSorting && !isPaused.current) || array.every((value, index) => value === INITIAL_RAINBOW[index])) {
            return;
        }

        isCancelled.current = false;
        currentSorter.current = createSorter();
        setIsSorting(true);
        isPaused.current = false;
        setPauseText('Pause');
        setIsComplete(false);

        try {
            const sortedArray = await currentSorter.current.sort([...array]);

            if (!isCancelled.current) {
                const isSorted = sortedArray.every((val, idx) =>
                    idx === 0 || sortedArray[idx - 1] <= val
                );

                if (isSorted) {
                    setArray(sortedArray);
                    setIsSorting(false);
                    isPaused.current = false;
                    setPauseText('Pause');
                    setCurrentIndices([]);
                    showCompletion();
                }
            }
        } catch (error) {
            console.error('Sorting error:', error);
            if (error.message !== 'Sorting cancelled') {
                setArray([...INITIAL_RAINBOW]);
                setIsSorting(false);
                isPaused.current = false;
                setPauseText('Pause');
                setCurrentIndices([]);
            }
        }
    };

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
                    <span className="text-sm whitespace-nowrap">
                        Speed: {speed === MAX_SPEED ? 'Max' : `${Math.floor((speed/MAX_SPEED) * 100)}%`}
                    </span>
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
                    onClick={shuffleArray}
                    disabled={isSorting}
                    className="bg-yellow-500 hover:bg-yellow-600"
                >
                    Shuffle Array
                </Button>
                <Button
                    onClick={startSort}
                    disabled={(isSorting && !isPaused.current) || array.every((value, index) => value === INITIAL_RAINBOW[index])}
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

            {/* Completion message */}
            {isComplete && (
                <div className="mb-2 text-center">
                    <span className="bg-green-500 text-white px-4 py-2 rounded-md font-medium">
                        Sorting Complete!
                    </span>
                </div>
            )}

            {/* Visualization section */}
            <div className="h-96 bg-gray-100 rounded-lg flex">
                {array.map((value, idx) => (
                    <div
                        key={idx}
                        style={{
                            width: `${100 / ARRAY_SIZE}%`,
                            height: '100%',
                            backgroundColor: getColor(value, idx),
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