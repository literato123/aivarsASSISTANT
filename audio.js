// audio.js

class AudioManager {
    constructor() {
        this.currentKadril = null;
        this.mainAudio = document.getElementById('mainAudio');
        this.mainVideo = document.getElementById('mainVideo');
        
        // Definējam vadības komandas
        this.controlCommands = {
            stop: ['stop', 'apstāties', 'beidz', 'beigt', 'pietiek', 'pārtrauc'],
            pause: ['pauze', 'pauzt', 'nopauzē', 'nopauzēt', 'pagaidi'],
            resume: ['turpini', 'turpināt', 'atsākt', 'atsāc']
        };
        
        // Definējam wake word audio atbildes
        this.wakeWords = {
            'ada': 'MUSIC/voice_responses/greetings/sei.mp3',
            'adi': 'AUDIO/responses/adi_response.mp3',
            'adelaida': 'MUSIC/voice_responses/greetings/palidze.mp3'
        };

        // Definējam deju struktūru
        this.kadrils = {
            'rusiņš': {
                name: 'Atskaņoju rusiņu',
                fragments: {
                    'sākums': 'MUSIC/kadrilas/ada/parts/sakums.mp3',
                    'vidus': 'MUSIC/kadrilas/ada/parts/vidus.mp3',
                    'beigas': 'MUSIC/kadrilas/ada/parts/beigas.mp3',
                    'pilnā': 'MUSIC/kadrilas/rusins/rusinsfull.mp3',
                    'video': 'VIDEO/kadrilas/rusins/rusins.mp4'
                },
                keywords: ['rusiņš', 'rusiņu', 'russu']
            },
            
            'padespaņs': {
                name: 'Atskaņoju...',
                fragments: {
                    'sākums': 'MUSIC/kadrilas/adi/parts/sakums.mp3',
                    'vidus': 'MUSIC/kadrilas/adi/parts/vidus.mp3', 
                    'beigas': 'MUSIC/kadrilas/adi/parts/beigas.mp3',
                    'pilnā': 'MUSIC/kadrilas/padespans/Padespaanfull.mp3',
                    'video': 'VIDEO/kadrilas/padespans/padespans.mp4'
                },
                keywords: ['padespaņs', 'spainis', 'bada spains']
            },
            'narečenka': {
                name: 'Atskaņoju narečenku!',
                fragments: {
                    'sākums': 'MUSIC/kadrilas/adelaida/parts/sakums.mp3',
                    'vidus': 'MUSIC/kadrilas/adelaida/parts/vidus.mp3',
                    'beigas': 'MUSIC/kadrilas/adelaida/parts/beigas.mp3',
                    'pilnā': 'MUSIC/kadrilas/narechenka/Narechenka - a folk dance..mp3',
                    'video': 'VIDEO/kadrilas/narecenka/narecenka.mp4'
                },
                keywords: ['narečenku', 'uz upi', 'uz upīti']
            },
            'bērzgali': {
                name: 'Bērzgales kadriļa',
                fragments: {
                    'pirmais gabals': 'MUSIC/kadrilas/Berzgale/parts/pirmais.mp3',
                    'otrais gabals': 'MUSIC/kadrilas/Berzgale/parts/otrais.mp3',
                    'trešais gabals': 'MUSIC/kadrilas/Berzgale/parts/trešais.mp3',
                    'ceturtais gabals': 'MUSIC/kadrilas/Berzgale/parts/ceturtais.mp3',
                    'piektais gabals': 'MUSIC/kadrilas/Berzgale/parts/piektais.mp3',
                    'sestais gabals': 'MUSIC/kadrilas/Berzgale/parts/sestais.mp3',
                    'pilnā': 'MUSIC/kadrilas/Berzgale/berzgalefull.mp3',
                    'video': 'VIDEO/kadrilas/berzgale/berzgale.mp4'
                },
                keywords: ['bērzgale', 'bērzgali', 'bērzgales']
            },
            'berlins': {
                name: 'Brambergas Berliņš',
                fragments: {
                    'dārziņš': 'MUSIC/kadrilas/berlins/parts/darzins.mp3',
                    'sākums': 'MUSIC/kadrilas/berlins/parts/sakums.mp3',
                    'vidus': 'MUSIC/kadrilas/berlins/parts/vidus.mp3',
                    'otra puse': 'MUSIC/kadrilas/berlins/parts/otra_puse.mp3',
                    'beigas': 'MUSIC/kadrilas/berlins/parts/beigas.mp3',
                    'pilnā': 'MUSIC/kadrilas/berlins/berlinsfull.mp3',
                    'video': 'VIDEO/kadrilas/berlins/berlins.mp4'
                },
                keywords: ['berliņš', 'berliņu', 'berliņa', 'brambergas']
            },
            'kvadrats': {
                name: 'kvadrāts', 
                fragments: {
                    'dārziņš': 'MUSIC/kadrilas/berlins/parts/darzins.mp3',
                    'sākums': 'MUSIC/kadrilas/berlins/parts/sakums.mp3',
                    'vidus': 'MUSIC/kadrilas/berlins/parts/vidus.mp3',
                    'otra puse': 'MUSIC/kadrilas/berlins/parts/otra_puse.mp3',
                    'beigas': 'MUSIC/kadrilas/berlins/parts/beigas.mp3',
                    'pilnā': 'MUSIC/kadrilas/kvadrats/kvadrat_full.mp3',
                    'video': 'VIDEO/kadrilas/kvadrats/kvadrats.mp4'
                },
                keywords: ['kvadrāts', 'kvadrātu', 'karēļu kvadrātu', 'karēļu kvadrāts']
            },
            'ciganovskis': {
                name: 'ciganovskis',
                fragments: {
                    'dārziņš': 'MUSIC/kadrilas/berlins/parts/darzins.mp3',
                    'sākums': 'MUSIC/kadrilas/berlins/parts/sakums.mp3',
                    'vidus': 'MUSIC/kadrilas/berlins/parts/vidus.mp3',
                    'otra puse': 'MUSIC/kadrilas/berlins/parts/otra_puse.mp3',
                    'beigas': 'MUSIC/kadrilas/berlins/parts/beigas.mp3',
                    'pilnā': 'MUSIC/kadrilas/ciganovskis/Ciganovskisfull.mp3',
                    'video': 'VIDEO/kadrilas/berlins/berlins.mp4'
                },
                keywords: ['ciganovskis', 'ciganovski', 'cigi']
            },
            'rikava': {
                name: 'rikava',
                fragments: {
                    'dārziņš': 'MUSIC/kadrilas/berlins/parts/darzins.mp3',
                    'sākums': 'MUSIC/kadrilas/berlins/parts/sakums.mp3',
                    'vidus': 'MUSIC/kadrilas/berlins/parts/vidus.mp3',
                    'otra puse': 'MUSIC/kadrilas/berlins/parts/otra_puse.mp3',
                    'beigas': 'MUSIC/kadrilas/berlins/parts/beigas.mp3',
                    'pilnā': 'MUSIC/kadrilas/ciganovskis/rikavafull.mp3',
                    'video': 'VIDEO/kadrilas/berlins/berlins.mp4'
                },
                keywords: ['rikavu', 'rikava', 'rika']
            },
            'sarkano': {
                name: 'sarkanbaltsarkanais',
                fragments: {
                    'dārziņš': 'MUSIC/kadrilas/berlins/parts/darzins.mp3',
                    'sākums': 'MUSIC/kadrilas/berlins/parts/sakums.mp3',
                    'vidus': 'MUSIC/kadrilas/berlins/parts/vidus.mp3',
                    'otra puse': 'MUSIC/kadrilas/berlins/parts/otra_puse.mp3',
                    'beigas': 'MUSIC/kadrilas/berlins/parts/beigas.mp3',
                    'pilnā': 'MUSIC/sarkanaisfull.mp3',
                    'video': 'VIDEO/kadrilas/berlins/berlins.mp4'
                },
                keywords: ['sarkanais', 'sarkano', 'baltais']
            },
            'žīga': {
                name: 'family jig',
                fragments: {
                    'dārziņš': 'MUSIC/kadrilas/berlins/parts/darzins.mp3',
                    'sākums': 'MUSIC/kadrilas/berlins/parts/sakums.mp3',
                    'vidus': 'MUSIC/kadrilas/berlins/parts/vidus.mp3',
                    'otra puse': 'MUSIC/kadrilas/berlins/parts/otra_puse.mp3',
                    'beigas': 'MUSIC/kadrilas/berlins/parts/beigas.mp3',
                    'pilnā': 'MUSIC/kadrilas/family_jig/Family Jig.mp3',
                    'video': 'VIDEO/kadrilas/berlins/family_jig/Family Jig.mp4'
                },
                keywords: ['family jig', 'džīga', 'žīga', 'brambergas']
            },
            
        };
        
    }

