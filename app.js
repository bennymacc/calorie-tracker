const { useState, useEffect } = React;
const { Plus, Pizza, Apple, ChevronDown, Trash2 } = lucide;

const CalorieTrackerApp = () => {
  const [calories, setCalories] = useState('');
  const [isJunk, setIsJunk] = useState(false);
  const [today, setToday] = useState([]);
  const [dailyTotal, setDailyTotal] = useState(0);
  const [junkCount, setJunkCount] = useState(0);
  const [showDropdown, setShowDropdown] = useState(false);
  const [targetCalories, setTargetCalories] = useState(2000);
  
  useEffect(() => {
    const total = today.reduce((sum, entry) => sum + entry.calories, 0);
    const junk = today.filter(entry => entry.isJunk).length;
    setDailyTotal(total);
    setJunkCount(junk);
  }, [today]);

  const handleSubmit = () => {
    if (calories && !isNaN(calories)) {
      const newEntry = {
        id: Date.now(),
        calories: parseInt(calories),
        isJunk: isJunk,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        date: new Date().toLocaleDateString(),
        status: 'active'
      };
      setToday([...today, newEntry]);
      setCalories('');
      setIsJunk(false);
      
      // Send to Google Sheets
      sendToGoogleSheets(newEntry);
    }
  };

  const handleDelete = (id) => {
    setToday(today.filter(entry => entry.id !== id));
    
    // Update status in Google Sheets
    updateStatusInGoogleSheets(id, 'deleted');
  };

  // Function to send new entries to Google Sheets
  const sendToGoogleSheets = async (entry) => {
    const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbyRxYbR4BxMyY1Up8rNrQ-WvT99qkt5b1yoXDIetaxvLV5AqBvetKXkpUpTPlR7ppSFdg/exec';
    
    try {
      const params = new URLSearchParams({
        action: 'add',
        id: entry.id,
        date: entry.date,
        time: entry.time,
        calories: entry.calories,
        category: entry.isJunk ? 'Junk' : 'Healthy',
        target: targetCalories,
        status: entry.status
      });
      
      // Using image request to bypass CORS
      const img = new Image();
      img.src = `${GOOGLE_SCRIPT_URL}?${params.toString()}`;
      
    } catch (error) {
      console.error('Failed to save to Google Sheets:', error);
    }
  };

  // Function to update status in Google Sheets
  const updateStatusInGoogleSheets = async (id, status) => {
    const GOOGLE_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbyRxYbR4BxMyY1Up8rNrQ-WvT99qkt5b1yoXDIetaxvLV5AqBvetKXkpUpTPlR7ppSFdg/exec';
    
    try {
      const params = new URLSearchParams({
        action: 'updateStatus',
        id: id,
        status: status
      });
      
      // Using image request to bypass CORS
      const img = new Image();
      img.src = `${GOOGLE_SCRIPT_URL}?${params.toString()}`;
      
    } catch (error) {
      console.error('Failed to update status in Google Sheets:', error);
    }
  };

  const clearToday = () => {
    setToday([]);
    setShowDropdown(false);
  };

  const setTarget = (value) => {
    setTargetCalories(value);
    setShowDropdown(false);
  };

  const progressPercentage = Math.min((dailyTotal / targetCalories) * 100, 100);
  const isOverTarget = dailyTotal > targetCalories;

  return (
    <div className="max-w-md mx-auto bg-white min-h-screen flex flex-col md:border md:border-gray-200 md:rounded-xl md:shadow-lg md:my-8">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-4 sm:p-6 text-white md:rounded-t-xl">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-xl sm:text-2xl font-bold">CalorEZ</h1>
          <div className="relative">
            <button 
              onClick={() => setShowDropdown(!showDropdown)}
              className="flex items-center bg-white/20 rounded-full px-2 sm:px-3 py-1 text-sm sm:text-base"
            >
              <span>Target: {targetCalories}</span>
              <ChevronDown className="w-4 h-4 ml-1" />
            </button>
            {showDropdown && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg z-10">
                <div className="py-1">
                  {[1500, 1750, 2000, 2250, 2500].map(value => (
                    <button
                      key={value}
                      onClick={() => setTarget(value)}
                      className="block w-full text-left px-4 py-2 text-gray-800 hover:bg-gray-100"
                    >
                      {value} kcal
                    </button>
                  ))}
                  <hr className="my-1" />
                  <button
                    onClick={clearToday}
                    className="block w-full text-left px-4 py-2 text-red-600 hover:bg-gray-100"
                  >
                    Clear Today
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
        <div className="text-center">
          <div className="text-4xl sm:text-5xl font-bold mb-2">{dailyTotal}</div>
          <div className="text-sm opacity-80">calories today</div>
        </div>
        <div className="mt-4 bg-white/20 rounded-full h-3 overflow-hidden">
          <div
            className={`h-full transition-all duration-500 ${
              isOverTarget ? 'bg-red-500' : 'bg-green-400'
            }`}
            style={{ width: `${progressPercentage}%` }}
          ></div>
        </div>
        <div className="flex justify-between mt-2 text-xs sm:text-sm">
          <span>{targetCalories - dailyTotal > 0 ? `${targetCalories - dailyTotal} left` : 'Over target!'}</span>
          <span>{junkCount} junk {junkCount === 1 ? 'item' : 'items'} today</span>
        </div>
      </div>

      {/* Input Section */}
      <div className="p-4 sm:p-6 bg-gray-50">
        <div className="bg-white rounded-xl shadow-sm p-4">
          <input
            type="number"
            value={calories}
            onChange={(e) => setCalories(e.target.value)}
            placeholder="Enter calories"
            className="w-full text-2xl sm:text-3xl font-bold text-center outline-none mb-4 border-2 border-gray-200 rounded-lg p-3 focus:border-blue-500 transition-colors"
          />
          
          <div className="flex justify-center mb-4">
            <button
              onClick={() => setIsJunk(false)}
              className={`flex items-center px-4 sm:px-6 py-2 sm:py-3 rounded-l-full text-sm sm:text-base ${
                !isJunk ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-600'
              }`}
            >
              <Apple className="w-4 sm:w-5 h-4 sm:h-5 mr-2" />
              Healthy
            </button>
            <button
              onClick={() => setIsJunk(true)}
              className={`flex items-center px-4 sm:px-6 py-2 sm:py-3 rounded-r-full text-sm sm:text-base ${
                isJunk ? 'bg-red-500 text-white' : 'bg-gray-200 text-gray-600'
              }`}
            >
              <Pizza className="w-4 sm:w-5 h-4 sm:h-5 mr-2" />
              Junk
            </button>
          </div>
          
          <button
            onClick={handleSubmit}
            disabled={!calories}
            className={`w-full py-3 sm:py-4 rounded-full text-white font-semibold flex items-center justify-center text-sm sm:text-base ${
              calories ? 'bg-blue-500 hover:bg-blue-600' : 'bg-gray-300 cursor-not-allowed'
            }`}
          >
            <Plus className="w-4 sm:w-5 h-4 sm:h-5 mr-2" />
            Add Entry
          </button>
        </div>
      </div>

      {/* Today's Entries */}
      <div className="flex-1 p-4 sm:p-6 overflow-auto">
        <h2 className="text-base sm:text-lg font-semibold mb-4">Today's Log</h2>
        {today.length === 0 ? (
          <div className="text-center text-gray-400 mt-8">
            <p>No entries yet</p>
            <p className="text-sm">Start logging your calories above</p>
          </div>
        ) : (
          <div className="space-y-3">
            {today.map((entry) => (
              <div
                key={entry.id}
                className="flex items-center justify-between bg-white rounded-lg p-3 sm:p-4 shadow-sm"
              >
                <div className="flex items-center">
                  <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center ${
                    entry.isJunk ? 'bg-red-100' : 'bg-green-100'
                  }`}>
                    {entry.isJunk ? (
                      <Pizza className="w-4 sm:w-5 h-4 sm:h-5 text-red-500" />
                    ) : (
                      <Apple className="w-4 sm:w-5 h-4 sm:h-5 text-green-500" />
                    )}
                  </div>
                  <div className="ml-3">
                    <div className="font-semibold text-sm sm:text-base">{entry.calories} kcal</div>
                    <div className="text-xs sm:text-sm text-gray-500">{entry.time}</div>
                  </div>
                </div>
                <div className="flex items-center">
                  <div className={`px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm ${
                    entry.isJunk ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
                  }`}>
                    {entry.isJunk ? 'Junk' : 'Healthy'}
                  </div>
                  <button
                    onClick={() => handleDelete(entry.id)}
                    className="ml-3 p-2 text-gray-400 hover:text-red-500"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
