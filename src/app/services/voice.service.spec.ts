import { TestBed } from '@angular/core/testing';

import { VoiceService } from './voice.service';

declare var global: any;

describe('VoiceService', () => {
  let service: VoiceService;
  const originalSpeechRecognition = global.SpeechRecognition;

  beforeEach(async() => {
    global.SpeechRecognition = originalSpeechRecognition;
  });

  afterEach(() => {
    global.SpeechRecognition = originalSpeechRecognition;
  })

  it('should be created when SpeechRecognition API is supported', () => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(VoiceService);    
    expect(service).toBeDefined();
  });

  it('should throw an error if SpeechRecognition is not supported', () => {
    global.SpeechRecognition = undefined;
    expect(() => TestBed.inject(VoiceService)).toThrowError('SpeechRecognition API not supported');
  });
});