    handleCommand(command) {
        command = command.toLowerCase().trim();

        // Pārbaudam wake words un atskaņojam atbildes
        if (Object.keys(this.wakeWords).includes(command)) {
            this.playFragment(this.wakeWords[command]);
            return null;
        }
        
        // Pārbaudam vadības komandas
        if (this.controlCommands.stop.some(cmd => command.includes(cmd))) {
            this.stopPlayback();
            return 'Apturēju atskaņošanu';
        }

        if (this.controlCommands.pause.some(cmd => command.includes(cmd))) {
            this.pausePlayback();
            return 'Nopauzēju atskaņošanu';
        }

        if (this.controlCommands.resume.some(cmd => command.includes(cmd))) {
            this.resumePlayback();
            return 'Turpinu atskaņošanu';
        }

        // Vispirms pārbaudam, vai tiek mainīta deja
        for (const [kadrilKey, kadril] of Object.entries(this.kadrils)) {
            if (kadril.keywords.some(keyword => command.includes(keyword))) {
                this.currentKadril = kadrilKey;
                
                // Pārbaudam vai prasīts video
                if (command.includes('video')) {
                    this.playVideo(kadril.fragments.video);
                    return `Rādu ${kadril.name} video`;
                }
                
                // Ja pieminēta pilnā deja
                if (command.includes('pilno') || command.includes('visu')) {
                    this.playFragment(kadril.fragments.pilnā);
                    return `Atskaņoju ${kadril.name} pilnībā`;
                }

                // Meklējam fragmentu
                for (const [fragmentKey, fragmentPath] of Object.entries(kadril.fragments)) {
                    if (command.includes(fragmentKey) && fragmentKey !== 'video') {
                        this.playFragment(fragmentPath);
                        return `Atskaņoju ${kadril.name} - ${fragmentKey}`;
                    }
                }

                // Ja fragments nav norādīts, atskaņojam pilno
                this.playFragment(kadril.fragments.pilnā);
                return `Atskaņoju ${kadril.name}`;
            }
        }

        // Ja ir aktīva deja, meklējam tikai fragmentu
        if (this.currentKadril) {
            const currentKadrilData = this.kadrils[this.currentKadril];
            for (const [fragmentKey, fragmentPath] of Object.entries(currentKadrilData.fragments)) {
                if (command.includes(fragmentKey) && fragmentKey !== 'video') {
                    this.playFragment(fragmentPath);
                    return `Atskaņoju ${currentKadrilData.name} - ${fragmentKey}`;
                }
            }
        }

        return null;
    }

