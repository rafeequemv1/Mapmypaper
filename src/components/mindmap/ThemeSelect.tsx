
import { Palette } from "lucide-react";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export const mindMapThemes = {
  gray: {
    background: '#f5f5f5',
    color: '#333',
    name: 'Gray (Default)'
  },
  blue: {
    background: '#e6f7ff',
    color: '#0066cc',
    name: 'Blue Ocean'
  },
  green: {
    background: '#f0f9eb',
    color: '#67c23a',
    name: 'Green Forest'
  },
  purple: {
    background: '#f5f0ff',
    color: '#8B5CF6',
    name: 'Purple Haze'
  },
  orange: {
    background: '#fff7e6',
    color: '#f97316',
    name: 'Orange Sunset'
  },
  soft: {
    background: '#f8f9fa',
    color: '#9d7ad2',
    name: 'Soft Pastels',
    nodeColors: {
      root: '#9d7ad2', // Purple center
      branch1: '#ffdfd3', // Peach/orange nodes
      branch2: '#d0f0e4', // Mint green nodes 
      branch3: '#e5d9ff', // Lavender nodes
    }
  }
};

export type MindMapTheme = keyof typeof mindMapThemes;

interface ThemeSelectProps {
  value: MindMapTheme;
  onValueChange: (theme: MindMapTheme) => void;
}

const ThemeSelect = ({ value, onValueChange }: ThemeSelectProps) => {
  return (
    <Select 
      value={value} 
      onValueChange={(value: MindMapTheme) => onValueChange(value)}
    >
      <SelectTrigger className="w-[180px] bg-transparent hover:bg-white/20 text-white border border-white/30 rounded-md px-4 py-1 h-auto">
        <Palette className="h-4 w-4 mr-2" />
        <SelectValue placeholder="Select Theme" />
      </SelectTrigger>
      <SelectContent>
        {Object.entries(mindMapThemes).map(([key, theme]) => (
          <SelectItem 
            key={key} 
            value={key}
            className="flex items-center"
          >
            <div 
              className="w-4 h-4 rounded-full mr-2 inline-block" 
              style={{ backgroundColor: theme.color }}
            />
            {theme.name}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
};

export default ThemeSelect;
