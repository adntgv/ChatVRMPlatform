import { splitSentence, textsToScreenplay, Talk, Screenplay } from '@/features/messages/messages';
import { KoeiroParam } from '@/features/constants/koeiroParam';

describe('messages', () => {
  describe('splitSentence', () => {
    it('should split text by Japanese period', () => {
      const text = 'こんにちは。元気ですか。';
      const result = splitSentence(text);
      expect(result).toEqual(['こんにちは。', '元気ですか。']);
    });

    it('should split text by full-width period', () => {
      const text = 'Hello．How are you．';
      const result = splitSentence(text);
      expect(result).toEqual(['Hello．', 'How are you．']);
    });

    it('should split text by exclamation mark', () => {
      const text = 'すごい！本当に！';
      const result = splitSentence(text);
      expect(result).toEqual(['すごい！', '本当に！']);
    });

    it('should split text by question mark', () => {
      const text = '本当ですか？どうして？';
      const result = splitSentence(text);
      expect(result).toEqual(['本当ですか？', 'どうして？']);
    });

    it('should split text by newline', () => {
      const text = 'First line\nSecond line\nThird line';
      const result = splitSentence(text);
      expect(result).toEqual(['First line\n', 'Second line\n', 'Third line']);
    });

    it('should handle mixed punctuation', () => {
      const text = 'こんにちは。How are you？いいね！Really.\n新しい行';
      const result = splitSentence(text);
      expect(result).toEqual(['こんにちは。', 'How are you？', 'いいね！', 'Really.\n', '新しい行']);
    });

    it('should handle consecutive punctuation', () => {
      const text = 'Hello。。。World！';
      const result = splitSentence(text);
      expect(result).toEqual(['Hello。', '。', '。', 'World！']);
    });

    it('should return empty array for empty text', () => {
      const result = splitSentence('');
      expect(result).toEqual([]);
    });
  });

  describe('textsToScreenplay', () => {
    const mockKoeiroParam: KoeiroParam = {
      speakerX: 1.0,
      speakerY: 0.5,
    };

    it('should convert simple text without emotion tags', () => {
      const texts = ['Hello world'];
      const result = textsToScreenplay(texts, mockKoeiroParam);
      
      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        expression: 'neutral',
        talk: {
          style: 'talk',
          speakerX: 1.0,
          speakerY: 0.5,
          message: 'Hello world',
        },
      });
    });

    it('should parse happy emotion tag', () => {
      const texts = ['[happy]I am so happy!'];
      const result = textsToScreenplay(texts, mockKoeiroParam);
      
      expect(result[0].expression).toBe('happy');
      expect(result[0].talk.style).toBe('happy');
      expect(result[0].talk.message).toBe('I am so happy!');
    });

    it('should parse angry emotion tag', () => {
      const texts = ['[angry]This is unacceptable!'];
      const result = textsToScreenplay(texts, mockKoeiroParam);
      
      expect(result[0].expression).toBe('angry');
      expect(result[0].talk.style).toBe('angry');
      expect(result[0].talk.message).toBe('This is unacceptable!');
    });

    it('should parse sad emotion tag', () => {
      const texts = ['[sad]I feel so sad...'];
      const result = textsToScreenplay(texts, mockKoeiroParam);
      
      expect(result[0].expression).toBe('sad');
      expect(result[0].talk.style).toBe('sad');
      expect(result[0].talk.message).toBe('I feel so sad...');
    });

    it('should parse relaxed emotion tag', () => {
      const texts = ['[relaxed]Everything is peaceful'];
      const result = textsToScreenplay(texts, mockKoeiroParam);
      
      expect(result[0].expression).toBe('relaxed');
      expect(result[0].talk.style).toBe('talk'); // relaxed maps to talk style
      expect(result[0].talk.message).toBe('Everything is peaceful');
    });

    it('should maintain emotion across multiple texts', () => {
      const texts = ['[happy]First sentence.', 'Second sentence.', 'Third sentence.'];
      const result = textsToScreenplay(texts, mockKoeiroParam);
      
      expect(result).toHaveLength(3);
      expect(result[0].expression).toBe('happy');
      expect(result[1].expression).toBe('happy'); // Maintains previous emotion
      expect(result[2].expression).toBe('happy'); // Still maintains
    });

    it('should change emotion when new tag appears', () => {
      const texts = ['[happy]Happy text.', '[sad]Sad text.', 'Still sad.'];
      const result = textsToScreenplay(texts, mockKoeiroParam);
      
      expect(result[0].expression).toBe('happy');
      expect(result[1].expression).toBe('sad');
      expect(result[2].expression).toBe('sad'); // Maintains sad
    });

    it('should ignore invalid emotion tags', () => {
      const texts = ['[invalid]Some text', '[happy]Happy now'];
      const result = textsToScreenplay(texts, mockKoeiroParam);
      
      expect(result[0].expression).toBe('neutral'); // Falls back to neutral
      expect(result[0].talk.message).toBe('Some text'); // Tag is still removed
      expect(result[1].expression).toBe('happy');
    });

    it('should handle multiple emotion tags in one text', () => {
      const texts = ['[happy]Happy [sad]text here'];
      const result = textsToScreenplay(texts, mockKoeiroParam);
      
      // Only the first tag is used, all tags are removed from message
      expect(result[0].expression).toBe('happy');
      expect(result[0].talk.message).toBe('Happy text here');
    });

    it('should handle empty texts array', () => {
      const result = textsToScreenplay([], mockKoeiroParam);
      expect(result).toEqual([]);
    });

    it('should handle texts with only emotion tags', () => {
      const texts = ['[happy]', '[sad]'];
      const result = textsToScreenplay(texts, mockKoeiroParam);
      
      expect(result).toHaveLength(2);
      expect(result[0].expression).toBe('happy');
      expect(result[0].talk.message).toBe('');
      expect(result[1].expression).toBe('sad');
      expect(result[1].talk.message).toBe('');
    });
  });
});