    async playFragment(fragmentPath) {
        try {
            this.mainAudio.src = fragmentPath;
            await this.mainAudio.load();
            await this.mainAudio.play();
            window.uiManager.updateSystemLog(`Atskaņoju: ${fragmentPath}`);
        } catch (error) {
            console.error('Kļūda atskaņojot:', error);
            window.uiManager.updateSystemLog(`Kļūda atskaņojot: ${error.message}`);
        }
    }

    async playVideo(videoPath) {
        try {
            this.mainVideo.src = videoPath;
            await this.mainVideo.load();
            await this.mainVideo.play();
            window.uiManager.updateSystemLog(`Rādu video: ${videoPath}`);
        } catch (error) {
            console.error('Kļūda rādot video:', error);
            window.uiManager.updateSystemLog(`Kļūda rādot video: ${error.message}`);
        }
    }

    stopPlayback() {
        if (this.mainAudio) {
            this.mainAudio.pause();
            this.mainAudio.currentTime = 0;
            window.uiManager.updateSystemLog('Atskaņošana apturēta');
        }
        if (this.mainVideo) {
            this.mainVideo.pause();
            this.mainVideo.currentTime = 0;
            window.uiManager.updateSystemLog('Video apturēts');
        }
    }

    pausePlayback() {
        if (this.mainAudio) {
            this.mainAudio.pause();
            window.uiManager.updateSystemLog('Atskaņošana nopauzēta');
        }
        if (this.mainVideo) {
            this.mainVideo.pause();
            window.uiManager.updateSystemLog('Video nopauzēts');
        }
    }

    resumePlayback() {
        if (this.mainAudio) {
            this.mainAudio.play()
                .then(() => window.uiManager.updateSystemLog('Atskaņošana turpināta'))
                .catch(error => window.uiManager.updateSystemLog(`Kļūda turpinot: ${error.message}`));
        }
        if (this.mainVideo) {
            this.mainVideo.play()
                .then(() => window.uiManager.updateSystemLog('Video turpināts'))
                .catch(error => window.uiManager.updateSystemLog(`Kļūda turpinot video: ${error.message}`));
        }
    }
}

export const audioManager = new AudioManager();