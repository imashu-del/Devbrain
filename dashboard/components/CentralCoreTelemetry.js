import React, { useState, useEffect } from 'react';

const CentralCoreTelemetry = ({ isHarvesting = true }) => {
  const [activeState, setActiveState] = useState(isHarvesting);

  // Sync state if parent prop changes during data polling
  useEffect(() => {
    setActiveState(isHarvesting);
  }, [isHarvesting]);

  const handleToggle = async () => {
    const newState = !activeState;
    setActiveState(newState); // immediate visual feedback

    try {
      const res = await fetch("/api/toggle-harvester", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active: newState }),
      });
      if (!res.ok) {
        console.error("Harvester API request failed.");
      }
    } catch (err) {
      console.error("Network error toggling harvester process:", err);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center space-y-4 select-none">
      
      {/* ======================================================================
          RING 1: THE OUTER LOADING ACCELERATOR
          ====================================================================== */}
      <div className={`p-3 drop-shadow-2xl bg-gradient-to-bl from-pink-400 via-purple-400 to-indigo-600 md:w-60 md:h-60 h-44 w-44 aspect-square rounded-full flex items-center justify-center transition-all duration-700 ease-out ${
        activeState ? 'animate-spin' : ''
      }`}>
        
        {/* Inner core backing box containing the second ring layout */}
        <div className="rounded-full h-full w-full bg-slate-100 dark:bg-zinc-900 backdrop-blur-md flex items-center justify-center">
          
          {/* ======================================================================
              RING 2: THE TACTILE POWER SWITCH LINK
              ====================================================================== */}
          <div className="w-[6em] h-[6em] relative flex items-center justify-center">
            
            {/* Hidden Input Checkbox */}
            <input 
              type="checkbox" 
              id="devbrain-core-checkbox" 
              checked={activeState}
              onChange={handleToggle}
              className="hidden"
            />
            
            {/* Button Label */}
            <label 
              htmlFor="devbrain-core-checkbox" 
              className={`absolute w-full h-full rounded-full border-4 bg-gradient-to-br from-[#0a2a5e] to-[#1e4d8c] flex items-center justify-center cursor-pointer transition-all duration-500 cubic-bezier(0.16, 1, 0.3, 1) before:absolute before:content-[""] before:w-[6.25em] before:h-[6.25em] before:rounded-full before:bg-gradient-to-br before:from-[#0a2a5e] before:to-[#2c5aa0] before:z-[-1] before:shadow-[5px_5px_15px_rgba(0,0,0,0.4),-5px_-5px_15px_rgba(255,255,255,0.02)] ${
                activeState 
                  ? 'border-[#ffffff] shadow-[inset_-2px_-2px_0_#2c5aa0,inset_2px_2px_0_#041e42]' 
                  : 'border-[#041e42] shadow-[inset_2px_2px_0_#2c5aa0,inset_-2px_-2px_0px_#041e42]'
              }`}
            >
              <span className="w-8 h-8 inline-block">
                <svg 
                  viewBox="0 0 30.143 30.143" 
                  xmlns="http://www.w3.org/2000/svg" 
                  id="Capa_1" 
                  className={`w-full h-full transition-all duration-500 cubic-bezier(0.16, 1, 0.3, 1) ${
                    activeState 
                      ? 'fill-[#ffffff] drop-shadow-[0_0_8px_rgba(255,255,255,0.6)]' 
                      : 'fill-[#f43f5e]'
                  }`}
                >
                  <g id="SVGRepo_bgCarrier" strokeWidth={0} />
                  <g id="SVGRepo_tracerCarrier" strokeLinecap="round" strokeLinejoin="round" />
                  <g id="SVGRepo_iconCarrier">
                    <g>
                      <path d="M20.034,2.357v3.824c3.482,1.798,5.869,5.427,5.869,9.619c0,5.98-4.848,10.83-10.828,10.83 c-5.982,0-10.832-4.85-10.832-10.83c0-3.844,2.012-7.215,5.029-9.136V2.689C4.245,4.918,0.731,9.945,0.731,15.801 c0,7.921,6.42,14.342,14.34,14.342c7.924,0,14.342-6.421,14.342-14.342C29.412,9.624,25.501,4.379,20.034,2.357z" />
                      <path d="M14.795,17.652c1.576,0,1.736-0.931,1.736-2.076V2.08c0-1.148-0.16-2.08-1.736-2.08 c-1.57,0-1.732,0.932-1.732,2.08v13.496C13.062,16.722,13.225,17.652,14.795,17.652z" />
                    </g>
                  </g>
                </svg>
              </span>
            </label>
          </div>

        </div>
      </div>

      {/* Sub-label showing current tracking status string based on state */}
      <div className="text-[10px] tracking-widest font-bold text-white text-center font-sans">
        {activeState ? 'Active Tracking Enabled' : '• System Idle'}
      </div>
    </div>
  );
};

export default CentralCoreTelemetry;
