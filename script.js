let isListening = false;
let recognition;
let responses;
let lastVideoTime = 0;
let lastAudioTime = 0;
let currentSong = null;
let preparationTimeout = null;
let currentTimemark = null;
const PREPARATION_TIME = 5; // Sekundes sagatavoties

function pausePlayback() {
    const audio = document.getElementById('mainAudio');
    if (audio) {
        audio.pause();
        lastAudioTime = audio.currentTime;
        updateSystemLog('Audio nopauzēts pozīcijā: ' + lastAudioTime);
    }
}

async function prepareAndPlayTimemark(song, mark, time) {
    const mainAudio = document.getElementById('mainAudio');
    const prepAudio = document.getElementById('preparationAudio');
    
    if (preparationTimeout) clearTimeout(preparationTimeout);

    mainAudio.pause();
    prepAudio.pause();
    
    // Uzstāda avotus
    mainAudio.src = responses[song].audio_path;
    await mainAudio.load();
    mainAudio.currentTime = time;

    prepAudio.src = 'MUSIC/sounds/iespele.mp3';
    await prepAudio.load();

    console.log('Sāk atskaņot iespele.mp3');
    updateSystemLog('Sāk atskaņot iespele.mp3');

    try {
        prepAudio.onended = async () => {
            try {
                if (!mainAudio.paused) { // Pārbauda vai audio jau neatskaņojas
                    mainAudio.pause();
                }
                mainAudio.currentTime = time;
                await mainAudio.play();
            } catch (error) {
                console.error('Kļūda:', error);
            }
        };
        await prepAudio.play();
    } catch (error) {
        console.error('Kļūda:', error);
        updateSystemLog(`Kļūda: ${error.message}`);
    }
}


function findResponse(text) {
    text = text.toLowerCase().trim();
    
    // Pauzes apstrāde
    if (text.includes('pauze')) {
        const mainAudio = document.getElementById('mainAudio');
        if (mainAudio) {
            mainAudio.pause();
            lastAudioTime = mainAudio.currentTime; // Saglabā pozīciju
        }
        return "Mūzika nopauzēta";
    }

    // Timemark atskaņošanas apstrāde
    if (text.includes('sāc no') || text.includes('palaid no') || text.includes('atskaņo no')) {
        const songToCheck = currentSong || 'berlins_full';
        console.log('Pārbauda dziesmu:', songToCheck);
        console.log('Visi timemarks:', responses[songToCheck]?.timemarks);
        console.log('Pašreizējais teksts:', text);
    
    
    if (responses[songToCheck]?.timemarks) {
        const timemarks = responses[songToCheck].timemarks;
        for (const [mark, time] of Object.entries(timemarks)) {
            if (text.includes(mark)) {
                prepareAndPlayTimemark(songToCheck, mark, time);
                return `Sagatavojamies, sāksim no ${mark}`;
            }
        }
    }
}

    // Parastā dziesmas atskaņošana
    for (const category in responses) {
        const categoryData = responses[category];
        if (categoryData.questions) {
            for (const question of categoryData.questions) {
                if (text.includes(question.toLowerCase())) {
                    if (categoryData.audio_path) {
                        currentSong = category;
                        playAudio(categoryData.audio_path);
                    }
                    return categoryData.answers[Math.floor(Math.random() * categoryData.answers.length)];
                }
            }
        }
    }

    return null;
}

function playAudio(path, startTime = 0) {
    const audio = document.getElementById('mainAudio');
    if (!audio) {
        updateSystemLog('Audio elements nav atrasts');
        return;
    }

    console.log('Mēģina atskaņot audio:', path);
    updateSystemLog(`Atskaņo audio: ${path}`);

    audio.pause();
    audio.src = path;
    audio.currentTime = startTime;
    audio.load();
    
    audio.oncanplay = function() {
        audio.play()
            .then(() => {
                console.log('Audio atskaņošana sākta');
                updateSystemLog('Audio atskaņošana sākta');
            })
            .catch(error => {
                console.error('Audio atskaņošanas kļūda:', error);
                updateSystemLog(`Audio atskaņošanas kļūda: ${error.message}`);
            });
    };
}

// Ielādējam responses.json
fetch('responses.json')
    .then(response => response.json())
    .then(data => {
        console.log('Responses ielādētas:', data);
        responses = data;
    })
    .catch(error => console.error('Kļūda ielādējot responses:', error));

document.addEventListener('DOMContentLoaded', async function() {
    setupEventListeners();
    setupSpeechRecognition();
    startListening();
    setupTabSwitching();
    setInterval(updateClock, 1000);
    updateClock();
});

function setupEventListeners() {
    document.querySelector('.mic-btn').addEventListener('click', toggleListening);
    
    const stopButton = document.querySelector('.input-section span:nth-child(3)');
    stopButton.addEventListener('click', () => {
        stopPlayback();
        handleResponse("Mūzikas atskaņošana ir apturēta");
    });
    
    document.querySelector('.input-section span:last-child').addEventListener('click', handleSendButton);
    
    document.getElementById('textInput').addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            handleTextInput(this.value);
            this.value = '';
        }
    });
}

function setupTabSwitching() {
    const tabs = document.querySelectorAll('.tab');
    const chatLog = document.getElementById('chatLog');
    const systemLog = document.getElementById('systemLog');

    tabs[0].addEventListener('click', () => {
        tabs[0].classList.add('active');
        tabs[1].classList.remove('active');
        chatLog.style.display = 'block';
        systemLog.style.display = 'none';
    });

    tabs[1].addEventListener('click', () => {
        tabs[1].classList.add('active');
        tabs[0].classList.remove('active');
        systemLog.style.display = 'block';
        chatLog.style.display = 'none';
    });
}

