// recognition.js
class RecognitionManager {
    constructor() {
        this.isListening = false;
        this.recognition = null;
        this.setup();
    }

    setup() {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) return;

        this.recognition = new SpeechRecognition();
        this.recognition.lang = 'lv-LV';
        this.recognition.continuous = false;
        this.recognition.interimResults = false;

        this.setupEventListeners();
    }

    setupEventListeners() {
        this.recognition.onstart = () => {
            this.isListening = true;
            window.uiManager.updateStatusText('Klausos...');
            document.querySelector('.mic-btn').classList.add('active');
        };

        this.recognition.onend = () => {
            this.isListening = false;
            window.uiManager.updateStatusText('Gaidīšanas režīmā');
            document.querySelector('.mic-btn').classList.remove('active');
        };

        this.recognition.onresult = (event) => {
            const text = event.results[0][0].transcript.toLowerCase();
            this.handleRecognizedText(text);
        };

        this.recognition.onerror = (event) => {
            if (event.error !== 'no-speech') {
                console.error('Runas atpazīšanas kļūda:', event.error);
            }
            this.stopListening();
        };
    }

    handleRecognizedText(text) {
        window.uiManager.updateChatLog(`Jūs: ${text}`);
        const response = window.audioManager.handleCommand(text);
        if (response) window.uiManager.handleResponse(response);
    }

    toggleListening() {
        if (this.isListening) {
            this.stopListening();
        } else {
            this.startListening();
        }
    }

    startListening() {
        if (!this.isListening && this.recognition) {
            try {
                this.recognition.start();
            } catch (error) {
                console.error('Kļūda startējot:', error);
            }
        }
    }

    stopListening() {
        if (this.isListening && this.recognition) {
            try {
                this.recognition.stop();
            } catch (error) {
                console.error('Kļūda apturot:', error);
            }
        }
    }
}

export const recognitionManager = new RecognitionManager();