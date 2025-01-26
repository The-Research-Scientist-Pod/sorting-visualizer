import SortingVisualizer from './components/SortingVisualizer';
import logo from './assets/logo.png'; // Import your logo

function App() {
    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="container mx-auto">
                {/* Logo */}
                <div className="flex justify-center mb-4">
                    <img src={logo} alt="App Logo" className="h-32 w-auto" />
                </div>

                {/* Title */}
                <h1 className="text-3xl font-bold text-center mb-8">Sorting Visualizer</h1>

                {/* Sorting Visualizer */}
                <SortingVisualizer />
            </div>
        </div>
    );
}

export default App;
