import React, { useState, useCallback } from 'react';

// --- TTS Helper Functions ---

// Converts base64 PCM data to ArrayBuffer
const base64ToArrayBuffer = (base64) => {
    const binaryString = atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
        bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes.buffer;
};

// Helper for writing strings to DataView
const writeString = (view, offset, string) => {
    for (let i = 0; i < string.length; i++) {
        view.setUint8(offset + i, string.charCodeAt(i));
    }
};

// Converts PCM audio data to WAV Blob (required for playback)
const pcmToWav = (pcm16, sampleRate = 24000) => {
    const buffer = new ArrayBuffer(44 + pcm16.length * 2);
    const view = new DataView(buffer);

    // RIFF identifier 'RIFF'
    writeString(view, 0, 'RIFF');
    // file length
    view.setUint32(4, 36 + pcm16.length * 2, true);
    // RIFF type 'WAVE'
    view.setUint32(8, 0x45564157, true); // 'WAVE'
    // format chunk identifier 'fmt '
    writeString(view, 12, 'fmt ');
    // format chunk length
    view.setUint32(16, 16, true);
    // sample format (raw)
    view.setUint16(20, 1, true);
    // channel count (mono)
    view.setUint16(22, 1, true);
    // sample rate
    view.setUint32(24, sampleRate, true);
    // byte rate (sample rate * block align)
    view.setUint32(28, sampleRate * 2, true);
    // block align (channels * bytes per sample)
    view.setUint16(32, 2, true);
    // bits per sample
    view.setUint16(34, 16, true);
    // data chunk identifier 'data'
    writeString(view, 36, 'data');
    // data chunk length
    view.setUint32(40, pcm16.length * 2, true);

    // PCM data
    let offset = 44;
    for (let i = 0; i < pcm16.length; i++, offset += 2) {
        view.setInt16(offset, pcm16[i], true);
    }

    return new Blob([view], { type: 'audio/wav' });
};


// --- Constants and Colors (Defined as JS object for Tailwind styling via inline styles) ---
const EHU_COLORS = {
    NAVY: '#0A2540',    // Primary Dark (Text, Structure)
    GREEN: '#00843D',   // Primary Accent (Action, Growth)
    GOLD: '#FFD700',    // Secondary Accent (Excellence)
    LIGHT_BG: '#F4F7F9', // Subtle Gray Background
    WHITE: '#FFFFFF',
};

const SECTIONS = [
    { id: 'about', title: 'Mission' },
    { id: 'colleges', title: 'Faculties' },
    { id: 'research', title: 'Research' },
    { id: 'life', title: 'Student Life' }, // New Section
    { id: 'admissions', title: 'Apply' },
    { id: 'contact', title: 'Contact' },
];

// --- Utility Components (Lucide Icons look-alikes for Visual Polish) ---
const IconBookOpen = ({ className = "w-6 h-6" }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 14l9-5-9-5-9 5 9 5zM5 12l7 4 7-4M12 17l7-4-7-4-7 4 7 4z"></path></svg>
);
const IconFlask = ({ className = "w-6 h-6" }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 12l-4 4M10 12l-4-4M10 12h8M14 4h4a2 2 0 012 2v12a2 2 0 01-2 2h-4a2 2 0 01-2-2V6a2 2 0 012-2z"></path></svg>
);
const IconUsers = ({ className = "w-6 h-6" }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5m-1.25-1.25a6.5 6.5 0 00-13 0M10 12a3 3 0 100-6 3 3 0 000 6zM5.25 19.75c0-3.5 1.75-6.5 4.75-8.5"></path></svg>
);
const IconChevronRight = ({ className = "w-4 h-4" }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path></svg>
);
const IconCheckCircle = ({ className = "w-4 h-4" }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
);
const IconSparkles = ({ className = "w-4 h-4" }) => (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10 4L12 8L16 6L14 10L18 12L14 14L16 18L12 16L8 18L10 14L6 12L10 10L8 6L12 8L14 4L10 4Z" /></svg>
);
const IconVolume = ({ className = "w-4 h-4" }) => (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" /><path d="M15.54 8.46a4.99 4.99 0 0 1 0 7.08" /></svg>
);
const IconShield = ({ className = "w-6 h-6" }) => (
    // NEW LOGO ICON
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.636-1.636a9 9 0 11-12.728 0 9 9 0 0112.728 0z"></path></svg>
);
const IconCalendar = ({ className = "w-6 h-6" }) => (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/></svg>
);


