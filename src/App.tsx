import React, { useState } from 'react';
import { PrimordiaEditor } from './components/PrimordiaEditor';
import { speakText } from './utils/tts';

export function App() {
    const [codeBuffer, setCodeBuffer] = useState<string>('// PrimordiaOS Sovereign Substrate v1.53.0\n// Ready for neural compilation...\n\nfunction initializePrimordia() {\n    console.log("PrimordiaOS HUD Online.");\n}\n\ninitializePrimordia();');

    const handleTestSpeech = async () => {
        console.log('[HUD]: Triggering test speech playback...');
        await speakText('PrimordiaOS neural voice substrate online. All systems operational.');
    };

    return (
        <div style={{ width: '100vw', height: '100vh', background: '#030712', color: '#00f0ff', display: 'flex', flexDirection: 'column', overflow: 'hidden', fontFamily: 'monospace' }}>
            {/* Top Bar */}
            <div style={{ height: '40px', background: '#01060c', borderBottom: '1px solid #00f0ff33', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 16px' }}>
                <div style={{ fontWeight: 'bold', letterSpacing: '2px', fontSize: '13px' }}>PRIMORDIA // HUD COMMAND CENTER</div>
                <div style={{ fontSize: '11px', color: '#00ff88' }}>● DAEMONS ONLINE [11434 / 8880]</div>
            </div>

            {/* Main Workspace */}
            <div style={{ flex: 1, display: 'flex', padding: '12px', gap: '12px', overflow: 'hidden' }}>
                {/* Left Panel: Monaco Editor */}
                <div style={{ flex: 2, height: '100%', display: 'flex', flexDirection: 'column' }}>
                    <PrimordiaEditor 
                        code={codeBuffer} 
                        onChange={(val) => setCodeBuffer(val || '')} 
                        language="typescript" 
                    />
                </div>

                {/* Right Panel: Telemetry & Controls */}
                <div style={{ flex: 1, height: '100%', border: '1px solid #00f0ff44', borderRadius: '6px', background: '#01060c', padding: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div style={{ fontSize: '12px', borderBottom: '1px solid #00f0ff22', paddingBottom: '8px', letterSpacing: '1px' }}>SYSTEM TELEMETRY</div>
                    <div style={{ fontSize: '11px', color: '#888' }}>
                        <div>- Ollama Local LLM: Connected</div>
                        <div>- Kokoro Neural TTS: Active (Port 8880)</div>
                        <div>- Monaco Editor Core: Loaded</div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: 'auto' }}>
                        <button 
                            onClick={handleTestSpeech}
                            style={{ background: '#ff005522', border: '1px solid #ff0055', color: '#ff0055', padding: '10px 12px', borderRadius: '4px', cursor: 'pointer', fontFamily: 'monospace', fontWeight: 'bold' }}>
                            [ TEST KOKORO SPEECH ]
                        </button>

                        <button 
                            onClick={() => alert('Executing code buffer...')}
                            style={{ background: '#00f0ff22', border: '1px solid #00f0ff', color: '#00f0ff', padding: '10px 12px', borderRadius: '4px', cursor: 'pointer', fontFamily: 'monospace', fontWeight: 'bold' }}>
                            [ EXECUTING SUBSTRATE ]
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default App;
