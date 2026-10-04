import { TextAnimate } from './text-animate';

export function TextAnimateDemo() {
  return (
    <div style={{ display: 'flex', minHeight: '16rem', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
      <TextAnimate animation="blurInUp" by="character" once>
        Blur in by character
      </TextAnimate>
    </div>
  );
}

export default TextAnimateDemo;