function handleTextInput(text) {
    if (!text.trim()) return;
    
    console.log('Teksta ievade:', text);
    updateChatLog(`Jūs: ${text}`);
    const response = findResponse(text.toLowerCase().trim());
    if (response) {
        handleResponse(response);
    }
}

function handleSendButton() {
    const textInput = document.getElementById('textInput');
    handleTextInput(textInput.value);
    textInput.value = '';
}

function toggleListening() {
    if (isListening) {
        stopListening();
    } else {
        startListening();
    }
}

function setupSpeechRecognition() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
        console.error('Pārlūks neatbalsta runas atpazīšanu');
        updateSystemLog('Pārlūks neatbalsta runas atpazīšanu');
        return;
    }

    recognition = new SpeechRecognition();
    recognition.lang = 'lv-LV';
    recognition.continuous = true;
    recognition.interimResults = false;

    recognition.onresult = function(event) {
        const text = event.results[event.results.length - 1][0].transcript;
        console.log('Atpazīts teksts:', text);
        updateChatLog(`Jūs: ${text}`);
        
        const response = findResponse(text.toLowerCase().trim());
        if (response) {
            handleResponse(response);
        }
    };

    recognition.onerror = function(event) {
        console.error('Runas atpazīšanas kļūda:', event.error);
        updateSystemLog(`Runas atpazīšanas kļūda: ${event.error}`);
    };

    recognition.onend = function() {
        if (isListening) {
            recognition.start();
        }
    };
}

async function startListening() {
    try {
        await navigator.mediaDevices.getUserMedia({ audio: true });
        if (!recognition) return;
        isListening = true;
        document.querySelector('.mic-btn').classList.add('active');
        document.getElementById('statusText').textContent = 'Klausos...';
        recognition.start();
    } catch (error) {
        console.error('Mikrofonam nav piekļuves:', error);
        updateSystemLog(`Mikrofonam nav piekļuves: ${error.message}`);
    }
}

async function handleResponse(response) {
    console.log('Atbilde:', response);
    updateChatLog(`Asistents: ${response}`);

    if (response === "Mūzikas atskaņošana ir apturēta") {
        stopPlayback();
        return;
    }
    if (response === "Mūzika nopauzēta") {
        pausePlayback();
        return;
    }
    if (response.includes("Sagatavojamies")) {
        return; // Jau apstrādāts findResponse funkcijā
    }

    const videoPath = responses.video_paths && responses.video_paths[response];
    if (videoPath) {
        playVideo(videoPath);
    }

    const audioPath = responses.music_paths && responses.music_paths[response];
    if (audioPath) {
        playAudio(audioPath);
    }
}

function stopListening() {
    if (!recognition) return;
    isListening = false;
    document.querySelector('.mic-btn').classList.remove('active');
    document.getElementById('statusText').textContent = 'Gaidīšanas režīmā';
    recognition.stop();
}

function stopPlayback() {
    const video = document.getElementById('mainVideo');
    const audio = document.getElementById('mainAudio');
    
    if (video && !video.paused) {
        video.pause();
        lastVideoTime = video.currentTime;
        updateSystemLog('Video atskaņošana apturēta');
    }
    if (audio && !audio.paused) {
        audio.pause();
        lastAudioTime = audio.currentTime;
        updateSystemLog('Audio atskaņošana apturēta');
    }
}

function playVideo(path) {
    const video = document.getElementById('mainVideo');
    if (!video) {
        updateSystemLog('Video elements nav atrasts');
        return;
    }

    console.log('Mēģina atskaņot video:', path);
    updateSystemLog(`Atskaņo video: ${path}`);

    video.pause();
    video.src = path;
    lastVideoTime = 0;
    video.load();
    
    video.oncanplay = function() {
        video.play()
            .then(() => {
                updateSystemLog('Video atskaņošana sākta');
            })
            .catch(error => {
                updateSystemLog(`Video atskaņošanas kļūda: ${error.message}`);
            });
    };
}

function updateChatLog(message) {
    const chatLog = document.getElementById('chatLog');
    const time = new Date().toLocaleTimeString();
    chatLog.innerHTML += `\n[${time}] ${message}`;
    chatLog.scrollTop = chatLog.scrollHeight;
}

function updateSystemLog(message) {
    const systemLog = document.getElementById('systemLog');
    const time = new Date().toLocaleTimeString();
    systemLog.innerHTML += `\n[${time}] ${message}`;
    systemLog.scrollTop = systemLog.scrollHeight;
}

function updateClock() {
    const now = new Date();
    const seconds = now.getSeconds();
    const minutes = now.getMinutes();
    const hours = now.getHours();

    const secondDegrees = ((seconds / 60) * 360);
    const minuteDegrees = ((minutes + seconds/60) / 60) * 360;
    const hourDegrees = ((hours % 12 + minutes/60) / 12) * 360;

    document.querySelector('.second-hand').style.transform = 
        `translateX(-50%) rotate(${secondDegrees}deg)`;
    document.querySelector('.minute-hand').style.transform = 
        `translateX(-50%) rotate(${minuteDegrees}deg)`;
    document.querySelector('.hour-hand').style.transform = 
        `translateX(-50%) rotate(${hourDegrees}deg)`;
}
