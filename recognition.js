// recognition.js
class RecognitionManager {
    constructor() {
        this.isListening = false;
        this.recognition = null;
        this.isWakeWordActivated = false;
        this.currentDevice = null;
        this.devices = [];
        
        // Ierīces tipa noteikšana
        this.isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
        console.log('Ierīces tips:', this.isMobile ? 'Mobilā' : 'Desktop');
        console.log('Pārlūks:', navigator.userAgent);

        this.commands = {
            wakeWords: ['adelaida', 'ada', 'adi'],
            dances: ['bērzgale', 'berliņš', 'kvadrāts', 'rusiņš', 'narečenka'],
            controls: ['stop', 'pauze', 'turpini']
        };

        this.initializeSystem();
    }

    async initializeSystem() {
        if (!await this.checkSpeechSupport()) {
            return;
        }
        await this.checkPermissions();
        await this.initializeAudioDevices();
        this.setupSpeechRecognition();
    }

    async checkSpeechSupport() {
        if (!window.SpeechRecognition && !window.webkitSpeechRecognition) {
            console.error('Pārlūks neatbalsta runas atpazīšanu');
            window.uiManager.updateSystemLog('Pārlūks neatbalsta runas atpazīšanu');
            return false;
        }
        return true;
    }

    async checkPermissions() {
        try {
            const result = await navigator.permissions.query({ name: 'microphone' });
            console.log('Mikrofona atļaujas status:', result.state);
            window.uiManager.updateSystemLog(`Mikrofona atļaujas status: ${result.state}`);
            return result.state === 'granted';
        } catch (error) {
            console.error('Kļūda pārbaudot atļaujas:', error);
            window.uiManager.updateSystemLog('Kļūda pārbaudot mikrofona atļaujas');
            return false;
        }
    }

    async initializeAudioDevices() {
        try {
            await navigator.mediaDevices.getUserMedia({ audio: true });
            const devices = await navigator.mediaDevices.enumerateDevices();
            this.devices = devices.filter(d => d.kind === 'audioinput');
            console.log('Pieejamās audio ierīces:', this.devices);
            
            // Izveidojam ierīču izvēlni
            this.createDeviceSelector();
            
            // Pievienojam ierīču maiņas novērošanu
            navigator.mediaDevices.addEventListener('devicechange', async () => {
                const updatedDevices = await navigator.mediaDevices.enumerateDevices();
                this.devices = updatedDevices.filter(d => d.kind === 'audioinput');
                this.createDeviceSelector();
            });
        } catch (error) {
            console.error('Audio ierīču inicializācijas kļūda:', error);
            window.uiManager.updateSystemLog('Kļūda inicializējot audio ierīces');
        }
    }

    setupSpeechRecognition() {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        this.recognition = new SpeechRecognition();
        
        // Bāzes iestatījumi
        this.recognition.lang = 'lv-LV';
        this.recognition.continuous = false;
        this.recognition.interimResults = true;
        
        // Piemērojam mobilos iestatījumus ja nepieciešams
        if (this.isMobile) {
            this.recognition.interimResults = false;
            this.recognition.maxAlternatives = 1;
        }

        this.setupRecognitionHandlers();
    }

    setupRecognitionHandlers() {
        this.recognition.onresult = (event) => {
            const result = event.results[event.results.length - 1];
            
            if (!result.isFinal) {
                const text = result[0].transcript.toLowerCase();
                console.log('Pagaidu rezultāts:', text);
                return;
            }

            const text = result[0].transcript.toLowerCase();
            console.log('Galīgais rezultāts:', text);
            this.handleRecognizedText(text);
        };

        this.recognition.onerror = (event) => {
            console.error('Kļūdas tips:', event.error);
            window.uiManager.updateSystemLog(`Runas atpazīšanas kļūda: ${event.error}`);
            
            if (event.error === 'not-allowed') {
                this.handlePermissionError();
            } else if (event.error === 'network') {
                this.handleNetworkError();
            } else {
                this.restartRecognition();
            }
        };

        this.recognition.onend = () => {
            if (this.isListening) {
                this.restartRecognition();
            }
        };
    }

