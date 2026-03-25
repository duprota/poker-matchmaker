import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { ChevronLeft, ChevronRight, Check, Shuffle } from 'lucide-react';

const TWEMOJI_BASE = 'https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/svg';

const ANIMAL_EMOJIS = [
  { code: '1f42e', label: 'Vaca' },
  { code: '1f431', label: 'Gato' },
  { code: '1f436', label: 'Cachorro' },
  { code: '1f981', label: 'Leão' },
  { code: '1f42f', label: 'Tigre' },
  { code: '1f43b', label: 'Urso' },
  { code: '1f98a', label: 'Raposa' },
  { code: '1f43a', label: 'Lobo' },
  { code: '1f985', label: 'Águia' },
  { code: '1f989', label: 'Coruja' },
  { code: '1f43c', label: 'Panda' },
  { code: '1f435', label: 'Macaco' },
  { code: '1f430', label: 'Coelho' },
  { code: '1f418', label: 'Elefante' },
  { code: '1f992', label: 'Girafa' },
  { code: '1f988', label: 'Tubarão' },
  { code: '1f40b', label: 'Baleia' },
  { code: '1f40d', label: 'Cobra' },
  { code: '1f40a', label: 'Jacaré' },
  { code: '1f422', label: 'Tartaruga' },
  { code: '1f427', label: 'Pinguim' },
  { code: '1f9a9', label: 'Flamingo' },
  { code: '1f99c', label: 'Papagaio' },
  { code: '1f434', label: 'Cavalo' },
  { code: '1f43e', label: 'Capivara' },
  { code: '1f994', label: 'Ouriço' },
  { code: '1f98e', label: 'Lagarto' },
  { code: '1f409', label: 'Dragão' },
];

const DICEBEAR_STYLES = [
  { id: '_animals', label: '🐾 Animais', isAnimalGrid: true },
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
  const hasFixedSeeds = 'fixedSeeds' in style && style.fixedSeeds;
  const displaySeeds = hasFixedSeeds ? style.fixedSeeds as readonly string[] : seeds;

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
            <div className={`grid ${hasFixedSeeds ? 'grid-cols-4' : 'grid-cols-3'} gap-3`}>
              {displaySeeds.map((seed) => {
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
                    {hasFixedSeeds && (
                      <span className="text-[10px] text-muted-foreground truncate block mt-[-4px]">{seed}</span>
                    )}
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
            {!hasFixedSeeds && (
              <Button variant="outline" size="icon" onClick={shuffleSeeds}>
                <Shuffle className="h-4 w-4" />
              </Button>
            )}
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
