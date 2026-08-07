import { useLayoutEffect, useRef, useState, type ReactNode } from 'react';

function MasonryItem({ children }: { children: ReactNode }) {
  const contentRef = useRef<HTMLDivElement>(null);
  const [rowSpan, setRowSpan] = useState(1);

  useLayoutEffect(() => {
    const content = contentRef.current;
    const grid = content?.parentElement?.parentElement;
    if (!content || !grid) return;
    const measuredContent = content;
    const masonryGrid = grid;

    function updateSpan() {
      const styles = getComputedStyle(masonryGrid);
      const rowHeight = Number.parseFloat(styles.gridAutoRows) || 8;
      const rowGap = Number.parseFloat(styles.rowGap) || 16;
      const nextSpan = Math.max(
        1,
        Math.ceil((measuredContent.getBoundingClientRect().height + rowGap) / (rowHeight + rowGap)),
      );
      setRowSpan((current) => current === nextSpan ? current : nextSpan);
    }

    updateSpan();
    if (typeof ResizeObserver === 'undefined') {
      window.addEventListener('resize', updateSpan);
      return () => window.removeEventListener('resize', updateSpan);
    }

    const observer = new ResizeObserver(updateSpan);
    observer.observe(measuredContent);
    return () => observer.disconnect();
  }, []);

  return (
    <div className="min-w-0" style={{ gridRowEnd: `span ${rowSpan}` }}>
      <div ref={contentRef}>{children}</div>
    </div>
  );
}

export default function SocialMasonryGrid({ children }: { children: ReactNode[] }) {
  return (
    <div
      className="grid auto-rows-[8px] grid-cols-2 grid-flow-row-dense gap-x-3 gap-y-4 sm:grid-cols-3 sm:gap-x-4 lg:grid-cols-4 xl:grid-cols-5"
      data-testid="community-masonry"
    >
      {children.map((child, index) => <MasonryItem key={index}>{child}</MasonryItem>)}
    </div>
  );
}
