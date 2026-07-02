import React, { useState, useEffect } from 'react';
import styled from 'styled-components';

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
          RING 1: THE OUTER LOADING ACCELERATOR (Code 1)
          ====================================================================== */}
      <div className={`p-3 drop-shadow-2xl bg-gradient-to-bl from-pink-400 via-purple-400 to-indigo-600 md:w-60 md:h-60 h-44 w-44 aspect-square rounded-full flex items-center justify-center transition-all duration-700 ease-out ${
        activeState ? 'animate-spin' : ''
      }`}>
        
        {/* Inner core backing box containing the second ring layout */}
        <div className="rounded-full h-full w-full bg-slate-100 dark:bg-zinc-900 backdrop-blur-md flex items-center justify-center">
          
          {/* ======================================================================
              RING 2: THE TACTILE POWER SWITCH LINK (Code 2 - Nested Inside Ring 1)
              ====================================================================== */}
          <StyledWrapper>
            <div className="container">
              {/* Checkbox state binds dynamically to our local activeState */}
              <input 
                type="checkbox" 
                id="devbrain-core-checkbox" 
                checked={activeState}
                onChange={handleToggle}
              />
              <label htmlFor="devbrain-core-checkbox" className="button">
                <span className="icon">
                  <svg 
                    fill="currentColor" 
                    viewBox="0 0 30.143 30.143" 
                    xmlns="http://www.w3.org/2000/svg" 
                    id="Capa_1" 
                    version="1.1" 
                    className="w-full h-full"
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
          </StyledWrapper>

        </div>
      </div>

      {/* Sub-label showing current tracking status string based on state */}
      <div className="text-[10px] uppercase tracking-widest font-bold text-white/40 text-center">
        {activeState ? 'Active Tracking Enabled' : '• SYSTEM_IDLE'}
      </div>
    </div>
  );
};

const StyledWrapper = styled.div`
  .container {
    width: 6em;
    height: 6em;
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .button {
    position: absolute;
    width: 100%;
    height: 100%;
    border-radius: 50%;
    border: 4px solid #041e42;
    background-color: transparent;
    background-image: linear-gradient(145deg, #0a2a5e, #1e4d8c);
    box-sizing: border-box;
    box-shadow:
      inset 2px 2px 0 #2c5aa0,
      inset -2px -2px 0px #041e42;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: border-color 0.5s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.5s cubic-bezier(0.16, 1, 0.3, 1);
    cursor: pointer;
  }
  .container input {
    display: none;
  }
  .button::before {
    position: absolute;
    content: "";
    width: 6.25em;
    height: 6.25em;
    border-radius: inherit;
    background-color: transparent;
    background-image: linear-gradient(145deg, #0a2a5e, #2c5aa0);
    z-index: -1;
    box-shadow:
      5px 5px 15px rgba(0,0,0,0.4),
      -5px -5px 15px rgba(255,255,255,0.02);
  }
  .button .icon {
    width: 32px;
    height: 32px;
    display: inline-block;
  }
  .button .icon svg {
    height: 100%;
    width: 100%;
    fill: #f43f5e; /* Default neon red when off / standby */
    transition: fill 0.5s cubic-bezier(0.16, 1, 0.3, 1), filter 0.5s cubic-bezier(0.16, 1, 0.3, 1);
  }
  .container input:checked + .button {
    box-shadow:
      inset -2px -2px 0 #2c5aa0,
      inset 2px 2px 0 #041e42;
    border-color: rgba(0, 242, 254, 1);
  }
  .container input:checked + .button .icon svg {
    fill: rgb(0, 242, 254); /* Cyber-cyan when active */
    filter: drop-shadow(0 0 8px rgba(0, 242, 254, 0.6));
  }
`;

export default CentralCoreTelemetry;
