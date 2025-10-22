
import React from 'react';

interface CustomToggleGroupProps {
  value: string;
  onValueChange: (value: string) => void;
  className?: string;
  children: React.ReactNode;
  id?: string;
  type?: 'single';
}

interface CustomToggleItemProps {
  value: string;
  children: React.ReactNode;
  className?: string;
  'aria-label'?: string;
}

const CustomToggleGroupContext = React.createContext<{
  value: string;
  onValueChange: (value: string) => void;
} | null>(null);

export const CustomToggleGroup: React.FC<CustomToggleGroupProps> = ({
  value,
  onValueChange,
  className,
  children,
  id,
  ...props
}) => {
  const containerStyle: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '4px',
    borderRadius: '6px',
    border: '1px solid #d1d5db',
    backgroundColor: '#ffffff',
    padding: '4px',
    fontFamily: 'inherit',
    fontSize: '14px',
    fontWeight: '500',
  };

  return (
    <CustomToggleGroupContext.Provider value={{ value, onValueChange }}>
      <div
        id={id}
        role="radiogroup"
        style={containerStyle}
        {...props}
      >
        {children}
      </div>
    </CustomToggleGroupContext.Provider>
  );
};

export const CustomToggleItem: React.FC<CustomToggleItemProps> = ({
  value,
  children,
  className,
  'aria-label': ariaLabel,
  ...props
}) => {
  const context = React.useContext(CustomToggleGroupContext);
  
  if (!context) {
    throw new Error('CustomToggleItem must be used within CustomToggleGroup');
  }

  const { value: selectedValue, onValueChange } = context;
  const isSelected = selectedValue === value;

  const [isHovered, setIsHovered] = React.useState(false);
  const [isFocused, setIsFocused] = React.useState(false);

  const handleClick = () => {
    onValueChange(value);
  };

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      onValueChange(value);
    }
  };

  const getBackgroundColor = () => {
    if (isSelected) {
      return isHovered ? '#2563eb' : '#3b82f6';
    }
    return isHovered ? '#f3f4f6' : 'transparent';
  };

  const getTextColor = () => {
    return isSelected ? '#ffffff' : '#111827';
  };

  const getFontWeight = () => {
    return isSelected ? '700' : '600';
  };

  const buttonStyle: React.CSSProperties = {
    // Reset all inherited styles
    all: 'unset',
    
    // Layout and positioning
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxSizing: 'border-box',
    
    // Size and spacing
    paddingLeft: '16px',
    paddingRight: '16px',
    paddingTop: '8px',
    paddingBottom: '8px',
    minWidth: '64px',
    height: '36px',
    
    // Typography
    fontSize: '16px',
    fontWeight: getFontWeight(),
    fontFamily: 'inherit',
    lineHeight: '1.5',
    textAlign: 'center',
    whiteSpace: 'nowrap',
    
    // Colors
    color: getTextColor(),
    backgroundColor: getBackgroundColor(),
    
    // Border and radius
    borderRadius: '4px',
    border: 'none',
    outline: 'none',
    
    // Transitions
    transition: 'all 150ms ease-in-out',
    
    // Cursor and interaction
    cursor: 'pointer',
    userSelect: 'none',
    
    // Focus ring
    boxShadow: isFocused ? '0 0 0 2px #3b82f6, 0 0 0 4px rgba(59, 130, 246, 0.1)' : 'none',
    
    // Active state
    transform: 'scale(1)',
  };

  const activeStyle: React.CSSProperties = {
    ...buttonStyle,
    transform: 'scale(0.95)',
  };

  return (
    <button
      type="button"
      role="radio"
      aria-checked={isSelected}
      aria-label={ariaLabel}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onFocus={() => setIsFocused(true)}
      onBlur={() => setIsFocused(false)}
      onMouseDown={(e) => {
        e.currentTarget.style.transform = 'scale(0.95)';
      }}
      onMouseUp={(e) => {
        e.currentTarget.style.transform = 'scale(1)';
      }}
      style={buttonStyle}
      {...props}
    >
      {children}
    </button>
  );
};
