
import { useState, useRef, useCallback } from 'react';
import ReactCrop, { type Crop } from 'react-image-crop';
import 'react-image-crop/dist/ReactCrop.css';
import { Camera, Upload, Scissors, Save, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface AvatarUploaderProps {
  playerId: string;
  currentAvatar?: string | null;
  onAvatarChange: (url: string) => Promise<void>;
}

export const AvatarUploader = ({ playerId, currentAvatar, onAvatarChange }: AvatarUploaderProps) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [sourceImg, setSourceImg] = useState<string | null>(null);
  const [crop, setCrop] = useState<Crop>({
    unit: '%',
    width: 90,
    height: 90,
    x: 5,
    y: 5,
  });
  const [isCropping, setIsCropping] = useState(false);
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
      });
      
      reader.readAsDataURL(file);
    }
  };
  
  const captureFromCamera = async () => {
    try {
      // Check if getUserMedia is supported
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        toast({
          title: "Erro",
          description: "Seu navegador não suporta acesso à câmera",
          variant: "destructive"
        });
        return;
      }
      
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
      
      // Create video and canvas elements
      const video = document.createElement('video');
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      
      // Set up video element
      video.srcObject = stream;
      video.play();
      
      // Wait for video to load metadata
      video.onloadedmetadata = () => {
        // Set canvas dimensions
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        
        // Draw video frame on canvas
        if (context) {
          context.drawImage(video, 0, 0, canvas.width, canvas.height);
        }
        
        // Get image data
        const imageDataUrl = canvas.toDataURL('image/jpeg');
        setSourceImg(imageDataUrl);
        
        // Stop all video streams
        stream.getTracks().forEach(track => track.stop());
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
    const scaleX = image.naturalWidth / image.width;
    const scaleY = image.naturalHeight / image.height;
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    
    // Calculate the center of the crop
    const cropX = crop.x * scaleX;
    const cropY = crop.y * scaleY;
    const cropWidth = crop.width * scaleX;
    const cropHeight = crop.height * scaleY;
    
    // Set canvas dimensions to match crop size (make it square)
    const size = Math.max(cropWidth, cropHeight);
    const pixelRatio = window.devicePixelRatio;
    canvas.width = size * pixelRatio;
    canvas.height = size * pixelRatio;
    
    // Apply device pixel ratio scaling
    ctx.scale(pixelRatio, pixelRatio);
    ctx.imageSmoothingQuality = 'high';
    
    // Fill with transparent background
    ctx.fillStyle = 'transparent';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Center the crop in the canvas (if needed)
    const offsetX = (size - cropWidth) / 2 / pixelRatio;
    const offsetY = (size - cropHeight) / 2 / pixelRatio;
    
    // Draw cropped image
    ctx.drawImage(
      image,
      cropX,
      cropY,
      cropWidth,
      cropHeight,
      offsetX,
      offsetY,
      crop.width,
      crop.height
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
        0.95 // JPEG quality
      );
    });
  }, [crop]);
  
  const uploadImage = async () => {
    try {
      if (!sourceImg) return;
      
      setIsUploading(true);
      
      // Get cropped image blob
      const croppedImgBlob = await getCroppedImg();
      if (!croppedImgBlob) {
        throw new Error('Failed to crop image');
      }
      
      // Create a file from the blob
      const fileName = `avatar-${playerId}-${Date.now()}.jpg`;
      const file = new File([croppedImgBlob], fileName, { type: 'image/jpeg' });
      
      // Upload to Supabase Storage
      const { data, error } = await supabase.storage
        .from('player-avatars')
        .upload(fileName, file);
      
      if (error) throw error;
      
      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('player-avatars')
        .getPublicUrl(fileName);
      
      // Update player's avatar_url
      await onAvatarChange(publicUrl);
      
      toast({
        title: "Sucesso",
        description: "Foto de perfil atualizada com sucesso"
      });
      
      // Close dialog and reset state
      setIsDialogOpen(false);
      setSourceImg(null);
      setIsCropping(false);
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
  
  const handleCancelCrop = () => {
    setIsCropping(false);
  };
  
  const handleStartCrop = () => {
    setIsCropping(true);
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
      
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Foto de perfil</DialogTitle>
          </DialogHeader>
          
          {!sourceImg && (
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
          )}
          
          {sourceImg && !isCropping && (
            <div className="flex flex-col gap-4">
              <div className="relative max-h-80 overflow-hidden">
                <img
                  src={sourceImg}
                  alt="Uploaded"
                  className="w-full h-auto"
                  ref={imgRef}
                />
              </div>
              
              <div className="flex justify-between">
                <Button
                  variant="outline"
                  onClick={() => { setSourceImg(null); }}
                >
                  <X className="mr-2 h-4 w-4" />
                  Cancelar
                </Button>
                <Button onClick={handleStartCrop}>
                  <Scissors className="mr-2 h-4 w-4" />
                  Cortar imagem
                </Button>
              </div>
            </div>
          )}
          
          {sourceImg && isCropping && (
            <div className="flex flex-col gap-4">
              <div className="max-h-80 overflow-auto">
                <ReactCrop
                  crop={crop}
                  onChange={(c) => setCrop(c)}
                  aspect={1}
                  circularCrop
                  className="mx-auto"
                >
                  <img
                    src={sourceImg}
                    alt="Crop"
                    ref={imgRef}
                    className="max-w-full max-h-[60vh]"
                    crossOrigin="anonymous"
                  />
                </ReactCrop>
              </div>
              
              <div className="flex justify-between">
                <Button
                  variant="outline"
                  onClick={handleCancelCrop}
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
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};