    handleRecognizedText(text) {
        if (!this.isWakeWordActivated) {
            if (this.commands.wakeWords.some(word => text.includes(word))) {
                this.isWakeWordActivated = true;
                window.uiManager.updateStatusText('Aktivizēts - klausos...');
                window.uiManager.updateChatLog(`Jūs: ${text}`);
                const response = window.responseManager.findResponse('wake_word');
                if (response) {
                    window.uiManager.handleResponse(response);
                }
            }
            return;
        }

        window.uiManager.updateChatLog(`Jūs: ${text}`);
        const response = window.audioManager.handleCommand(text);
        
        if (response) {
            this.isWakeWordActivated = false;
            window.uiManager.updateStatusText('Gaidu aktivizāciju...');
            window.uiManager.handleResponse(response);
        }
    }

    handlePermissionError() {
        window.uiManager.updateSystemLog('Nav piekļuves mikrofonam. Lūdzu, atļaujiet piekļuvi.');
        this.stopListening();
    }

    handleNetworkError() {
        window.uiManager.updateSystemLog('Tīkla kļūda. Mēģinām vēlreiz...');
        this.restartRecognition();
    }

    restartRecognition() {
        if (!this.isListening) return;

        setTimeout(() => {
            try {
                this.recognition.start();
            } catch (error) {
                console.error('Kļūda restartējot:', error);
                window.uiManager.updateSystemLog('Kļūda restartējot klausīšanos');
            }
        }, 100);
    }

    async startListening() {
        try {
            if (this.currentDevice) {
                await navigator.mediaDevices.getUserMedia({
                    audio: { deviceId: { exact: this.currentDevice } }
                });
            } else {
                await navigator.mediaDevices.getUserMedia({ audio: true });
            }
            
            this.isListening = true;
            document.querySelector('.mic-btn').classList.add('active');
            window.uiManager.updateStatusText('Klausos...');
            this.recognition.start();
            
        } catch (error) {
            console.error('Kļūda sākot klausīšanos:', error);
            window.uiManager.updateSystemLog('Kļūda sākot klausīšanos');
        }
    }

    stopListening() {
        this.isListening = false;
        document.querySelector('.mic-btn').classList.remove('active');
        window.uiManager.updateStatusText('Gaidīšanas režīmā');
        if (this.recognition) {
            this.recognition.stop();
        }
    }

    toggleListening() {
        if (this.isListening) {
            this.stopListening();
        } else {
            this.startListening();
        }
    }

    createDeviceSelector() {
        let select = document.getElementById('audioDeviceSelect');
        if (!select) {
            select = document.createElement('select');
            select.id = 'audioDeviceSelect';
            select.className = 'audio-device-select';
            const inputSection = document.querySelector('.input-section');
            inputSection.insertBefore(select, inputSection.firstChild);
        }

        select.innerHTML = '';
        this.devices.forEach(device => {
            const option = document.createElement('option');
            option.value = device.deviceId;
            option.text = device.label || `Mikrofons ${device.deviceId.slice(0, 5)}`;
            select.appendChild(option);
        });

        select.addEventListener('change', (e) => {
            this.switchAudioDevice(e.target.value);
        });
    }

    async switchAudioDevice(deviceId) {
        try {
            if (this.isListening) {
                this.stopListening();
            }
            
            this.currentDevice = deviceId;
            await this.startListening();
            window.uiManager.updateSystemLog('Audio ierīce nomainīta');
            
        } catch (error) {
            console.error('Kļūda mainot audio ierīci:', error);
            window.uiManager.updateSystemLog('Kļūda mainot audio ierīci');
        }
    }
}

export const recognitionManager = new RecognitionManager();
