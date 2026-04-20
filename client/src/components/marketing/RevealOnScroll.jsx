import { useEffect, useRef, useState } from 'react';

function RevealOnScroll({
  as = 'div',
  children,
  className = '',
  delay = 0,
  threshold = 0.16,
  style,
  ...props
}) {
  const Component = as;
  const elementRef = useRef(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const element = elementRef.current;

    if (!element) {
      return undefined;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) {
          return;
        }

        setIsVisible(true);
        observer.unobserve(entry.target);
      },
      {
        threshold,
        rootMargin: '0px 0px -10% 0px',
      },
    );

    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, [threshold]);

  return (
    <Component
      {...props}
      ref={elementRef}
      className={`marketing-reveal ${className}`.trim()}
      data-visible={isVisible ? 'true' : 'false'}
      style={{
        ...style,
        '--reveal-delay': `${delay}ms`,
      }}
    >
      {children}
    </Component>
  );
}

export default RevealOnScroll;
