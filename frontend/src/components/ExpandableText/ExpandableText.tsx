import { Button, Outline, P, useDialog } from "@maykin-ui/admin-ui";
import React, { useEffect, useRef, useState } from "react";

import "./ExpandableText.styles.css";

type ExpandableTextProps = {
  text: string;
  fieldName: string;
};

export const ExpandableText: React.FC<ExpandableTextProps> = ({
  text,
  fieldName,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isOverflowing, setIsOverflowing] = useState(false);
  const dialog = useDialog();

  useEffect(() => {
    const checkOverflow = () => {
      if (containerRef.current) {
        setIsOverflowing(
          containerRef.current.scrollWidth > containerRef.current.clientWidth,
        );
      }
    };

    const resizeObserver = new ResizeObserver(() => {
      checkOverflow();
    });

    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    checkOverflow();

    return () => {
      if (containerRef.current) {
        resizeObserver.unobserve(containerRef.current);
      }
    };
  }, []);

  return (
    <div className="expandable-text">
      <P
        ref={containerRef}
        className={`expandable-text__p ${isOverflowing ? "expandable-text__p--overflowing" : ""}`}
      >
        {text}
      </P>
      {isOverflowing && (
        <Button
          name={fieldName}
          className="expandable-text__button"
          variant="transparent"
          aria-label={fieldName}
          onClick={() => dialog(fieldName, text)}
        >
          <Outline.ChatBubbleLeftEllipsisIcon />
        </Button>
      )}
    </div>
  );
};
