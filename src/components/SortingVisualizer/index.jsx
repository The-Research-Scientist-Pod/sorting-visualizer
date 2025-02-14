import { useState, useEffect, useRef } from 'react';
import { Button } from '../ui/button';
import * as SortingAlgorithms from '@/algorithms/index.js';
import ParticleSystemVisualization from './ParticleSystemVisualization.jsx';
import SizeParticleSystem from './SizeParticleSystemVisualization.jsx';
import DisparityParticleSystem from './DisparityParticleSystemVisualization.jsx';
import AudioManager from './AudioManager';
import {
    MIN_SPEED,
    MAX_SPEED,
    DEFAULT_SPEED,
    ALGORITHMS
} from './constants';

// Define size constraints
const MIN_SIZE = 10;
const MAX_SIZE = 1000;
const DEFAULT_SIZE = 200;

// Visualization modes
const VISUALIZATION_MODES = {
    MOUNTAIN: 'Mountain Mode',
    BAR: 'Bar Mode',
    CIRCLE: 'Circle Mode',
    PARTICLE: 'Rainbow Particles',
    SIZE_PARTICLE: 'Size Particles',
    DISPARITY: 'Disparity Particles'
};
const SortingVisualizer = ({ onDarkModeChange }) => {
    // State management
    const [arraySize, setArraySize] = useState(DEFAULT_SIZE);
    const [array, setArray] = useState([]);
    const [currentIndices, setCurrentIndices] = useState([]);
    const [isSorting, setIsSorting] = useState(false);
    const [speed, setSpeed] = useState(DEFAULT_SPEED);
    const [selectedAlgorithm, setSelectedAlgorithm] = useState(ALGORITHMS.BUBBLE_SORT);
    const [isComplete, setIsComplete] = useState(false);
    const [isSoundEnabled, setIsSoundEnabled] = useState(false);
    const [pauseText, setPauseText] = useState('Pause');
    const [visualizationMode, setVisualizationMode] = useState(VISUALIZATION_MODES.MOUNTAIN);
    const [stats, setStats] = useState({
        comparisons: 0,
        swaps: 0,
        sortedPercentage: 0
    });
    const [isDarkMode, setIsDarkMode] = useState(false);
    const [isDemoMode, setIsDemoMode] = useState(false);
    const [showControls, setShowControls] = useState(true);

    // Refs
    const isPaused = useRef(false);
    const isCancelled = useRef(false);
    const currentSorter = useRef(null);
    const audioManager = useRef(new AudioManager());

    // Initialize audio context on first user interaction
    const initializeAudio = () => {
        audioManager.current.initialize();
        setIsSoundEnabled(true);
    };

    const SOUND_TYPES = ['electronic', 'ambient', 'retro', 'crystal'];
    const [soundType, setSoundType] = useState('electronic');

    const toggleSound = () => {
        if (!isSoundEnabled) {
            initializeAudio();
        } else {
            const isEnabled = audioManager.current.toggleSound();
            setIsSoundEnabled(isEnabled);
        }
    };

    // Update the sound type change handler
    const changeSoundType = (newType) => {
        setSoundType(newType);
        audioManager.current.setSoundType(newType);
        // Update sound type for active RadixSort if applicable
        if (currentSorter.current && selectedAlgorithm === ALGORITHMS.RADIX_SORT) {
            currentSorter.current.audioManager?.setSoundType(newType);
        }
    };

    // Create rainbow array based on current size
    const createRainbowArray = (size) => {
        return Array.from({ length: size }, (_, i) => i + 1);
    };

    // Update array when size changes
    useEffect(() => {
        const newArray = createRainbowArray(arraySize);
        setArray(newArray);
    }, [arraySize]);

    useEffect(() => {
        setArray(createRainbowArray(arraySize));
        return () => {
            isCancelled.current = true;
        };
    }, []);

    const getColor = (value, index) => {
        if (currentIndices.includes(index)) {
            const hue = (value / arraySize) * 360;
            return `hsla(${hue}, 100%, 50%, 0.7)`;
        }
        const hue = (value / arraySize) * 360;
        return `hsl(${hue}, 100%, 50%)`;
    };

    const getHeight = (value) => {
        if (visualizationMode === VISUALIZATION_MODES.BAR) {
            return '100%';
        }
        return `${(value / arraySize) * 100}%`;
    };

    const getRadialBarStyles = (index, value, totalElements) => {
        // Calculate degree for this bar
        const degree = (index / totalElements) * 360;

        return {
            position: 'absolute',
            height: '40%', // Fixed length for bars
            width: '2px', // Thin fixed width for bars
            backgroundColor: getColor(value, index),
            transformOrigin: 'bottom center',
            left: '50%',
            bottom: '50%',
            transform: `rotate(${degree}deg)`,
            transition: 'background-color 0.1s ease',
        };
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
            soundEnabled: isSoundEnabled,  // Pass sound enabled state
            onStep: (newArray) => {
                setArray([...newArray]);
                setStats(prev => ({
                    ...prev,
                    sortedPercentage: calculateSortedPercentage(newArray)
                }));
            },
            onCompare: (i, j, type = 'compare', progress) => {
                setCurrentIndices([i, j]);
                // Only use general audio manager for non-RadixSort algorithms
                if (selectedAlgorithm !== ALGORITHMS.RADIX_SORT && i >= 0 && i < array.length) {
                    if (type === 'mergeProgress' && progress !== undefined) {
                        // Update merge sound frequency based on progress
                        const frequency = audioManager.current.calculateFrequency(
                            Math.floor(progress * array.length),
                            array.length
                        );
                        if (audioManager.current.mergeOscillators) {
                            const now = audioManager.current.audioContext.currentTime;
                            audioManager.current.mergeOscillators.forEach((osc, idx) => {
                                osc.frequency.setValueAtTime(frequency * (idx === 0 ? 1 : 1.5), now);
                            });
                        }
                    } else if (type === 'mergeEnd') {
                        // Stop merge sound
                        if (audioManager.current.mergeGains) {
                            const now = audioManager.current.audioContext.currentTime;
                            audioManager.current.mergeGains.forEach(gain => {
                                gain.gain.linearRampToValueAtTime(0, now + 0.1);
                            });
                            audioManager.current.mergeOscillators = null;
                            audioManager.current.mergeGains = null;
                        }
                    } else {
                        audioManager.current.playNote(array[i], array.length, type);
                    }
                }
                setStats(prev => ({
                    ...prev,
                    comparisons: prev.comparisons + 1
                }));
            },
            onSwap: (newArray) => {
                setArray([...newArray]);
                // Only use general audio manager for non-RadixSort algorithms
                if (selectedAlgorithm !== ALGORITHMS.RADIX_SORT && currentIndices[0] >= 0 && currentIndices[0] < newArray.length) {
                    audioManager.current.playNote(newArray[currentIndices[0]], newArray.length, 'swap');
                }
                setStats(prev => ({
                    ...prev,
                    swaps: prev.swaps + 1,
                    sortedPercentage: calculateSortedPercentage(newArray)
                }));
            }
        };

        const Algorithm = SortingAlgorithms[selectedAlgorithm.replace(/\s+/g, '')];
        const sorter = new Algorithm(config);

        // Initialize RadixSort audio manager if applicable
        if (selectedAlgorithm === ALGORITHMS.RADIX_SORT && sorter.audioManager) {
            if (isSoundEnabled) {
                sorter.audioManager.initialize();
                sorter.audioManager.isEnabled = true;
            }
            sorter.audioManager.setSoundType(soundType);
        }

        return sorter;
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
        setStats({
            comparisons: 0,
            swaps: 0,
            sortedPercentage: calculateSortedPercentage(newArray)
        });
    };

    const showCompletion = () => {
        setIsComplete(true);
        audioManager.current.playCompletion();
    };

    const startSort = async () => {
        const initialArray = createRainbowArray(arraySize);
        if ((isSorting && !isPaused.current) || array.every((value, index) => value === initialArray[index])) {
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
                setArray(createRainbowArray(arraySize));
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

    const cycleVisualizationMode = () => {
        const modes = Object.values(VISUALIZATION_MODES);
        const currentIndex = modes.indexOf(visualizationMode);
        const nextIndex = (currentIndex + 1) % modes.length;
        setVisualizationMode(modes[nextIndex]);
    };


    const calculateSortedPercentage = (arr) => {
        let sortedCount = 0;
        for (let i = 1; i < arr.length; i++) {
            if (arr[i] >= arr[i - 1]) {
                sortedCount++;
            }
        }
        return Math.round((sortedCount / (arr.length - 1)) * 100);
    };

    useEffect(() => {
        let timeout;
        const handleMouseMove = () => {
            if (isDemoMode) {
                setShowControls(true);
                clearTimeout(timeout);
                timeout = setTimeout(() => setShowControls(false), 2000);
            }
        };

        if (isDemoMode) {
            window.addEventListener('mousemove', handleMouseMove);
            setShowControls(false);
        } else {
            setShowControls(true);
        }

        return () => {
            window.removeEventListener('mousemove', handleMouseMove);
            clearTimeout(timeout);
        };
    }, [isDemoMode]);

    return (
        <div 
            className={`p-2 sm:p-4 w-full min-h-screen mx-auto ${isDemoMode ? 'bg-black text-white' : isDarkMode ? 'bg-gray-900 text-white' : 'bg-white text-black'}`}
        >
            <div className="max-w-4xl mx-auto px-2 sm:px-0">
                <style>
                    {`
                        .controls-section {
                            transition: opacity 0.3s ease-in-out;
                        }
                        .controls-hidden {
                            opacity: 0;
                            pointer-events: none;
                        }
                    `}
                </style>
            {/* Controls section */}
            <div className={`mb-2 flex flex-col sm:flex-row gap-4 justify-between items-start controls-section ${!showControls ? 'controls-hidden' : ''}`}>
                <div className="flex flex-wrap gap-2 sm:gap-4">
                    <select
                        value={selectedAlgorithm}
                        onChange={(e) => {
                            if (!isSorting) {
                                setSelectedAlgorithm(e.target.value);
                            }
                        }}
                        disabled={isSorting}
                        className={`px-3 py-2 border rounded-md text-sm ${isDarkMode ? 'bg-gray-800 text-white border-gray-600' : 'bg-white text-black border-gray-300'}`}
                    >
                        {Object.values(ALGORITHMS).map((algo) => (
                            <option key={algo} value={algo}>
                                {algo}
                            </option>
                        ))}
                    </select>
                    <div className="flex gap-2">
                        <Button
                            onClick={toggleSound}
                            className={`${
                                isSoundEnabled ? 'bg-blue-500 hover:bg-blue-600' : 'bg-gray-500 hover:bg-gray-600'
                            }`}
                        >
                            Sound {isSoundEnabled ? 'On' : 'Off'}
                        </Button>
                        {isSoundEnabled && (
                            <select
                                value={soundType}
                                onChange={(e) => changeSoundType(e.target.value)}
                                className={`px-3 py-2 border rounded-md text-sm ${
                                    isDarkMode ? 'bg-gray-800 text-white border-gray-600' : 'bg-white text-black border-gray-300'
                                }`}
                            >
                                {SOUND_TYPES.map((type) => (
                                    <option key={type} value={type}>
                                        {type.charAt(0).toUpperCase() + type.slice(1)} Sound
                                    </option>
                                ))}
                            </select>
                        )}
                    </div>
                    <div className="flex gap-2">
                        <Button
                            onClick={cycleVisualizationMode}
                            className="bg-indigo-500 hover:bg-indigo-600"
                        >
                            {visualizationMode}
                        </Button>
                        <Button
                            onClick={() => {
                                const newMode = !isDarkMode;
                                setIsDarkMode(newMode);
                                onDarkModeChange?.(newMode);
                            }}
                            className={`${isDarkMode ? 'bg-yellow-500 hover:bg-yellow-600' : 'bg-gray-800 hover:bg-gray-900'}`}
                        >
                            {isDarkMode ? '☀️' : '🌙'}
                        </Button>
                        <Button
                            onClick={() => setIsDemoMode(!isDemoMode)}
                            className="bg-purple-500 hover:bg-purple-600"
                        >
                            {isDemoMode ? 'Exit Demo' : 'Demo Mode'}
                        </Button>
                    </div>
                </div>
                <div className="flex flex-col gap-4 w-full sm:min-w-[300px]">
                    {/* Size control */}
                    <div className="flex items-center gap-4">
                        <span className="text-sm whitespace-nowrap">
                            Size: {arraySize}
                        </span>
                        <input
                            type="range"
                            min={MIN_SIZE}
                            max={MAX_SIZE}
                            value={arraySize}
                            onChange={(e) => {
                                if (!isSorting) {
                                    setArraySize(parseInt(e.target.value));
                                }
                            }}
                            disabled={isSorting}
                            className="w-full"
                        />
                    </div>
                    {/* Speed control */}
                    <div className="flex items-center gap-4">
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
            </div>

            {/* Action buttons section */}
            <div className={`mb-4 flex flex-wrap gap-2 sm:gap-4 controls-section ${!showControls ? 'controls-hidden' : ''}`}>
                <Button
                    onClick={shuffleArray}
                    disabled={isSorting}
                    className="bg-yellow-500 hover:bg-yellow-600"
                >
                    Shuffle Array
                </Button>
                <Button
                    onClick={startSort}
                    disabled={(isSorting && !isPaused.current) || array.every((value, index) => value === createRainbowArray(arraySize)[index])}
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

            {/* Stats Panel */}
            <div className="mb-4 grid grid-cols-3 gap-2 sm:gap-4 text-sm justify-center mx-auto max-w-2xl">
                <div className={`p-2 rounded ${isDemoMode ? 'bg-black' : isDarkMode ? 'bg-black' : 'bg-gray-100'}`}>
                    <div className="font-semibold">Sorted</div>
                    <div>{stats.sortedPercentage}%</div>
                </div>
                <div className={`p-2 rounded ${isDemoMode ? 'bg-black' : isDarkMode ? 'bg-black' : 'bg-gray-100'}`}>
                    <div className="font-semibold">Comparisons</div>
                    <div>{stats.comparisons}</div>
                </div>
                <div className={`p-2 rounded ${isDemoMode ? 'bg-black' : isDarkMode ? 'bg-black' : 'bg-gray-100'}`}>
                    <div className="font-semibold">Swaps</div>
                    <div>{stats.swaps}</div>
                </div>
            </div>

            {/* Visualization section */}
            <div className={`h-48 sm:h-72 md:h-96 ${isDemoMode ? 'bg-black' : isDarkMode ? 'bg-black' : 'bg-gray-100'} relative overflow-hidden`}>
                {visualizationMode === VISUALIZATION_MODES.DISPARITY ? (
                    <DisparityParticleSystem
                        array={array}
                        currentIndices={currentIndices}
                    />
                ) : visualizationMode === VISUALIZATION_MODES.SIZE_PARTICLE ? (
                    <SizeParticleSystem
                        array={array}
                        currentIndices={currentIndices}
                    />
                ) : visualizationMode === VISUALIZATION_MODES.PARTICLE ? (
                        <ParticleSystemVisualization
                            array={array}
                            currentIndices={currentIndices}
                            getColor={getColor}
                        />
                    ) : visualizationMode === VISUALIZATION_MODES.CIRCLE ? (
                    // Radial visualization with thin bars
                    <div className="w-full h-full relative transform-gpu">
                        {array.map((value, idx) => (
                            <div
                                key={idx}
                                style={getRadialBarStyles(idx, value, array.length)}
                            />
                        ))}
                    </div>
                ) : (
                    // Bar/Mountain visualization
                    <div className="w-full h-full flex items-end">
                        {array.map((value, idx) => (
                            <div
                                key={idx}
                                style={{
                                    width: `${100 / arraySize}%`,
                                    height: getHeight(value),
                                    backgroundColor: getColor(value, idx),
                                    display: 'inline-block',
                                    transition: 'background-color 0.1s ease',
                                    opacity: currentIndices.includes(idx) ? '0.7' : '1'
                                }}
                            />
                        ))}
                    </div>
                )}
            </div>
            </div>
        </div>
    );
};

export default SortingVisualizer;
