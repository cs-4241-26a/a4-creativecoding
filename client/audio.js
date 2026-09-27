import * as THREE from "/node_modules/three/build/three.module.js";


export class AudioManager {

    constructor(camera) {
        // adding audio  to the camera
        this.listener = new THREE.AudioListener();
        camera.add(this.listener);

        // to get rid of browsers not allowing autoplay so the user has to click first
        this.resumePlaying = this.resumeAudio.bind(this);

        // adding a listeber to the audio so I can grab teh audio and check it out
        this.sound = new THREE.Audio(this.listener);
        this.audioLoader = new THREE.AudioLoader();
        const self = this;


        // default audio is one of my friends recs which is from arknights
        self.audioLoader.load('./audio/test.mp3', (buffer) => {
            self.sound.setBuffer(buffer);
            self.sound.setLoop(true);
            self.sound.setVolume(0.5);
            self.sound.play();

            // Create analyser AFTER the buffer is loaded because stuff is cooked otherwise
            self.analyser = new THREE.AudioAnalyser(self.sound, 128);
        });
    }

    load(file) {
        // creating a temp url to store mp3
        const myUrl = URL.createObjectURL(file);
        this.audioLoader.load( myUrl, ( buffer ) => {
            if (this.sound.isPlaying) {
                this.sound.stop();
                this.sound.setBuffer(null);   // optional but clean
            }

            // sound settings which is to have a buffer that store music ahead of time and looping feature that the user cannot change cause lazy
            this.sound.setBuffer( buffer );
            this.sound.setLoop(true);
            this.sound.setVolume(0.5);
            // there is no play button so have it on autoplay
            this.sound.play();

            this.analyser = new THREE.AudioAnalyser(this.sound, 128);
        });
    }

    averageAudioSnippetRange(arr, start, end) {
        if (!arr || !arr.length) return 0; // literally nothing there return
        end = Math.min(end, arr.length);
        if (end <= start) return 0; // there is no length break

        let sum = 0;
        for (let i = start; i < end; i++) {
            const v = arr[i];
            if (Number.isFinite(v)) sum += v;
        }
        return sum / (end - start);
    }

    getAllBands() {
        if (!this.analyser) {
            return { bass: 0,mids: 0,highs: 0 };
        }

        // had a Nan issue with highs and had to implement this
        const data = this.analyser.getFrequencyData();
        if (!data || !data.length) {
            return { bass: 0,mids: 0,highs: 0 };
        }

        return {
            bass:this.averageAudioSnippetRange(data,0,16) / 255,
            mids:this.averageAudioSnippetRange(data,16,32) / 255,
            highs:this.averageAudioSnippetRange(data,32,128) / 255,
        };
    }

    resumeAudio() {
        // literally just plays the audio and allows for user interaction because cannot autoplay due to browser restriction
        const ctx = this.listener.context;
        if (ctx.state === 'suspended') {
            ctx.resume().then(() => console.log('AudioContext resumed'));
        }
        document.removeEventListener('click', this.resumePlaying);
        document.removeEventListener('keydown', this.resumePlaying);
        document.removeEventListener('touchstart', this.resumePlaying);
    }

    changeSoundVolume(volume) {
        this.sound.setVolume(volume);
    }
}
