
import { useState, useRef, useCallback } from 'react';
import ReactCrop, { type Crop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import { Camera, Upload, Save, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';

interface AvatarUploaderProps {
  playerId: string;
  currentAvatar?: string | null;
  onAvatarChange: (url: string) => Promise<void>;
}

export const AvatarUploader = ({ playerId, currentAvatar, onAvatarChange }: AvatarUploaderProps) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isCropperOpen, setIsCropperOpen] = useState(false);
  const [sourceImg, setSourceImg] = useState<string | null>(null);
  const [crop, setCrop] = useState<Crop>({
    unit: '%',
    width: 90,
    height: 90,
    x: 5,
    y: 5,
  });
  const [isUploading, setIsUploading] = useState(false);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      const reader = new FileReader();
      
      reader.addEventListener('load', () => {
        setSourceImg(reader.result as string);
        setIsDialogOpen(false);
        setIsCropperOpen(true);
      });
      
      reader.readAsDataURL(file);
    }
  };
  
  const captureFromCamera = async () => {
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        toast({
          title: "Erro",
          description: "Seu navegador não suporta acesso à câmera",
          variant: "destructive"
        });
        return;
      }
      
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
      
      const video = document.createElement('video');
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      
      video.srcObject = stream;
      video.play();
      
      video.onloadedmetadata = () => {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        
        if (context) {
          context.drawImage(video, 0, 0, canvas.width, canvas.height);
        }
        
        const imageDataUrl = canvas.toDataURL('image/jpeg');
        setSourceImg(imageDataUrl);
        
        stream.getTracks().forEach(track => track.stop());
        
        setIsDialogOpen(false);
        setIsCropperOpen(true);
      };
    } catch (error) {
      console.error('Error accessing camera:', error);
      toast({
        title: "Erro",
        description: "Não foi possível acessar a câmera",
        variant: "destructive"
      });
    }
  };
  
  const getCroppedImg = useCallback(async () => {
    if (!imgRef.current) return null;
    
    const image = imgRef.current;
    const canvas = document.createElement('canvas');
    
    // Get image dimensions
    const { naturalWidth, naturalHeight } = image;
    
    // Calculate crop dimensions in pixels based on percentages
    const cropWidthPx = (crop.width * naturalWidth) / 100;
    const cropHeightPx = (crop.height * naturalHeight) / 100;
    const cropXPx = (crop.x * naturalWidth) / 100;
    const cropYPx = (crop.y * naturalHeight) / 100;
    
    // Set canvas size to be square (using the maximum dimension)
    const size = Math.max(cropWidthPx, cropHeightPx);
    canvas.width = size;
    canvas.height = size;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    
    // Fill the canvas with a transparent background
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Enable high quality image rendering
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    
    // Calculate offsets to center the cropped portion
    const offsetX = (size - cropWidthPx) / 2;
    const offsetY = (size - cropHeightPx) / 2;
    
    // Draw the cropped portion of the image onto the canvas
    ctx.drawImage(
      image,
      cropXPx,
      cropYPx,
      cropWidthPx,
      cropHeightPx,
      offsetX,
      offsetY,
      cropWidthPx,
      cropHeightPx
    );
    
    // Convert canvas to blob
    return new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error('Canvas is empty'));
            return;
          }
          resolve(blob);
        },
        'image/jpeg',
        0.95 // High quality
      );
    });
  }, [crop]);
  
  const uploadImage = async () => {
    try {
      if (!sourceImg) return;
      
      setIsUploading(true);
      
      const croppedImgBlob = await getCroppedImg();
      if (!croppedImgBlob) {
        throw new Error('Failed to crop image');
      }
      
      const fileName = `avatar-${playerId}-${Date.now()}.jpg`;
      const file = new File([croppedImgBlob], fileName, { type: 'image/jpeg' });
      
      const { data, error } = await supabase.storage
        .from('player-avatars')
        .upload(fileName, file);
      
      if (error) throw error;
      
      const { data: { publicUrl } } = supabase.storage
        .from('player-avatars')
        .getPublicUrl(fileName);
      
      await onAvatarChange(publicUrl);
      
      toast({
        title: "Sucesso",
        description: "Foto de perfil atualizada com sucesso"
      });
      
      setIsCropperOpen(false);
      setSourceImg(null);
    } catch (error) {
      console.error('Error uploading image:', error);
      toast({
        title: "Erro",
        description: "Não foi possível fazer upload da imagem",
        variant: "destructive"
      });
    } finally {
      setIsUploading(false);
    }
  };
  
  return (
    <>
      <div className="flex items-center gap-4">
        <div 
          className="w-16 h-16 rounded-full overflow-hidden bg-muted flex items-center justify-center cursor-pointer border-2 border-primary relative"
          onClick={() => setIsDialogOpen(true)}
        >
          {currentAvatar ? (
            <img
              src={currentAvatar}
              alt="Avatar"
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="text-2xl font-bold text-muted-foreground">
              ?
            </div>
          )}
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsDialogOpen(true)}
        >
          <Camera className="mr-2 h-4 w-4" />
          Alterar foto
        </Button>
      </div>
      
      {/* Dialog para escolher método de upload */}
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
              onClick={captureFromCamera}
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
      
      {/* Tela de corte de imagem em tela cheia */}
      <Sheet open={isCropperOpen} onOpenChange={setIsCropperOpen}>
        <SheetContent side="bottom" className="h-[95vh] sm:max-w-full p-0 overflow-hidden">
          <div className="flex flex-col h-full">
            <SheetHeader className="p-4 border-b">
              <SheetTitle>Ajustar foto de perfil</SheetTitle>
            </SheetHeader>
            
            {sourceImg && (
              <>
                <div className="flex-1 overflow-auto flex items-center justify-center bg-black/60 p-2">
                  <ReactCrop
                    crop={crop}
                    onChange={(newCrop) => setCrop(newCrop)}
                    aspect={1}
                    circularCrop
                    className="max-h-full flex items-center justify-center"
                  >
                    <img
                      src={sourceImg}
                      alt="Crop"
                      ref={imgRef}
                      className="max-w-full max-h-[80vh] w-auto h-auto object-contain"
                      style={{ display: 'block' }}
                      crossOrigin="anonymous"
                    />
                  </ReactCrop>
                </div>
                
                <div className="p-4 bg-background border-t flex justify-between items-center">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setIsCropperOpen(false);
                      setSourceImg(null);
                    }}
                  >
                    <X className="mr-2 h-4 w-4" />
                    Cancelar
                  </Button>
                  <Button 
                    onClick={uploadImage} 
                    disabled={isUploading}
                  >
                    {isUploading ? (
                      <span>Salvando...</span>
                    ) : (
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
