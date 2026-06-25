import { useState, useRef, useCallback } from 'react';
import { MoveHorizontal } from 'lucide-react';

const BEFORE_IMG = 'https://media.base44.com/images/public/6a15029471099b262af79afe/92a71f7a3_generated_image.png';
const AFTER_IMG = 'https://media.base44.com/images/public/6a15029471099b262af79afe/6269239c0_generated_image.png';

export default function BeforeAfterSlider() {
  const [pos, setPos] = useState(50);
  const containerRef = useRef(null);
  const dragging = useRef(false);

  const updateFromClientX = useCallback((clientX) => {
    const rect = containerRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const pct = Math.max(0, Math.min(100, (x / rect.width) * 100));
    setPos(pct);
  }, []);

  const onDown = (e) => {
    dragging.current = true;
    updateFromClientX(e.clientX || (e.touches && e.touches[0].clientX));
  };

  const onMove = (e) => {
    if (!dragging.current) return;
    updateFromClientX(e.clientX || (e.touches && e.touches[0].clientX));
  };

  const onUp = () => { dragging.current = false; };

  return (
    <section className="bg-white py-16 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h2 className="text-3xl md:text-4xl font-extrabold mb-2">
            <span className="text-gray-800">SEE THE </span>
            <span className="gradient-text">TRANSFORMATION</span>
          </h2>
          <p className="text-muted-foreground text-sm md:text-base">
            Drag the slider to see the difference our deep cleaning makes.
          </p>
        </div>

        <div
          ref={containerRef}
          className="relative w-full aspect-[16/10] rounded-2xl overflow-hidden shadow-xl select-none cursor-ew-resize"
          onMouseDown={onDown}
          onMouseMove={onMove}
          onMouseUp={onUp}
          onMouseLeave={onUp}
          onTouchStart={onDown}
          onTouchMove={onMove}
          onTouchEnd={onUp}
        >
          {/* AFTER (full) */}
          <img src={AFTER_IMG} alt="After wash" className="absolute inset-0 w-full h-full object-cover" draggable={false} />

          {/* BEFORE (clipped) */}
          <div className="absolute inset-0 overflow-hidden" style={{ width: `${pos}%` }}>
            <img
              src={BEFORE_IMG}
              alt="Before wash"
              className="absolute inset-0 h-full object-cover"
              style={{ width: containerRef.current ? `${containerRef.current.offsetWidth}px` : '100%' }}
              draggable={false}
            />
          </div>

          {/* Divider */}
          <div className="absolute top-0 bottom-0 w-1 shadow-md gradient-header" style={{ left: `${pos}%` }}>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-11 h-11 rounded-full gradient-header shadow-lg flex items-center justify-center ring-2 ring-white">
              <MoveHorizontal className="w-5 h-5 text-white" />
            </div>
          </div>

          {/* Labels */}
          <span className="absolute bottom-4 left-4 bg-gray-800/90 text-white text-xs font-semibold px-3 py-1.5 rounded-md">BEFORE</span>
          <span className="absolute bottom-4 right-4 gradient-header text-white text-xs font-semibold px-3 py-1.5 rounded-md">AFTER</span>
        </div>
      </div>
    </section>
  );
}