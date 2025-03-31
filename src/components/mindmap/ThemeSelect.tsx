
import { Palette } from "lucide-react";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export const mindMapThemes = {
  green: {
    background: '#F2FCE2', 
    color: '#67c23a',
    name: 'Soft Green'
  },
  blue: {
    background: '#E5F4FF',
    color: '#0078D7',
    name: 'Sky Blue'
  },
  purple: {
    background: '#E5DEFF',
    color: '#8B5CF6',
    name: 'Lavender'
  },
  peach: {
    background: '#FDE1D3',
    color: '#F97316',
    name: 'Soft Peach'
  },
  pink: {
    background: '#FFDEE2',
    color: '#EC4899',
    name: 'Rose'
  },
  yellow: {
    background: '#FEF7CD',
    color: '#EAB308',
    name: 'Soft Yellow'
  },
  mint: {
    background: '#DCFCE7',
    color: '#16A34A',
    name: 'Fresh Mint'
  },
  coral: {
    background: '#FFE4E0',
    color: '#F43F5E',
    name: 'Coral'
  },
  aqua: {
    background: '#CFFAFE',
    color: '#06B6D4',
    name: 'Aqua'
  },
  lilac: {
    background: '#F3E8FF',
    color: '#A855F7',
    name: 'Lilac'
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
