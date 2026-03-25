import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { ChevronLeft, ChevronRight, Check, Shuffle } from 'lucide-react';

const DICEBEAR_STYLES = [
  { id: 'fun-emoji', label: '🐾 Animais', fixedSeeds: [
    'vaca', 'capivara', 'gato', 'cachorro', 'leao', 'tigre',
    'urso', 'raposa', 'lobo', 'aguia', 'coruja', 'panda',
    'macaco', 'coelho', 'elefante', 'girafa', 'tubarao', 'baleia',
    'cobra', 'jacare', 'tartaruga', 'pinguim', 'flamingo', 'papagaio',
  ]},
  { id: 'adventurer', label: 'Aventureiro' },
  { id: 'adventurer-neutral', label: 'Neutro' },
  { id: 'avataaars', label: 'Avataaars' },
  { id: 'big-ears', label: 'Orelhas' },
  { id: 'big-ears-neutral', label: 'Orelhas Neutro' },
  { id: 'bottts', label: 'Robôs' },
  { id: 'croodles', label: 'Croodles' },
  { id: 'croodles-neutral', label: 'Croodles Neutro' },
  { id: 'fun-emoji', label: 'Emoji' },
  { id: 'lorelei', label: 'Lorelei' },
  { id: 'lorelei-neutral', label: 'Lorelei Neutro' },
  { id: 'micah', label: 'Micah' },
  { id: 'miniavs', label: 'Miniavs' },
  { id: 'notionists', label: 'Notionists' },
  { id: 'notionists-neutral', label: 'Notionists Neutro' },
  { id: 'open-peeps', label: 'Open Peeps' },
  { id: 'personas', label: 'Personas' },
  { id: 'pixel-art', label: 'Pixel Art' },
  { id: 'pixel-art-neutral', label: 'Pixel Neutro' },
  { id: 'thumbs', label: 'Thumbs' },
] as const;

type StyleEntry = typeof DICEBEAR_STYLES[number];

function getDiceBearUrl(style: string, seed: string) {
  return `https://api.dicebear.com/9.x/${style}/svg?seed=${encodeURIComponent(seed)}`;
}

interface AvatarGalleryProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  playerName: string;
  onSelect: (url: string) => void;
}

export const AvatarGallery = ({ open, onOpenChange, playerName, onSelect }: AvatarGalleryProps) => {
  const [styleIndex, setStyleIndex] = useState(0);
  const [seeds, setSeeds] = useState(() => generateSeeds(playerName));
  const [selectedUrl, setSelectedUrl] = useState<string | null>(null);

  const style = DICEBEAR_STYLES[styleIndex];

  function generateSeeds(base: string) {
    return Array.from({ length: 12 }, (_, i) => `${base}-${i}-${Math.random().toString(36).slice(2, 6)}`);
  }

  const shuffleSeeds = () => {
    setSeeds(generateSeeds(playerName + Date.now()));
    setSelectedUrl(null);
  };

  const prevStyle = () => {
    setStyleIndex((i) => (i === 0 ? DICEBEAR_STYLES.length - 1 : i - 1));
    setSelectedUrl(null);
  };

  const nextStyle = () => {
    setStyleIndex((i) => (i === DICEBEAR_STYLES.length - 1 ? 0 : i + 1));
    setSelectedUrl(null);
  };

  const handleConfirm = () => {
    if (selectedUrl) {
      onSelect(selectedUrl);
      onOpenChange(false);
    }
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-[85dvh] sm:max-w-full p-0 overflow-hidden">
        <div className="flex flex-col h-full">
          <SheetHeader className="p-4 border-b">
            <SheetTitle>Escolher avatar</SheetTitle>
          </SheetHeader>

          {/* Style selector */}
          <div className="flex items-center justify-between px-4 py-3 border-b bg-muted/30">
            <Button variant="ghost" size="icon" onClick={prevStyle}>
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <span className="text-sm font-medium">{style.label}</span>
            <Button variant="ghost" size="icon" onClick={nextStyle}>
              <ChevronRight className="h-5 w-5" />
            </Button>
          </div>

          {/* Avatar grid */}
          <div className="flex-1 overflow-y-auto p-4">
            <div className="grid grid-cols-3 gap-3">
              {seeds.map((seed) => {
                const url = getDiceBearUrl(style.id, seed);
                const isSelected = selectedUrl === url;
                return (
                  <button
                    key={seed}
                    onClick={() => setSelectedUrl(url)}
                    className={`relative aspect-square rounded-2xl border-2 p-2 transition-all ${
                      isSelected
                        ? 'border-primary bg-primary/10 scale-95'
                        : 'border-border bg-card hover:border-primary/50'
                    }`}
                  >
                    <img
                      src={url}
                      alt={`Avatar ${seed}`}
                      className="w-full h-full rounded-xl"
                      loading="lazy"
                    />
                    {isSelected && (
                      <div className="absolute top-1 right-1 w-5 h-5 rounded-full bg-primary flex items-center justify-center">
                        <Check className="h-3 w-3 text-primary-foreground" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Actions */}
          <div className="p-4 border-t bg-background flex items-center gap-3">
            <Button variant="outline" size="icon" onClick={shuffleSeeds}>
              <Shuffle className="h-4 w-4" />
            </Button>
            <Button
              className="flex-1"
              disabled={!selectedUrl}
              onClick={handleConfirm}
            >
              <Check className="mr-2 h-4 w-4" />
              Usar este avatar
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};