// --- LLM Powered Component 1: AI Course Generator (with TTS) ---
const AICourseGenerator = () => {
    const [interestInput, setInterestInput] = useState('');
    const [aiDescription, setAiDescription] = useState(null);
    const [aiLoading, setAiLoading] = useState(false);
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [error, setError] = useState(null);

    // Function to generate the course description using the Gemini API
    const generateDescription = useCallback(async () => {
        if (!interestInput.trim()) {
            setError("Please enter your career interest first.");
            return;
        }

        setAiLoading(true);
        setAiDescription(null);
        setError(null);

        const userQuery = `I am interested in a career path focusing on: ${interestInput}. Based on the available colleges (Health Sciences, Engineering & Technology, Agriculture, Business & Economics, Humanities & Social Sciences) at East Hararghe University, recommend the best-suited program and generate a short, compelling 100-word paragraph describing how that program will help me achieve my specific career goal.`;

        const systemPrompt = "You are a friendly and encouraging Academic Counselor for East Hararghe University (EHU). Your goal is to guide prospective students to the ideal program based on their stated interests, matching them to one of EHU's 5 major colleges (Health Sciences, Engineering & Technology, Agriculture & Natural Resources, Business & Economics, Humanities & Social Sciences). Your response must be enthusiastic and highly relevant to EHU's regional focus in Ethiopia.";
        
        const apiKey = "" 
        const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent?key=${apiKey}`;

        const payload = {
            contents: [{ parts: [{ text: userQuery }] }],
            systemInstruction: {
                parts: [{ text: systemPrompt }]
            },
        };

        const MAX_RETRIES = 3;
        let attempt = 0;
        let success = false;
        let finalResultText = "";

        while (attempt < MAX_RETRIES && !success) {
            try {
                const response = await fetch(apiUrl, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });

                if (!response.ok) {
                    throw new Error(`API Error: ${response.statusText}`);
                }

                const result = await response.json();
                const text = result.candidates?.[0]?.content?.parts?.[0]?.text;
                
                if (text) {
                    finalResultText = text;
                    success = true;
                } else {
                    throw new Error("Received empty response from API.");
                }

            } catch (err) {
                console.error(`Attempt ${attempt + 1} failed:`, err);
                attempt++;
                if (attempt < MAX_RETRIES) {
                    const delay = Math.pow(2, attempt) * 1000;
                    await new Promise(resolve => setTimeout(resolve, delay));
                } else {
                    setError("Failed to generate description after multiple retries. Please try again later.");
                }
            }
        }

        setAiLoading(false);
        if (success) {
            setAiDescription(finalResultText);
        }

    }, [interestInput]);

    // Function to generate and play audio using the TTS API
    const speakDescription = useCallback(async () => {
        if (!aiDescription || isSpeaking) return;

        setIsSpeaking(true);
        setError(null);

        const ttsText = aiDescription;
        
        const apiKey = "" 
        const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-tts:generateContent?key=${apiKey}`;

        const payload = {
            contents: [{ parts: [{ text: `Say in an encouraging and professional tone: ${ttsText}` }] }],
            generationConfig: {
                responseModalities: ["AUDIO"],
                speechConfig: {
                    voiceConfig: {
                        prebuiltVoiceConfig: { voiceName: "Achird" } // Friendly tone
                    }
                }
            },
        };

        try {
            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                throw new Error(`TTS API Error: ${response.statusText}`);
            }

            const result = await response.json();
            const part = result?.candidates?.[0]?.content?.parts?.[0];
            const audioData = part?.inlineData?.data;
            const mimeType = part?.inlineData?.mimeType;

            if (audioData && mimeType && mimeType.startsWith("audio/L16")) {
                const match = mimeType.match(/rate=(\d+)/);
                const sampleRate = match ? parseInt(match[1], 10) : 24000;
                
                const pcmData = base64ToArrayBuffer(audioData);
                const pcm16 = new Int16Array(pcmData);
                const wavBlob = pcmToWav(pcm16, sampleRate);
                const audioUrl = URL.createObjectURL(wavBlob);
                
                const audio = new Audio(audioUrl);
                audio.onended = () => setIsSpeaking(false);
                audio.onerror = (e) => {
                    console.error("Audio playback error:", e);
                    setError("Failed to play audio.");
                    setIsSpeaking(false);
                };
                audio.play().catch(e => {
                    console.error("Audio playback failed:", e);
                    // This error often occurs due to browser security restrictions on autoplay
                    setError("Audio playback blocked. Click the speaker icon to retry.");
                    setIsSpeaking(false);
                });
            } else {
                 setError("Could not retrieve valid audio data from TTS service.");
                 setIsSpeaking(false);
            }

        } catch (e) {
            console.error("TTS generation error:", e);
            setError("Text-to-Speech generation failed.");
            setIsSpeaking(false);
        }
    }, [aiDescription, isSpeaking]);


    return (
        <div className="lg:col-span-1 p-6 rounded-2xl shadow-2xl transition duration-300" style={{ backgroundColor: EHU_COLORS.NAVY }}>
            <div className="flex items-center mb-4">
                <IconSparkles className="w-6 h-6 mr-2 text-white" />
                <h3 className="text-xl font-extrabold text-white">AI Program Matchmaker ✨</h3>
            </div>
            <p className="text-sm text-gray-300 mb-4">
                Enter your desired career path below and get an instant, personalized program recommendation from our Academic Counselor AI.
            </p>

            <input
                type="text"
                placeholder="e.g., 'sustainable farming' or 'data analysis in healthcare'"
                value={interestInput}
                onChange={(e) => setInterestInput(e.target.value)}
                className="w-full p-3 rounded-lg border-2 border-gray-300 focus:outline-none focus:border-green-500 mb-4 text-gray-800"
                disabled={aiLoading}
            />

            <button
                onClick={generateDescription}
                disabled={aiLoading}
                className={`w-full flex items-center justify-center space-x-2 py-3 px-6 rounded-full font-bold transition duration-300 ${aiLoading ? 'bg-gray-500 cursor-not-allowed' : 'hover:bg-green-700'}`}
                style={{ backgroundColor: EHU_COLORS.GREEN, color: EHU_COLORS.WHITE }}
            >
                {aiLoading ? (
                    <>
                        <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                        <span>Generating...</span>
                    </>
                ) : (
                    <>
                        <IconSparkles className="w-4 h-4" />
                        <span>Find My EHU Program</span>
                    </>
                )}
            </button>
            
            {(aiDescription || error) && (
                <div className="mt-6 p-4 rounded-xl shadow-inner border" style={{ backgroundColor: EHU_COLORS.WHITE, borderColor: error ? 'red' : EHU_COLORS.GOLD }}>
                    <div className="flex justify-between items-start mb-2">
                        <p className="font-bold" style={{ color: EHU_COLORS.NAVY }}>{error ? 'Error' : 'Personalized Program Match:'}</p>
                        {aiDescription && (
                            <button 
                                onClick={speakDescription}
                                disabled={isSpeaking}
                                className={`p-1 rounded-full transition duration-150 ${isSpeaking ? 'bg-gray-200 cursor-wait' : 'hover:bg-green-100'}`}
                            >
                                <IconVolume className={`w-5 h-5 ${isSpeaking ? 'text-gray-500' : 'text-green-700'}`} />
                            </button>
                        )}
                    </div>
                    <p className="text-sm text-gray-700 whitespace-pre-wrap">{aiDescription || error}</p>
                </div>
            )}
        </div>
    );
};

