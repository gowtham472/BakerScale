import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class VoiceService {
  private recognition: any;
  private isListening: boolean = false;

  constructor() {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      console.error('🚨 Speech Recognition API is not supported in this browser.');
      return;
    }

    this.recognition = new SpeechRecognition();
    this.recognition.continuous = true; // Keep recording until stopped
    this.recognition.interimResults = false;
    this.recognition.lang = 'en-US';
  }

  /** 🔥 Request Microphone Permission */
  async requestMicPermission(): Promise<boolean> {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach(track => track.stop()); // ✅ Release mic after testing
      return true;
    } catch (error) {
      console.error('❌ Microphone Permission Denied:', error);
      return false;
    }
  }

  /** 🔥 Start Voice Recognition (Only If Mic Permission is Granted) */
  async startListening(callback: (transcript: string) => void) {
    if (!this.recognition || this.isListening) return;

    const permissionGranted = await this.requestMicPermission();
    if (!permissionGranted) {
      alert('Microphone access is required for voice input.');
      return; // ❌ Do NOT start listening
    }

    this.isListening = true;
    console.log('🎤 Listening...');

    this.recognition.onresult = (event: any) => {
      const transcript = event.results[event.results.length - 1][0].transcript;
      console.log('📝 Recognized Text:', transcript);
      callback(transcript);
    };

    this.recognition.onerror = (event: any) => {
      console.error('❌ Speech Recognition Error:', event.error);
    };

    this.recognition.onend = () => {
      console.log('🛑 Speech Recognition Stopped');
      if (this.isListening) {
        this.recognition.start(); // ✅ Restart if still listening
      }
    };

    this.recognition.start();
  }

  /** Stop Voice Recognition */
  stopListening() {
    if (this.recognition && this.isListening) {
      this.isListening = false;
      this.recognition.stop();
      console.log('🛑 Stopped Listening');
    }
  }
}
