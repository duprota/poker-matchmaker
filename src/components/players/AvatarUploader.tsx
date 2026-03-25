import { useState, useRef, useCallback, useEffect } from 'react';
import Cropper, { Area } from 'react-easy-crop';
import { Camera, Upload, Save, X, SwitchCamera, User } from 'lucide-react';
import BoringAvatar from 'boring-avatars';
import { AvatarGallery } from './AvatarGallery';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Slider } from '@/components/ui/slider';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';

interface AvatarUploaderProps {
  playerId: string;
  playerName?: string;
  currentAvatar?: string | null;
  onAvatarChange: (url: string) => Promise<void>;
  size?: 'sm' | 'lg';
}

async function getCroppedImg(imageSrc: string, pixelCrop: Area): Promise<Blob> {
  const image = await createImage(imageSrc);
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d')!;

  canvas.width = pixelCrop.width;
  canvas.height = pixelCrop.height;

  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = 'high';

  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    pixelCrop.width,
    pixelCrop.height,
  );

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error('Canvas is empty'))),
      'image/jpeg',
      0.92,
    );
  });
}

function createImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.addEventListener('load', () => resolve(img));
    img.addEventListener('error', (e) => reject(e));
    img.crossOrigin = 'anonymous';
    img.src = url;
  });
}

