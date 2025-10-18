import { isValidShortVideoUrl, isInstagramReel, isYouTubeShorts, extractYouTubeShortsId } from '../../services/video-platform';

// Note: This test file covers the new shortVideoUrl functionality
// The deprecated instagramReelUrl field is still supported for backward compatibility

describe('Video Platform Service', () => {
  describe('isValidShortVideoUrl', () => {
    it('should validate Instagram Reel URLs', () => {
      const validUrls = [
        'https://www.instagram.com/reel/ABC123/',
        'https://instagram.com/reels/XYZ789/',
        'https://www.instagram.com/p/DEF456/',
      ];
      
      validUrls.forEach(url => {
        expect(isValidShortVideoUrl(url)).toBe(true);
      });
    });

    it('should validate YouTube Shorts URLs', () => {
      const validUrls = [
        'https://www.youtube.com/shorts/ABC123DEF456',
        'https://youtube.com/shorts/XYZ789GHI012',
        'https://youtu.be/ABC123DEF456',
      ];
      
      validUrls.forEach(url => {
        expect(isValidShortVideoUrl(url)).toBe(true);
      });
    });

    it('should reject invalid URLs', () => {
      const invalidUrls = [
        'https://www.youtube.com/watch?v=ABC123',
        'https://www.instagram.com/stories/user/123/',
        'https://example.com/video.mp4',
        'not-a-url',
      ];
      
      invalidUrls.forEach(url => {
        expect(isValidShortVideoUrl(url)).toBe(false);
      });
    });
  });

  describe('isInstagramReel', () => {
    it('should identify Instagram Reel URLs', () => {
      const instagramUrls = [
        'https://www.instagram.com/reel/ABC123/',
        'https://instagram.com/reels/XYZ789/',
        'https://www.instagram.com/p/DEF456/',
      ];
      
      instagramUrls.forEach(url => {
        expect(isInstagramReel(url)).toBe(true);
      });
    });

    it('should not identify YouTube Shorts as Instagram', () => {
      const youtubeUrls = [
        'https://www.youtube.com/shorts/ABC123DEF456',
        'https://youtu.be/ABC123DEF456',
      ];
      
      youtubeUrls.forEach(url => {
        expect(isInstagramReel(url)).toBe(false);
      });
    });
  });

  describe('isYouTubeShorts', () => {
    it('should identify YouTube Shorts URLs', () => {
      const youtubeUrls = [
        'https://www.youtube.com/shorts/ABC123DEF456',
        'https://youtube.com/shorts/XYZ789GHI012',
        'https://youtu.be/ABC123DEF456',
      ];
      
      youtubeUrls.forEach(url => {
        expect(isYouTubeShorts(url)).toBe(true);
      });
    });

    it('should not identify Instagram Reels as YouTube Shorts', () => {
      const instagramUrls = [
        'https://www.instagram.com/reel/ABC123/',
        'https://instagram.com/reels/XYZ789/',
      ];
      
      instagramUrls.forEach(url => {
        expect(isYouTubeShorts(url)).toBe(false);
      });
    });
  });

  describe('extractYouTubeShortsId', () => {
    it('should extract video ID from YouTube Shorts URLs', () => {
      const testCases = [
        { url: 'https://www.youtube.com/shorts/ABC123DEF456', expected: 'ABC123DEF456' },
        { url: 'https://youtube.com/shorts/XYZ789GHI012', expected: 'XYZ789GHI012' },
        { url: 'https://youtu.be/ABC123DEF456', expected: 'ABC123DEF456' },
      ];
      
      testCases.forEach(({ url, expected }) => {
        expect(extractYouTubeShortsId(url)).toBe(expected);
      });
    });

    it('should return null for non-YouTube URLs', () => {
      const nonYoutubeUrls = [
        'https://www.instagram.com/reel/ABC123/',
        'https://example.com/video.mp4',
        'not-a-url',
      ];
      
      nonYoutubeUrls.forEach(url => {
        expect(extractYouTubeShortsId(url)).toBeNull();
      });
    });
  });
});
