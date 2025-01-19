// recognition.js
class RecognitionManager {
    constructor() {
        this.isListening = false;
        this.recognition = null;
        this.isWakeWordActivated = false;
        this.currentDevice = null;
        this.devices = [];
        
        this.commands = {
            wakeWords: ['adelaida', 'ada', 'dj', 'adi'],
            dances: [
                'bērzgale','bērzgali', 'berliņš', 'berliņu','kvadrāts', 'kvadrātu', 'rikava',
                'rikavu', 'krusta kazāks',
                'ciganovskis', 'ciganovski','lancejots', 'balabaska', 'rusiņš', 'liriskā',
                'narečenka', 'narečenka remikss', 'family jig', 'džīga', 'žīga', 'rusiņu', 'padespaņs', 'spainis',
                'bada spains', 'sarkano', 'sarkanais', 'uz upīti', 'uz upi'
            ],
            parts: [
                // Vispārīgās daļas
                'sākums', 'otrais sākums',
                'vidus', 'beigas',
                'solo', 'maiņa',

                // Dārziņi
                'dārziņš', 'pirmais dārziņš', 'otrais dārziņš', 'trešais dārziņš',
                'meitu dārziņš', 'puišu dārziņš', 'lielais dārziņš',
                'pirmie mazie dārziņi', 'otrie mazie dārziņi', 'mazie dārziņi',

                // Numerētās daļas
                'pirmā', 'otrā', 'trešā', 'ceturtā', 'piektā', 'sestā',
                'pirmā daļa', 'otrā daļa',

                // Specifiskās daļas
                'vārtiņi', 'vārtiņi otrie',
                'puiši', 'puiši pirmais', 'puiši otrie',
                'vija', 'vija pirmā', 'vija otrā',
                'valsis', 'valsis otrais',
                'dzirnavas', 'puišu dzirnavas', 'meitu dzirnavas',
                'meitas', 'meitas vidū',
                'do za do','pirmais gabals','otrais gabals','trešais gabals','ceturtais gabals',
                'piektais gabals','sestais gabals',

                // Rikavas dejas daļas
                'domāšanas gabals', 'dancošanas gabals',
                'spārdīšanas gabals', 'kumeļa gabals', 'cīruļa gabals',

                // Specifiskās kustības
                'pirmais gājiens', 'otrais gājiens',
                'pa trim', 'stiķis',
                'diognāles pirmās', 'diognāles otrās',
                'piedziedājums'
            ],
            controls: ['stop', 'beidz', 'apstāties', 'pauze', 'turpini', 'atsākt']
        };

        this.setupSpeechRecognition();
        this.initializeAudioDevices();
    }


    setupSpeechRecognition() {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        const SpeechGrammarList = window.SpeechGrammarList || window.webkitSpeechGrammarList;
        
        if (!SpeechRecognition) {
            console.error('Pārlūks neatbalsta runas atpazīšanu');
            window.uiManager.updateSystemLog('Pārlūks neatbalsta runas atpazīšanu');
            return;
        }

        // Izveidojam gramatiku ar visām komandām
        const grammar = '#JSGF V1.0; grammar commands; public <command> = ' + 
            [...this.commands.wakeWords, ...this.commands.dances, 
             ...this.commands.parts, ...this.commands.controls].join(' | ') + ' ;';

        this.recognition = new SpeechRecognition();
        const speechRecognitionList = new SpeechGrammarList();
        speechRecognitionList.addFromString(grammar, 1);

        this.recognition.grammars = speechRecognitionList;
        this.recognition.lang = 'lv-LV';
        this.recognition.continuous = false;  // Mainām uz false ātrākai reakcijai
        this.recognition.interimResults = true;  // Ieslēdzam interim rezultātus
        this.recognition.maxAlternatives = 3;
                
        this.recognition.onresult = (event) => {
            const result = event.results[event.results.length - 1];
            
            // Apstrādājam interim rezultātus kontroles komandām
            if (!result.isFinal) {
                const text = result[0].transcript.toLowerCase();
                console.log('Interim rezultāts:', text);
                
                // Ātrā kontroles komandu pārbaude
                if (this.commands.controls.some(cmd => text.includes(cmd))) {
                    window.uiManager.updateChatLog(`Jūs: ${text}`);
                    const response = window.audioManager.handleCommand(text);
                    if (response) {
                        window.uiManager.handleResponse(response);
                        this.recognition.abort(); // Tūlītēja apturēšana
                        this.restartRecognition(); // Restartējam klausīšanos
                    }
                    return;
                }
                return;
            }

            // Apstrādājam galīgos rezultātus
            const alternatives = Array.from(result).map(r => r.transcript.toLowerCase());
            console.log('Galīgie rezultāti:', alternatives);
            
            // Meklējam labāko atbilstību
            const bestMatch = this.findBestMatch(alternatives);
            if (!bestMatch) {
                console.log('Nav atrasta atbilstoša komanda');
                return;
            }

            const text = bestMatch;
            console.log('Izmantotā komanda:', text);

            // Pārbaudam wake word
            if (!this.isWakeWordActivated) {
                const isWakeWord = this.commands.wakeWords.some(word => text.includes(word));
                if (isWakeWord) {
                    this.isWakeWordActivated = true;
                    window.uiManager.updateStatusText('Aktivizēts - klausos...');
                    window.uiManager.updateChatLog(`Jūs: ${text}`);
                    const response = window.responseManager.findResponse('wake_word');
                    if (response) {
                        window.uiManager.handleResponse(response);
                    }
                }
                this.restartRecognition();
                return;
            }

            // Apstrādājam pārējās komandas
            window.uiManager.updateChatLog(`Jūs: ${text}`);
            const response = window.audioManager.handleCommand(text);
            
            if (response) {
                this.isWakeWordActivated = false;
                window.uiManager.updateStatusText('Gaidu aktivizāciju...');
                window.uiManager.handleResponse(response);
            }
            
            this.restartRecognition();
        };

        this.recognition.onerror = (event) => {
            console.error('Runas atpazīšanas kļūda:', event.error);
            window.uiManager.updateSystemLog(`Runas atpazīšanas kļūda: ${event.error}`);
            if (event.error === 'not-allowed') {
                window.uiManager.updateSystemLog('Pārlūkam nav piekļuves mikrofonam. Lūdzu, atļaujiet piekļuvi.');
            }
            this.restartRecognition();
        };

        this.recognition.onend = () => {
            if (this.isListening) {
                this.restartRecognition();
            }
        };
    }