export const AvatarUploader = ({ playerId, currentAvatar, onAvatarChange, size = 'sm' }: AvatarUploaderProps) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isCropperOpen, setIsCropperOpen] = useState(false);
  const [isGalleryOpen, setIsGalleryOpen] = useState(false);
  const [sourceImg, setSourceImg] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const { toast } = useToast();

  const onCropComplete = useCallback((_: Area, croppedPixels: Area) => {
    setCroppedAreaPixels(croppedPixels);
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.addEventListener('load', () => {
        setSourceImg(reader.result as string);
        setIsDialogOpen(false);
        setIsCropperOpen(true);
        setZoom(1);
        setCrop({ x: 0, y: 0 });
      });
      reader.readAsDataURL(file);
    }
  };

  // Start camera stream
  const startCamera = useCallback(async (facing: 'user' | 'environment') => {
    try {
      // Stop any existing stream
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }

      if (!navigator.mediaDevices?.getUserMedia) {
        toast({ title: 'Erro', description: 'Seu navegador não suporta acesso à câmera', variant: 'destructive' });
        return;
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: facing, width: { ideal: 1280 }, height: { ideal: 1280 } },
      });
      streamRef.current = stream;

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
    } catch (error) {
      console.error('Error accessing camera:', error);
      toast({ title: 'Erro', description: 'Não foi possível acessar a câmera', variant: 'destructive' });
      setIsCameraOpen(false);
    }
  }, [toast]);

  const openCamera = () => {
    setIsDialogOpen(false);
    setIsCameraOpen(true);
  };

  // Start stream when camera sheet opens
  useEffect(() => {
    if (isCameraOpen) {
      startCamera(facingMode);
    }
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isCameraOpen, facingMode]);

  const captureFrame = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d')!;
    ctx.drawImage(video, 0, 0);
    const dataUrl = canvas.toDataURL('image/jpeg');

    // Stop stream
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }

    setSourceImg(dataUrl);
    setIsCameraOpen(false);
    setIsCropperOpen(true);
    setZoom(1);
    setCrop({ x: 0, y: 0 });
  };

  const toggleCamera = () => {
    setFacingMode((prev) => (prev === 'user' ? 'environment' : 'user'));
  };

  const uploadImage = async () => {
    try {
      if (!sourceImg || !croppedAreaPixels) return;
      setIsUploading(true);

      const croppedBlob = await getCroppedImg(sourceImg, croppedAreaPixels);
      const fileName = `avatar-${playerId}-${Date.now()}.jpg`;
      const file = new File([croppedBlob], fileName, { type: 'image/jpeg' });

      const { error } = await supabase.storage.from('player-avatars').upload(fileName, file);
      if (error) throw error;

      const { data: { publicUrl } } = supabase.storage.from('player-avatars').getPublicUrl(fileName);
      await onAvatarChange(publicUrl);

      toast({ title: 'Sucesso', description: 'Foto de perfil atualizada com sucesso' });
      setIsCropperOpen(false);
      setSourceImg(null);
    } catch (error) {
      console.error('Error uploading image:', error);
      toast({ title: 'Erro', description: 'Não foi possível fazer upload da imagem', variant: 'destructive' });
    } finally {
      setIsUploading(false);
    }
  };

  const sizeClasses = size === 'lg' ? 'w-24 h-24' : 'w-10 h-10';
  const textSize = size === 'lg' ? 'text-3xl' : 'text-sm';

  return (
    <>
      <div
        className={`${sizeClasses} rounded-full overflow-hidden bg-muted flex items-center justify-center cursor-pointer border-2 border-primary/30 hover:border-primary transition-colors relative flex-shrink-0`}
        onClick={() => setIsDialogOpen(true)}
      >
        {currentAvatar ? (
          <img src={currentAvatar} alt="Avatar" className="w-full h-full object-cover" />
        ) : (
          <div className={`${textSize} font-bold text-muted-foreground`}>?</div>
        )}
      </div>

      {/* Dialog de escolha */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Foto de perfil</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col gap-4">
            <Button
              onClick={() => fileInputRef.current?.click()}
              className="w-full py-8 flex flex-col items-center justify-center h-auto gap-2"
            >
              <Upload className="h-8 w-8" />
              <span>Fazer upload de uma imagem</span>
            </Button>
            <Button
              onClick={openCamera}
              variant="outline"
              className="w-full py-8 flex flex-col items-center justify-center h-auto gap-2"
            >
              <Camera className="h-8 w-8" />
              <span>Tirar uma foto</span>
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
            />
          </div>
        </DialogContent>
      </Dialog>

      {/* Viewfinder ao vivo */}
      <Sheet open={isCameraOpen} onOpenChange={(open) => { if (!open) setIsCameraOpen(false); }}>
        <SheetContent side="bottom" className="h-[100dvh] sm:max-w-full p-0 overflow-hidden">
          <div className="flex flex-col h-full bg-black">
            <SheetHeader className="p-4 border-b border-white/10">
              <SheetTitle className="text-white">Tirar foto</SheetTitle>
            </SheetHeader>

            <div className="flex-1 relative flex items-center justify-center overflow-hidden">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
                style={{ transform: facingMode === 'user' ? 'scaleX(-1)' : undefined }}
              />
              {/* Circular overlay guide */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-64 h-64 rounded-full border-2 border-white/50" />
              </div>
            </div>

            <div className="p-6 flex items-center justify-center gap-8 bg-black">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsCameraOpen(false)}
                className="text-white hover:bg-white/10"
              >
                <X className="h-6 w-6" />
              </Button>

              <button
                onClick={captureFrame}
                className="w-16 h-16 rounded-full border-4 border-white bg-white/20 hover:bg-white/40 transition-colors active:scale-95"
                aria-label="Capturar foto"
              />

              <Button
                variant="ghost"
                size="icon"
                onClick={toggleCamera}
                className="text-white hover:bg-white/10"
              >
                <SwitchCamera className="h-6 w-6" />
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* Cropper com react-easy-crop */}
      <Sheet open={isCropperOpen} onOpenChange={setIsCropperOpen}>
        <SheetContent side="bottom" className="h-[95dvh] sm:max-w-full p-0 overflow-hidden">
          <div className="flex flex-col h-full">
            <SheetHeader className="p-4 border-b">
              <SheetTitle>Ajustar foto</SheetTitle>
            </SheetHeader>

            {sourceImg && (
              <>
                <div className="flex-1 relative bg-black">
                  <Cropper
                    image={sourceImg}
                    crop={crop}
                    zoom={zoom}
                    aspect={1}
                    cropShape="round"
                    showGrid={false}
                    onCropChange={setCrop}
                    onZoomChange={setZoom}
                    onCropComplete={onCropComplete}
                  />
                </div>

                <div className="px-6 py-3 bg-background border-t flex items-center gap-3">
                  <span className="text-xs text-muted-foreground whitespace-nowrap">Zoom</span>
                  <Slider
                    value={[zoom]}
                    min={1}
                    max={3}
                    step={0.05}
                    onValueChange={(v) => setZoom(v[0])}
                    className="flex-1"
                  />
                </div>

                <div className="p-4 bg-background border-t flex justify-between items-center">
                  <Button
                    variant="outline"
                    onClick={() => { setIsCropperOpen(false); setSourceImg(null); }}
                  >
                    <X className="mr-2 h-4 w-4" />
                    Cancelar
                  </Button>
                  <Button onClick={uploadImage} disabled={isUploading}>
                    {isUploading ? 'Salvando...' : (
                      <>
                        <Save className="mr-2 h-4 w-4" />
                        Salvar
                      </>
                    )}
                  </Button>
                </div>
              </>
            )}
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
};
