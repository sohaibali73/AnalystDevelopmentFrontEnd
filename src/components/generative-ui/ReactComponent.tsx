'use client'

import React from 'react';

export interface ReactComponentProps {
  children?: React.ReactNode;
  className?: string;
}

export function ReactComponent({ children, className = '' }: ReactComponentProps) {
  return (
    <div className={`react-component ${className}`}>
      {children}
    </div>
  );
}

export default ReactComponent;
