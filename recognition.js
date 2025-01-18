// recognition.js
class RecognitionManager {
    constructor() {
        this.isListening = false;
        this.recognition = null;
        this.mediaRecorder = null;
        this.stream = null;
        this.isWakeWordActivated = false;
        
        this.commands = {
            wakeWords: ['adelaida', 'ada', 'dj', 'adi'],
            dances: [
                'bērzgale', 'berliņš', 'kvadrāts', 'rikava',
                'krusta kazāks', 'ciganovskis', 'lancejots'
            ],
            controls: ['stop', 'beidz', 'apstāties', 'pauze', 'turpini', 'atsākt']
        };

        this.setupRecognition();
    }

    setupRecognition() {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        
        if (!SpeechRecognition) {
            console.error('Pārlūks neatbalsta runas atpazīšanu');
            return;
        }

        this.recognition = new SpeechRecognition();
        this.recognition.lang = 'lv-LV';
        this.recognition.continuous = false; // Mainīts uz false
        this.recognition.interimResults = false; // Mainīts uz false
        
        this.recognition.onstart = () => {
            console.log('Sākam klausīties...');
            window.uiManager.updateStatusText('Klausos...');
        };

        this.recognition.onend = () => {
            console.log('Beidzam klausīties');
            this.isListening = false;
            document.querySelector('.mic-btn').classList.remove('active');
            window.uiManager.updateStatusText('Gaidīšanas režīmā');
        };

        this.recognition.onresult = (event) => {
            const text = event.results[0][0].transcript.toLowerCase();
            console.log('Atpazīts teksts:', text);
            
            window.uiManager.updateChatLog(`Jūs: ${text}`);

            // Pārbaudam wake word
            if (this.commands.wakeWords.some(word => text.includes(word))) {
                const response = window.responseManager.findResponse('wake_word');
                if (response) {
                    window.uiManager.handleResponse(response);
                }
                return;
            }

            // Pārbaudam pārējās komandas
            const response = window.audioManager.handleCommand(text);
            if (response) {
                window.uiManager.handleResponse(response);
            }
        };

        this.recognition.onerror = (event) => {
            console.error('Kļūda:', event.error);
            if (event.error !== 'no-speech') {
                window.uiManager.updateSystemLog(`Kļūda: ${event.error}`);
            }
            this.stopListening();
        };
    }

    async startListening() {
        if (this.isListening) return;

        try {
            // Pieprasām mikrofona piekļuvi
            await navigator.mediaDevices.getUserMedia({ audio: true });
            
            this.isListening = true;
            document.querySelector('.mic-btn').classList.add('active');
            
            // Sākam jaunu recognition sesiju
            this.recognition.start();

        } catch (error) {
            console.error('Kļūda piekļūstot mikrofonam:', error);
            window.uiManager.updateSystemLog(`Kļūda: ${error.message}`);
            this.stopListening();
        }
    }

    stopListening() {
        if (!this.isListening) return;

        try {
            this.recognition.stop();
        } catch (error) {
            console.error('Kļūda apturot klausīšanos:', error);
        }

        this.isListening = false;
        document.querySelector('.mic-btn').classList.remove('active');
        window.uiManager.updateStatusText('Gaidīšanas režīmā');
    }

    toggleListening() {
        if (this.isListening) {
            this.stopListening();
        } else {
            this.startListening();
        }
    }
}

export const recognitionManager = new RecognitionManager();