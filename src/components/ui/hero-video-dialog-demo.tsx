import { HeroVideoDialog } from './hero-video-dialog';

export function HeroVideoDialogDemo() {
  return (
    <div style={{ position: 'relative', maxWidth: '720px', margin: '0 auto', padding: '24px' }}>
      <HeroVideoDialog
        className="block"
        animationStyle="from-center"
        videoSrc="https://www.youtube.com/embed/qh3NGpYRG3I?si=4rb-zSdDkVK9qxxb"
        thumbnailSrc="https://startup-template-sage.vercel.app/hero-light.png"
        thumbnailAlt="Hero Video Demo"
      />
    </div>
  );
}

export default HeroVideoDialogDemo;
