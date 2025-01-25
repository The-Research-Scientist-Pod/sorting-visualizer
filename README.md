# Sorting Visualizer

A React-based visualization tool for sorting algorithms, featuring a rainbow-colored array representation. Watch in real-time as different sorting algorithms organize the elements from a randomized state back to a perfect rainbow!

## Features

- 🌈 Rainbow visualization of sorting algorithms
- ⏯️ Play, pause, and reset controls
- 🎚️ Adjustable animation speed
- 🔄 Array shuffling
- 📊 Real-time visualization of comparisons and swaps
- 🧩 Modular design for easy addition of new algorithms

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm (v6 or higher)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/The-Research-Scientist-Pod/sorting-visualizer.git
cd sorting-visualizer
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

4. Open your browser and navigate to `http://localhost:5173`

## Project Structure

```
sorting-visualizer/
├── src/
│   ├── algorithms/         # Sorting algorithm implementations
│   │   ├── base.js        # Base sorting algorithm class
│   │   ├── bubbleSort.js  # Bubble sort implementation
│   │   └── index.js       # Algorithm exports
│   ├── components/
│   │   ├── SortingVisualizer/
│   │   │   ├── index.jsx  # Main visualizer component
│   │   │   ├── styles.css
│   │   │   └── constants.js
│   │   └── ui/           # Reusable UI components
│   ├── lib/
│   │   └── utils.js      # Utility functions
│   ├── App.jsx
│   └── main.jsx
├── public/
└── package.json
```

## Adding New Sorting Algorithms

1. Create a new file in `src/algorithms/` (e.g., `quickSort.js`)
2. Extend the base `SortingAlgorithm` class
3. Implement the `sort()` method
4. Export the new algorithm in `src/algorithms/index.js`

Example:
```javascript
import { SortingAlgorithm } from './base';

export class QuickSort extends SortingAlgorithm {
  async sort(array) {
    // Implementation here
  }
}
```

## Contributing

1. Fork the repository
2. Create a new branch (`git checkout -b feature/new-algorithm`)
3. Make your changes
4. Commit your changes (`git commit -m 'Add new sorting algorithm'`)
5. Push to the branch (`git push origin feature/new-algorithm`)
6. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgments

- Built with React and Vite
- Styled with Tailwind CSS
- UI components powered by shadcn/ui