    // Jauna metode klausīšanās restartēšanai
    restartRecognition() {
        if (this.isListening) {
            setTimeout(() => {
                try {
                    this.recognition.start();
                } catch (error) {
                    console.error('Kļūda restartējot klausīšanos:', error);
                }
            }, 50); // Minimāla pauze starp sesijām
        }
    }

    findBestMatch(alternatives) {
        // Visas iespējamās komandas
        const allCommands = [
            ...this.commands.wakeWords,
            ...this.commands.dances,
            ...this.commands.parts,
            ...this.commands.controls
        ];

        // Meklējam precīzu atbilstību
        for (const alternative of alternatives) {
            for (const command of allCommands) {
                if (alternative.includes(command)) {
                    return alternative;
                }
            }
        }

        return null;
    }

    async initializeAudioDevices() {
        try {
            const devices = await navigator.mediaDevices.enumerateDevices();
            this.devices = devices.filter(device => device.kind === 'audioinput');
            
            console.log('Pieejamās audio ierīces:', this.devices);
            window.uiManager.updateSystemLog('Atrastās audio ierīces: ' + 
                this.devices.map(d => d.label || 'Ierīce ' + d.deviceId).join(', '));

            this.createDeviceSelector();

            navigator.mediaDevices.addEventListener('devicechange', async () => {
                const devices = await navigator.mediaDevices.enumerateDevices();
                this.devices = devices.filter(device => device.kind === 'audioinput');
                this.createDeviceSelector();
                window.uiManager.updateSystemLog('Audio ierīču saraksts atjaunināts');
            });

        } catch (error) {
            console.error('Kļūda iegūstot audio ierīces:', error);
            window.uiManager.updateSystemLog('Kļūda iegūstot audio ierīces: ' + error.message);
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

            await navigator.mediaDevices.getUserMedia({
                audio: {
                    deviceId: {exact: deviceId}
                }
            });

            this.currentDevice = deviceId;
            window.uiManager.updateSystemLog('Audio ierīce nomainīta');

            if (this.isListening) {
                await this.startListening();
            }

        } catch (error) {
            console.error('Kļūda mainot audio ierīci:', error);
            window.uiManager.updateSystemLog('Kļūda mainot audio ierīci: ' + error.message);
        }
    }

    async startListening() {
        try {
            if (this.currentDevice) {
                await navigator.mediaDevices.getUserMedia({
                    audio: {
                        deviceId: {exact: this.currentDevice}
                    }
                });
            } else {
                await navigator.mediaDevices.getUserMedia({ audio: true });
            }

            if (!this.recognition) {
                this.setupSpeechRecognition();
            }
            
            this.isListening = true;
            document.querySelector('.mic-btn').classList.add('active');
            window.uiManager.updateStatusText('Klausos...');
            this.recognition.start();

        } catch (error) {
            console.error('Mikrofonam nav piekļuves:', error);
            window.uiManager.updateSystemLog(`Mikrofonam nav piekļuves: ${error.message}`);
        }
    }

    stopListening() {
        if (!this.recognition) return;
        
        this.isListening = false;
        document.querySelector('.mic-btn').classList.remove('active');
        window.uiManager.updateStatusText('Gaidīšanas režīmā');
        this.recognition.stop();
    }

    toggleListening() {
        if (this.isListening) {
            this.stopListening();
        } else {
            this.startListening();
        }
    }

    getIsListening() {
        return this.isListening;
    }
}

export const recognitionManager = new RecognitionManager();