export const generateSortedArray = (size) => {
    return Array.from({ length: size }, (_, i) => i + 1);
};

export const shuffleArray = (array) => {
    const newArray = [...array];
    for (let i = newArray.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    return newArray;
};

export const calculateDelay = (speed) => {
    return Math.max(0, Math.floor(200 * Math.pow(0.95, speed)));
};