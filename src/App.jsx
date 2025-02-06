import { useState } from 'react';
import SortingVisualizer from './components/SortingVisualizer';
import logo from './assets/logo.png'; // Import your logo

function App() {
    const [isDarkMode, setIsDarkMode] = useState(false);

    return (
        <div className={`min-h-screen py-8 ${isDarkMode ? 'bg-gray-900' : 'bg-gray-50'}`}>
            <div className="container mx-auto">
                {/* Logo */}
                <div className="flex justify-center mb-4">
                    <img 
                        src={logo} 
                        alt="App Logo" 
                        className={`h-32 w-auto ${isDarkMode ? 'filter invert' : ''}`} 
                    />
                </div>

                {/* Title */}
                <h1 className={`text-3xl font-bold text-center mb-8 ${isDarkMode ? 'text-white' : 'text-black'}`}>
                    Sorting Visualizer
                </h1>

                {/* Sorting Visualizer */}
                <SortingVisualizer onDarkModeChange={setIsDarkMode} />
            </div>
        </div>
    );
}

export default App;
