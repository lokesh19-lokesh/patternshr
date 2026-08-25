import type { MeetingTranscriptItem } from './meeting.service';

export interface CaptionCallback {
  (text: string, isFinal: boolean, speaker: string): void;
}

export class LiveCaptionService {
  private recognition: any = null;
  private isListening: boolean = false;
  private currentSpeaker: string = 'You';
  private onCaptionUpdate: CaptionCallback;
  private transcripts: MeetingTranscriptItem[] = [];

  constructor(currentSpeaker: string, onCaptionUpdate: CaptionCallback) {
    this.currentSpeaker = currentSpeaker;
    this.onCaptionUpdate = onCaptionUpdate;

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      this.recognition = new SpeechRecognition();
      this.recognition.continuous = true;
      this.recognition.interimResults = true;
      this.recognition.lang = 'en-US';

      this.recognition.onresult = (event: any) => {
        let interimTranscript = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            const item: MeetingTranscriptItem = {
              speaker: this.currentSpeaker,
              time: timeStr,
              text: transcript.trim(),
            };
            this.transcripts.push(item);
            this.onCaptionUpdate(transcript.trim(), true, this.currentSpeaker);
          } else {
            interimTranscript += transcript;
            this.onCaptionUpdate(interimTranscript, false, this.currentSpeaker);
          }
        }
      };

      this.recognition.onerror = (event: any) => {
        console.warn('Speech recognition notice:', event.error);
      };

      this.recognition.onend = () => {
        if (this.isListening) {
          try {
            this.recognition.start();
          } catch (e) {
            // Already started or blocked
          }
        }
      };
    }
  }

  start(): boolean {
    if (!this.recognition) {
      return false;
    }
    if (!this.isListening) {
      try {
        this.isListening = true;
        this.recognition.start();
        return true;
      } catch (e) {
        console.warn('Could not start speech recognition', e);
        return false;
      }
    }
    return true;
  }

  isSupported(): boolean {
    return !!this.recognition;
  }

  stop() {
    if (this.recognition && this.isListening) {
      this.isListening = false;
      try {
        this.recognition.stop();
      } catch (e) {}
    }
  }

  getTranscripts(): MeetingTranscriptItem[] {
    return this.transcripts;
  }

  setSpeaker(name: string) {
    this.currentSpeaker = name;
  }
}
