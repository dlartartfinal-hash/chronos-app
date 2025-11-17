
'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';
import { Input } from './input';

interface ColorPickerProps extends React.InputHTMLAttributes<HTMLInputElement> {
  color?: string;
  onColorChange?: (color: string) => void;
}

const ColorPicker = React.forwardRef<HTMLInputElement, ColorPickerProps>(
  ({ className, color, onColorChange, ...props }, ref) => {
    const [value, setValue] = React.useState(color || '#000000');

    React.useEffect(() => {
      if (color) {
        setValue(color);
      }
    }, [color]);

    const handleColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const newColor = e.target.value;
      setValue(newColor);
      onColorChange?.(newColor);
    };

    return (
      <div className="flex items-center gap-2">
        <div className="relative">
          <input
            type="color"
            value={value}
            onChange={handleColorChange}
            className="h-10 w-10 cursor-pointer appearance-none rounded-md border border-input bg-transparent p-0 [&::-webkit-color-swatch-wrapper]:p-0 [&::-webkit-color-swatch]:rounded-md [&::-webkit-color-swatch]:border-none"
            style={{ '--color': value } as React.CSSProperties}
          />
        </div>
        <Input
          ref={ref}
          type="text"
          value={value}
          onChange={handleColorChange}
          className={cn('h-10 w-28', className)}
          {...props}
        />
      </div>
    );
  }
);
ColorPicker.displayName = 'ColorPicker';

export { ColorPicker };