// --- LLM Powered Component 2: AI Research Brainstormer (Structured Output) ---
const AIResearchBrainstormer = () => {
    const [interestInput, setInterestInput] = useState('');
    const [researchIdeas, setResearchIdeas] = useState(null);
    const [aiLoading, setAiLoading] = useState(false);
    const [error, setError] = useState(null);

    const generateIdeas = useCallback(async () => {
        if (!interestInput.trim()) {
            setError("Please enter a research area of interest first.");
            return;
        }

        setAiLoading(true);
        setResearchIdeas(null);
        setError(null);

        const userQuery = `Generate three specific, compelling research project titles and 2-sentence abstracts relevant to East Hararghe University's mission in the context of Ethiopia. The projects must be centered around the following broad interest area: ${interestInput}. Align the ideas with EHU's focus areas (Food Security, Water Management, Public Health, Regional Planning).`;

        const systemPrompt = "You are a professional research program coordinator. Generate exactly three distinct research project ideas in JSON format that are applied and locally impactful.";

        const apiKey = ""
        const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent?key=${apiKey}`;

        const payload = {
            contents: [{ parts: [{ text: userQuery }] }],
            systemInstruction: { parts: [{ text: systemPrompt }] },
            generationConfig: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: "ARRAY",
                    items: {
                        type: "OBJECT",
                        properties: {
                            "title": { "type": "STRING", "description": "The title of the research project." },
                            "abstract": { "type": "STRING", "description": "A 2-sentence abstract describing the project's goal and methodology." }
                        },
                        required: ["title", "abstract"]
                    }
                }
            }
        };

        const MAX_RETRIES = 3;
        let attempt = 0;
        let success = false;

        while (attempt < MAX_RETRIES && !success) {
            try {
                const response = await fetch(apiUrl, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });

                if (!response.ok) {
                    throw new Error(`API Error: ${response.statusText}`);
                }

                const result = await response.json();
                const jsonText = result.candidates?.[0]?.content?.parts?.[0]?.text;
                
                if (jsonText) {
                    const parsedJson = JSON.parse(jsonText);
                    setResearchIdeas(parsedJson);
                    success = true;
                } else {
                    throw new Error("Received empty or malformed JSON response from API.");
                }

            } catch (err) {
                console.error(`Attempt ${attempt + 1} failed:`, err);
                attempt++;
                if (attempt < MAX_RETRIES) {
                    const delay = Math.pow(2, attempt) * 1000;
                    await new Promise(resolve => setTimeout(resolve, delay));
                } else {
                    setError("Failed to generate ideas after multiple retries. Please check your input and try again.");
                }
            }
        }

        setAiLoading(false);

    }, [interestInput]);

    return (
        <div className="p-8 rounded-2xl shadow-2xl transition duration-300 transform hover:shadow-3xl mt-16 lg:mt-0" style={{ backgroundColor: EHU_COLORS.LIGHT_BG }}>
            <div className="flex items-center mb-4">
                <IconFlask className="w-6 h-6 mr-2" style={{ color: EHU_COLORS.NAVY }} />
                <h3 className="text-xl font-extrabold" style={{ color: EHU_COLORS.NAVY }}>AI Research Brainstormer ✨</h3>
            </div>
            <p className="text-sm text-gray-700 mb-4">
                Enter a broad research topic (e.g., 'climate' or 'infectious disease') and get three specific, actionable EHU-aligned research projects.
            </p>

            <input
                type="text"
                placeholder="e.g., 'drought-resistant crops' or 'digital governance'"
                value={interestInput}
                onChange={(e) => setInterestInput(e.target.value)}
                className="w-full p-3 rounded-lg border-2 text-gray-800 focus:outline-none focus:border-green-500"
                style={{ borderColor: EHU_COLORS.NAVY + '40', backgroundColor: EHU_COLORS.WHITE }}
                disabled={aiLoading}
            />

            <button
                onClick={generateIdeas}
                disabled={aiLoading}
                className={`w-full flex items-center justify-center space-x-2 py-3 px-6 rounded-full font-bold transition duration-300 ${aiLoading ? 'bg-gray-400 cursor-not-allowed' : 'hover:bg-navy-800'}`}
                style={{ backgroundColor: EHU_COLORS.NAVY, color: EHU_COLORS.WHITE }}
            >
                {aiLoading ? (
                    <>
                        <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                        <span>Brainstorming...</span>
                    </>
                ) : (
                    <>
                        <IconSparkles className="w-4 h-4" />
                        <span>Generate Research Ideas</span>
                    </>
                )}
            </button>
            
            {(researchIdeas && researchIdeas.length > 0) && (
                <div className="mt-6 space-y-4">
                    <p className="font-bold mb-2 text-lg" style={{ color: EHU_COLORS.GREEN }}>Suggested Projects:</p>
                    {researchIdeas.map((idea, index) => (
                        <div key={index} className="p-4 rounded-xl border-l-4 shadow-sm bg-white" style={{ borderColor: EHU_COLORS.GOLD }}>
                            <h4 className="font-extrabold" style={{ color: EHU_COLORS.NAVY }}>{idea.title}</h4>
                            <p className="text-sm text-gray-700 mt-1">{idea.abstract}</p>
                        </div>
                    ))}
                </div>
            )}

            {error && (
                <div className="mt-6 p-4 rounded-xl border border-red-500 bg-red-50">
                    <p className="font-bold text-red-700">Error:</p>
                    <p className="text-sm text-red-600">{error}</p>
                </div>
            )}
        </div>
    );
};

// --- LLM Powered Component 3: Admissions Query Tool (with Google Search Grounding) ---
const AdmissionsQueryTool = () => {
    const [query, setQuery] = useState('');
    const [answer, setAnswer] = useState(null);
    const [sources, setSources] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const checkRequirements = useCallback(async () => {
        if (!query.trim()) {
            setError("Please enter your admissions question.");
            return;
        }

        setLoading(true);
        setAnswer(null);
        setSources([]);
        setError(null);

        const userQuery = query;

        // System prompt to ground the LLM in the context of the fictional university but asking for real-world relevant data
        const systemPrompt = "You are the Director of Admissions at East Hararghe University (EHU). Answer the student's question concisely using up-to-date, real-time information relevant to typical Ethiopian University admissions, deadlines, or requirements. Frame the answer professionally for EHU.";
        
        const apiKey = "" 
        const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent?key=${apiKey}`;

        const payload = {
            contents: [{ parts: [{ text: userQuery }] }],
            tools: [{ "google_search": {} }], // CRITICAL: Enables search grounding
            systemInstruction: {
                parts: [{ text: systemPrompt }]
            },
        };

        const MAX_RETRIES = 3;
        let attempt = 0;
        let success = false;
        let finalResultText = "";
        let finalSources = [];

        while (attempt < MAX_RETRIES && !success) {
            try {
                const response = await fetch(apiUrl, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });

                if (!response.ok) throw new Error(`API Error: ${response.statusText}`);

                const result = await response.json();
                const candidate = result.candidates?.[0];

                if (candidate && candidate.content?.parts?.[0]?.text) {
                    finalResultText = candidate.content.parts[0].text;
                    
                    // Extract grounding sources
                    const groundingMetadata = candidate.groundingMetadata;
                    if (groundingMetadata && groundingMetadata.groundingAttributions) {
                        finalSources = groundingMetadata.groundingAttributions
                            .map(attribution => ({
                                uri: attribution.web?.uri,
                                title: attribution.web?.title,
                            }))
                            .filter(source => source.uri && source.title); // Ensure sources are valid
                    }
                    success = true;
                } else {
                    throw new Error("Received empty response from API.");
                }

            } catch (err) {
                console.error(`Attempt ${attempt + 1} failed:`, err);
                attempt++;
                if (attempt < MAX_RETRIES) {
                    const delay = Math.pow(2, attempt) * 1000;
                    await new Promise(resolve => setTimeout(resolve, delay));
                } else {
                    setError("Failed to get an answer. Please rephrase your question.");
                }
            }
        }

        setLoading(false);
        if (success) {
            setAnswer(finalResultText);
            setSources(finalSources);
        }

    }, [query]);

    return (
        <div className="max-w-4xl mx-auto p-8 rounded-2xl shadow-2xl backdrop-blur-sm" style={{ backgroundColor: EHU_COLORS.WHITE + 'f0' }}>
            <div className="flex items-center justify-center mb-4">
                <IconBookOpen className="w-6 h-6 mr-2" style={{ color: EHU_COLORS.NAVY }} />
                <h3 className="text-3xl font-extrabold" style={{ color: EHU_COLORS.NAVY }}>Live Admissions Query ✨</h3>
            </div>
            <p className="text-lg text-gray-700 mb-6 text-center max-w-2xl mx-auto">
                Ask a specific question about application deadlines, requirements, or documents. We use **real-time information** to provide the most relevant answer for EHU applicants.
            </p>
            
            <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-3">
                <input
                    type="text"
                    placeholder="e.g., 'What is the application deadline for this year?' or 'Do you offer scholarships for international students?'"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    className="flex-grow p-4 rounded-xl border-2 text-gray-800 focus:outline-none focus:ring-4 ring-green-200"
                    disabled={loading}
                    style={{ borderColor: EHU_COLORS.NAVY + '40' }}
                />
                <button
                    onClick={checkRequirements}
                    disabled={loading}
                    className={`py-3 px-8 rounded-xl font-bold text-lg transition duration-300 flex-shrink-0 flex items-center justify-center space-x-2 ${loading ? 'bg-gray-500 cursor-not-allowed' : 'hover:bg-green-700'}`}
                    style={{ backgroundColor: EHU_COLORS.GREEN, color: EHU_COLORS.WHITE }}
                >
                    {loading ? (
                        <>
                            <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                            <span>Searching...</span>
                        </>
                    ) : (
                        <span>Search & Respond</span>
                    )}
                </button>
            </div>
            
            {(answer || error) && (
                <div className="mt-6 p-6 rounded-xl border-l-8 shadow-inner" style={{ borderColor: EHU_COLORS.GOLD, backgroundColor: EHU_COLORS.WHITE }}>
                    <p className="font-bold mb-2 text-lg" style={{ color: EHU_COLORS.NAVY }}>EHU Admissions Response:</p>
                    <p className="text-base text-gray-700 whitespace-pre-wrap">{answer || error}</p>
                    
                    {sources.length > 0 && (
                        <div className="mt-4 pt-3 border-t border-gray-200">
                            <p className="text-xs font-semibold text-gray-600 mb-1">Information Grounded by:</p>
                            <ul className="space-y-1">
                                {sources.map((source, index) => (
                                    <li key={index} className="text-xs text-gray-500 truncate">
                                        <a href={source.uri} target="_blank" rel="noopener noreferrer" className="hover:underline text-green-700" title={source.title}>{source.title}</a>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

// --- LLM Powered Component 4: AI Student Event Planner (Structured Output) ---
const StudentEventPlanner = () => {
    const [eventType, setEventType] = useState('');
    const [eventIdeas, setEventIdeas] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const generateEvents = useCallback(async () => {
        if (!eventType.trim()) {
            setError("Please enter the type of event you need ideas for.");
            return;
        }

        setLoading(true);
        setEventIdeas(null);
        setError(null);

        const userQuery = `Generate three highly creative, unique, and culturally appropriate event concepts for East Hararghe University's student body based on the following event type: ${eventType}. Each concept must have a title, a theme description, and three suggested activities.`;

        const systemPrompt = "You are a creative student union event coordinator. You must generate exactly three event concepts in JSON format designed to foster community, regional pride, and academic celebration.";

        const apiKey = ""
        const apiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-05-20:generateContent?key=${apiKey}`;

        const payload = {
            contents: [{ parts: [{ text: userQuery }] }],
            systemInstruction: { parts: [{ text: systemPrompt }] },
            generationConfig: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: "ARRAY",
                    items: {
                        type: "OBJECT",
                        properties: {
                            "title": { "type": "STRING", "description": "Catchy title for the event." },
                            "theme": { "type": "STRING", "description": "A brief description of the event theme and its purpose." },
                            "activities": { 
                                "type": "ARRAY", 
                                "items": { "type": "STRING" },
                                "description": "Three unique suggested activities."
                            }
                        },
                        required: ["title", "theme", "activities"]
                    }
                }
            }
        };

        const MAX_RETRIES = 3;
        let attempt = 0;
        let success = false;

        while (attempt < MAX_RETRIES && !success) {
            try {
                const response = await fetch(apiUrl, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });

                if (!response.ok) {
                    throw new Error(`API Error: ${response.statusText}`);
                }

                const result = await response.json();
                const jsonText = result.candidates?.[0]?.content?.parts?.[0]?.text;
                
                if (jsonText) {
                    const parsedJson = JSON.parse(jsonText);
                    setEventIdeas(parsedJson);
                    success = true;
                } else {
                    throw new Error("Received empty or malformed JSON response from API.");
                }

            } catch (err) {
                console.error(`Attempt ${attempt + 1} failed:`, err);
                attempt++;
                if (attempt < MAX_RETRIES) {
                    const delay = Math.pow(2, attempt) * 1000;
                    await new Promise(resolve => setTimeout(resolve, delay));
                } else {
                    setError("Failed to generate event ideas after multiple retries.");
                }
            }
        }

        setLoading(false);

    }, [eventType]);

    return (
        <div className="p-8 rounded-2xl shadow-2xl transition duration-300 transform hover:shadow-3xl border-2" style={{ backgroundColor: EHU_COLORS.WHITE, borderColor: EHU_COLORS.GREEN }}>
            <div className="flex items-center mb-4">
                <IconCalendar className="w-6 h-6 mr-2" style={{ color: EHU_COLORS.NAVY }} />
                <h3 className="text-xl font-extrabold" style={{ color: EHU_COLORS.NAVY }}>AI Student Event Planner ✨</h3>
            </div>
            <p className="text-sm text-gray-700 mb-4">
                Need fresh ideas? Enter an event type (e.g., 'Welcome Week', 'Career Fair') and get three creative concepts, complete with themes and activities.
            </p>

            <input
                type="text"
                placeholder="e.g., 'End of Semester Party' or 'Faculty Meet and Greet'"
                value={eventType}
                onChange={(e) => setEventType(e.target.value)}
                className="w-full p-3 rounded-lg border-2 text-gray-800 focus:outline-none focus:border-green-500 mb-4"
                style={{ borderColor: EHU_COLORS.NAVY + '40' }}
                disabled={loading}
            />

            <button
                onClick={generateEvents}
                disabled={loading}
                className={`w-full flex items-center justify-center space-x-2 py-3 px-6 rounded-full font-bold transition duration-300 ${loading ? 'bg-gray-400 cursor-not-allowed' : 'hover:bg-green-700'}`}
                style={{ backgroundColor: EHU_COLORS.GREEN, color: EHU_COLORS.WHITE }}
            >
                {loading ? (
                    <>
                        <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                        <span>Planning...</span>
                    </>
                ) : (
                    <>
                        <IconSparkles className="w-4 h-4" />
                        <span>Brainstorm 3 Event Ideas</span>
                    </>
                )}
            </button>
            
            {(eventIdeas && eventIdeas.length > 0) && (
                <div className="mt-6 space-y-6">
                    <p className="font-bold mb-2 text-lg" style={{ color: EHU_COLORS.NAVY }}>Creative Event Concepts:</p>
                    {eventIdeas.map((idea, index) => (
                        <div key={index} className="p-4 rounded-xl shadow-md border-l-4" style={{ borderColor: EHU_COLORS.GOLD, backgroundColor: EHU_COLORS.LIGHT_BG }}>
                            <h4 className="text-xl font-extrabold mb-1" style={{ color: EHU_COLORS.GREEN }}>{idea.title}</h4>
                            <p className="text-sm italic text-gray-700 mb-3">{idea.theme}</p>
                            <ul className="list-disc list-inside space-y-1 text-sm text-gray-800">
                                {idea.activities.map((activity, aIndex) => (
                                    <li key={aIndex} className="ml-2">{activity}</li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </div>
            )}

            {error && (
                <div className="mt-6 p-4 rounded-xl border border-red-500 bg-red-50">
                    <p className="font-bold text-red-700">Error:</p>
                    <p className="text-sm text-red-600">{error}</p>
                </div>
            )}
        </div>
    );
};

// --- Student Life Section (New) ---
const StudentLifeSection = () => (
    <section id="life" className="py-20 md:py-32" style={{ backgroundColor: EHU_COLORS.LIGHT_BG }}>
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-4xl font-bold text-center mb-4" style={{ color: EHU_COLORS.NAVY }}>
                Campus & Student Life
            </h2>
            <p className="text-center text-xl text-gray-600 mb-16 max-w-3xl mx-auto">
                Beyond academics, EHU offers a vibrant social and cultural environment. Use our AI tool to plan your next great event!
            </p>

            <div className="max-w-3xl mx-auto">
                <StudentEventPlanner />
            </div>
            
            <div className="mt-16 text-center">
                <a href="#" className="inline-flex items-center font-bold text-lg hover:underline transition duration-200" style={{ color: EHU_COLORS.NAVY }}>
                    View Student Union Activities <IconChevronRight className="ml-2 w-4 h-4" />
                </a>
            </div>
        </div>
    </section>
);


// --- Header Component (Sticky, Clean) ---
const Header = () => {
    const [isOpen, setIsOpen] = useState(false);

    const toggleMenu = useCallback(() => setIsOpen(prev => !prev), []);

    return (
        <header className="sticky top-0 z-50 bg-white shadow-lg">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex items-center justify-between h-20">
                    {/* Logo: Changed to IconShield */}
                    <a href="#hero" className="flex items-center space-x-2 transition duration-300 hover:opacity-90">
                        <IconShield className="w-8 h-8" style={{ color: EHU_COLORS.GREEN }} /> 
                        <span className="text-xl font-extrabold" style={{ color: EHU_COLORS.NAVY }}>EHU</span>
                        <span className="hidden sm:inline text-xl font-light tracking-wide" style={{ color: EHU_COLORS.NAVY }}>University</span>
                    </a>

                    {/* Desktop Navigation */}
                    <nav className="hidden md:flex space-x-6 lg:space-x-10">
                        {SECTIONS.map(section => (
                            <a key={section.id} href={`#${section.id}`} className="text-gray-700 font-medium hover:text-green-700 transition duration-200 border-b-2 border-transparent hover:border-green-600 pb-1 uppercase text-sm tracking-wider">
                                {section.title}
                            </a>
                        ))}
                    </nav>

                    {/* Mobile Menu Button */}
                    <button onClick={toggleMenu} className="md:hidden p-2 rounded-lg text-gray-700 hover:bg-gray-100 transition duration-200 focus:outline-none" aria-label="Toggle menu">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={isOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16M4 18h16"}></path>
                        </svg>
                    </button>
                </div>
            </div>
            {/* Mobile Menu */}
            <div className={`md:hidden ${isOpen ? 'block' : 'hidden'} bg-white border-t border-gray-100`}>
                <div className="px-4 pt-2 pb-4 space-y-1 sm:px-6">
                    {SECTIONS.map(section => (
                        <a key={section.id} href={`#${section.id}`} onClick={toggleMenu} className="block px-3 py-2 rounded-lg text-base font-medium text-gray-700 hover:bg-gray-50 transition duration-150">
                            {section.title}
                        </a>
                    ))}
                </div>
            </div>
        </header>
    );
};

// --- Hero Section (High Contrast, Bold Text) ---
const HeroSection = () => (
    <section id="hero" style={{ backgroundColor: EHU_COLORS.NAVY }} className="relative overflow-hidden pt-24 pb-28 flex items-center min-h-[650px]">
        
        {/* Abstract Background Effect */}
        <div className="absolute inset-0 z-0 opacity-10">
            <div className="absolute w-64 h-64 bg-green-500 rounded-full blur-3xl opacity-30 top-10 left-10 animate-pulse-slow"></div>
            <div className="absolute w-80 h-80 bg-yellow-500 rounded-full blur-3xl opacity-30 bottom-10 right-10 animate-pulse-slow-reverse"></div>
        </div>

        <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
                {/* Left: Text Content */}
                <div className="lg:col-span-8 text-center lg:text-left">
                    <p className="text-lg font-semibold uppercase tracking-widest mb-3" style={{ color: EHU_COLORS.GOLD }}>
                        East Hararghe University
                    </p>
                    <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold text-white leading-tight mb-6">
                        Leading <span style={{ color: EHU_COLORS.GREEN }}>Innovation</span> for Regional Prosperity.
                    </h1>
                    <p className="text-xl text-gray-300 max-w-3xl lg:max-w-none mx-auto lg:mx-0 mb-12">
                        Serving as a center of academic excellence and impactful research from our main campus in **Jijiga, Somali Region, Ethiopia.**
                    </p>

                    {/* CTAs */}
                    <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4 justify-center lg:justify-start">
                        <a href="#colleges" style={{ backgroundColor: EHU_COLORS.GREEN }} className="text-white font-extrabold py-3 px-10 rounded-full text-lg transition duration-300 shadow-xl hover:shadow-2xl hover:scale-[1.03]">
                            Explore Programs
                        </a>
                        <a href="#admissions" style={{ borderColor: EHU_COLORS.WHITE, color: EHU_COLORS.WHITE }} className="border-2 font-bold py-3 px-10 rounded-full text-lg transition duration-300 hover:bg-white hover:text-navy-900">
                            Admissions Open
                        </a>
                    </div>
                </div>

                {/* Right: Statistics Card */}
                <div className="lg:col-span-4 hidden lg:block text-white">
                    <div className="space-y-6 p-8 rounded-3xl shadow-2xl backdrop-blur-sm" style={{ backgroundColor: EHU_COLORS.WHITE + '10' }}>
                        {[
                            { value: '25K+', label: 'Students Enrolled' },
                            { value: '50+', label: 'Academic Programs' },
                            { value: '700+', label: 'Faculty & Staff' },
                        ].map((stat, index) => (
                            <div key={index} className="pb-4 last:pb-0">
                                <p className="text-5xl font-extrabold" style={{ color: EHU_COLORS.GOLD }}>{stat.value}</p>
                                <p className="text-lg font-medium opacity-90 mt-1">{stat.label}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    </section>
);

// --- Mission & Vision (Clean, Split) ---
const MissionVision = () => (
    <section id="about" className="py-20 md:py-32" style={{ backgroundColor: EHU_COLORS.LIGHT_BG }}>
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-4xl font-bold text-center mb-4" style={{ color: EHU_COLORS.NAVY }}>
                Our Core Identity
            </h2>
            <p className="text-center text-xl text-gray-600 mb-20 max-w-3xl mx-auto">
                Setting the highest standards in education, research, and community partnership.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12">
                {/* Mission Card */}
                <div className="p-8 rounded-2xl shadow-xl bg-white transition duration-500 hover:shadow-2xl border-l-8" style={{ borderColor: EHU_COLORS.GREEN }}>
                    <div className="flex items-center mb-4">
                        <IconCheckCircle className="w-8 h-8 mr-3" style={{ color: EHU_COLORS.GREEN }}/>
                        <h3 className="text-2xl font-extrabold" style={{ color: EHU_COLORS.NAVY }}>Our Mission</h3>
                    </div>
                    <p className="text-base text-gray-700 leading-relaxed italic">
                        To cultivate **highly-skilled graduates** and perform **action-oriented research** that directly contributes to solving the socio-economic and environmental challenges facing the East Hararghe region and Ethiopia.
                    </p>
                </div>

                {/* Vision Card */}
                <div className="p-8 rounded-2xl shadow-xl bg-white transition duration-500 hover:shadow-2xl border-l-8" style={{ borderColor: EHU_COLORS.GOLD }}>
                    <div className="flex items-center mb-4">
                        <IconShield className="w-8 h-8 mr-3" style={{ color: EHU_COLORS.GOLD }}/>
                        <h3 className="text-2xl font-extrabold" style={{ color: EHU_COLORS.NAVY }}>Our Vision</h3>
                    </div>
                    <p className="text-base text-gray-700 leading-relaxed italic">
                        To achieve recognition as a **leading center of academic and research excellence** in the Horn of Africa by 2035, known for our developmental impact and global standards.
                    </p>
                </div>
            </div>
        </div>
    </section>
);


// --- Colleges & Faculties Section (Detailed and Tabular) ---
const collegeData = [
    { name: 'College of Health Sciences', departments: ['Medicine', 'Nursing', 'Pharmacy', 'Public Health'] },
    { name: 'College of Engineering & Technology', departments: ['Civil Engineering', 'Electrical Engineering', 'Mechanical Engineering', 'Computer Science'] },
    { name: 'College of Agriculture & Natural Resources', departments: ['Plant Science', 'Animal Science', 'Rural Development', 'Agricultural Economics'] },
    { name: 'College of Business & Economics', departments: ['Accounting & Finance', 'Management', 'Economics', 'Marketing'] },
    { name: 'College of Humanities & Social Sciences', departments: ['Law', 'Sociology', 'English Language & Literature', 'History'] },
];

const CollegesSection = () => {
    const [selectedCollege, setSelectedCollege] = useState(collegeData[0]);

    return (
        <section id="colleges" className="py-20 md:py-32 bg-white">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                <h2 className="text-4xl font-bold text-center mb-4" style={{ color: EHU_COLORS.NAVY }}>
                    Our Colleges & Departments
                </h2>
                <p className="text-center text-lg text-gray-600 max-w-4xl mx-auto mb-16">
                    We offer diverse and specialized academic programs structured under our five major colleges, and you can use our AI tool below to find your perfect fit.
                </p>

                <div className="grid grid-cols-1 lg:grid-cols-4 gap-10">
                    
                    {/* Left Panel: College List */}
                    <div className="lg:col-span-1 space-y-4">
                        <h3 className="text-xl font-bold mb-4 border-b pb-2" style={{ color: EHU_COLORS.GREEN }}>Select a College:</h3>
                        {collegeData.map((college) => (
                            <button
                                key={college.name}
                                onClick={() => setSelectedCollege(college)}
                                className={`w-full text-left p-4 rounded-xl shadow-md transition duration-200 focus:outline-none ${
                                    selectedCollege.name === college.name
                                        ? `bg-green-700 text-white font-bold shadow-xl border-l-4 border-l-4`
                                        : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-100'
                                }`}
                                style={selectedCollege.name === college.name ? { borderColor: EHU_COLORS.GOLD } : {}}
                            >
                                <div className="flex justify-between items-center">
                                    <span className="text-lg">{college.name}</span>
                                    <IconChevronRight className="w-5 h-5" />
                                </div>
                            </button>
                        ))}
                    </div>

                    {/* Middle Panel: Department Details */}
                    <div className="lg:col-span-2 p-8 rounded-2xl shadow-2xl transition duration-300" style={{ backgroundColor: EHU_COLORS.LIGHT_BG }}>
                        <h3 className="text-3xl font-extrabold mb-6" style={{ color: EHU_COLORS.NAVY }}>
                            {selectedCollege.name}
                        </h3>
                        <p className="text-gray-600 mb-8">
                            This college is dedicated to providing specialized training and conducting research vital to its professional domain.
                        </p>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {selectedCollege.departments.map((dept, index) => (
                                <div key={index} className="flex items-center space-x-3 p-3 rounded-lg bg-white shadow-sm">
                                    <span className="p-1 rounded-full text-white" style={{ backgroundColor: EHU_COLORS.GREEN }}>
                                        <IconShield className="w-4 h-4" />
                                    </span>
                                    <span className="font-medium text-gray-800">{dept}</span>
                                </div>
                            ))}
                        </div>
                        <a href="#" className="mt-8 inline-flex items-center font-bold transition duration-200" style={{ color: EHU_COLORS.GREEN }}>
                            View Full Curriculum <IconChevronRight className="ml-2 w-4 h-4" />
                        </a>
                    </div>

                    {/* Right Panel: AI Matchmaker */}
                    <AICourseGenerator />
                </div>
            </div>
        </section>
    );
};


// --- Research & Innovation Section (Highlighting Centers) ---
const ResearchSection = () => {
    const centers = [
        { title: 'Food Security Research Center', icon: IconFlask, color: EHU_COLORS.GREEN, focus: 'Developing climate-resilient crop varieties and improving local agricultural practices.' },
        { title: 'Water Resource Management Institute', icon: IconFlask, color: EHU_COLORS.NAVY, focus: 'Investigating sustainable water harvesting, conservation, and purification technologies.' },
        { title: 'Public Health & Epidemiology Unit', icon: IconUsers, color: EHU_COLORS.GOLD, focus: 'Conducting studies on communicable diseases and improving regional health service delivery.' },
        { title: 'Regional Planning & Development Institute', icon: IconBookOpen, color: EHU_COLORS.NAVY, focus: 'Providing policy advice and data for effective urban and rural planning initiatives.' },
    ];

    return (
        <section id="research" className="py-20 md:py-32" style={{ backgroundColor: EHU_COLORS.NAVY }}>
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
                <h2 className="text-4xl font-extrabold text-white text-center mb-4">
                    Research & Innovation Impact
                </h2>
                <p className="text-center text-xl text-gray-300 max-w-3xl mx-auto mb-16">
                    Our research is intrinsically linked to the developmental needs of Ethiopia and the Horn of Africa.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                    {centers.map((center, index) => (
                        <div key={index} className="p-6 rounded-xl shadow-xl transition duration-300 transform hover:scale-[1.03] border-t-4 border-b-8 bg-white/95" style={{ borderColor: center.color }}>
                            <center.icon className="w-10 h-10 mb-3" style={{ color: center.color }} />
                            <h3 className="text-xl font-bold mb-2" style={{ color: EHU_COLORS.NAVY }}>{center.title}</h3>
                            <p className="text-sm text-gray-600">{center.focus}</p>
                        </div>
                    ))}
                </div>

                {/* Integration of the LLM feature */}
                <div className="mt-20 flex justify-center">
                    <div className="w-full max-w-4xl">
                        <AIResearchBrainstormer />
                    </div>
                </div>
            </div>
        </section>
    );
};


// --- Admissions Query Section (Enhanced with Live Search Grounding) ---
const AdmissionsQuerySection = () => (
    <section id="admissions" style={{ background: `linear-gradient(90deg, ${EHU_COLORS.GREEN} 0%, ${EHU_COLORS.NAVY} 100%)` }} className="py-20 text-center shadow-inner">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-4xl sm:text-5xl font-extrabold text-white mb-4">Admissions & Application Info</h2>
            <p className="text-xl text-white max-w-3xl mx-auto mb-10 opacity-90">
                Use our **Live Query Tool** below to get instant answers about deadlines, requirements, and eligibility.
            </p>
            
            <AdmissionsQueryTool />

            <div className="mt-12">
                 <a href="#" style={{ backgroundColor: EHU_COLORS.GOLD, color: EHU_COLORS.NAVY }} className="inline-block font-extrabold py-4 px-16 rounded-full text-xl transition duration-300 transform shadow-xl hover:scale-[1.05] hover:shadow-2xl">
                    Proceed to Application Portal
                </a>
            </div>
        </div>
    </section>
);


// --- Footer Component (Detailed) ---
const Footer = () => (
    <footer id="contact" style={{ backgroundColor: EHU_COLORS.NAVY }} className="text-white pt-16 pb-8">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-2 md:grid-cols-5 gap-10 border-b border-gray-700 pb-10">
                {/* 1. University Name/Motto */}
                <div className="col-span-2 md:col-span-2">
                    <h4 className="text-2xl font-extrabold mb-4" style={{ color: EHU_COLORS.GREEN }}>East Hararghe University</h4>
                    <p className="text-sm text-gray-400 max-w-xs">
                        A dedicated, impactful institution driving academic and research excellence in the region.
                    </p>
                </div>

                {/* 2. Quick Links */}
                <div>
                    <h4 className="text-lg font-bold mb-4" style={{ color: EHU_COLORS.GOLD }}>Academics</h4>
                    <ul className="space-y-2 text-sm">
                        <li><a href="#colleges" className="text-gray-400 hover:text-white transition duration-300">Faculties & Colleges</a></li>
                        <li><a href="#research" className="text-gray-400 hover:text-white transition duration-300">Research Centers</a></li>
                        <li><a href="#" className="text-gray-400 hover:text-white transition duration-300">E-Learning Portal</a></li>
                        <li><a href="#life" className="text-gray-400 hover:text-white transition duration-300">Student Life</a></li>
                    </ul>
                </div>

                {/* 3. Resources */}
                <div>
                    <h4 className="text-lg font-bold mb-4" style={{ color: EHU_COLORS.GOLD }}>Resources</h4>
                    <ul className="space-y-2 text-sm">
                        <li><a href="#" className="text-gray-400 hover:text-white transition duration-300">Alumni Network</a></li>
                        <li><a href="#" className="text-gray-400 hover:text-white transition duration-300">Campus Map</a></li>
                        <li><a href="#" className="text-gray-400 hover:text-white transition duration-300">Public Tender Notices</a></li>
                    </ul>
                </div>

                {/* 4. Contact & Location */}
                <div>
                    <h4 className="text-lg font-bold mb-4" style={{ color: EHU_COLORS.GOLD }}>Contact</h4>
                    <ul className="space-y-2 text-sm text-gray-400">
                        <li><p>Jijiga, Somali Region, Ethiopia</p></li>
                        <li><p>Email: info@ehu.edu.et</p></li>
                        <li><p>Phone: +251 912 345 678</p></li>
                    </ul>
                </div>
            </div>

            {/* Copyright */}
            <div className="mt-12 text-center text-gray-500 text-xs">
                &copy; {new Date().getFullYear()} East Hararghe University. All Rights Reserved.
            </div>
        </div>
    </footer>
);

// --- Main App Component ---
const App = () => {
    return (
        <div className="font-sans text-gray-800 bg-white min-h-screen">
             {/* Simple CSS for custom animations (pulse effect for the background) */}
            <style>{`
                @keyframes pulseSlow {
                    0%, 100% { transform: scale(1) translate(0, 0); }
                    50% { transform: scale(1.05) translate(5%, 5%); opacity: 0.4; }
                }
                .animate-pulse-slow {
                    animation: pulseSlow 30s infinite ease-in-out;
                }
                .animate-pulse-slow-reverse {
                    animation: pulseSlow 30s infinite ease-in-out reverse;
                }
            `}</style>

            <Header />
            <main>
                <HeroSection />
                <MissionVision />
                <CollegesSection />
                <ResearchSection />
                <StudentLifeSection />
                <AdmissionsQuerySection />
            </main>
            <Footer />
        </div>
    );
};

export default App;
