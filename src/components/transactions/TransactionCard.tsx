import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import { ArrowLeftRight, QrCode } from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { format } from "date-fns";

interface TransactionCardProps {
  from: string;
  to: string;
  amount: number;
  date: string;
  paymentStatus: string;
  toPixKey?: string;
  gamePlayerIds: string[];
  onMarkAsPaid: (gamePlayerIds: string[]) => Promise<void>;
}

export const TransactionCard = ({
  from,
  to,
  amount,
  date,
  paymentStatus,
  toPixKey,
  gamePlayerIds,
  onMarkAsPaid,
}: TransactionCardProps) => {
  const isPaid = paymentStatus === 'paid';

  const handleCopyPix = () => {
    if (toPixKey) {
      navigator.clipboard.writeText(toPixKey);
      toast({
        title: "PIX key copied",
        description: "The PIX key has been copied to your clipboard.",
      });
    }
  };

  return (
    <Card className={`p-4 mb-4 animate-fade-in hover:scale-[1.01] transition-all backdrop-blur-sm ${
      isPaid ? 'bg-muted/50' : 'bg-card/80 border-primary/20'
    }`}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-medium text-foreground">{from}</span>
              <ArrowLeftRight className="w-4 h-4 text-muted-foreground" />
              <span className="font-medium text-foreground">{to}</span>
            </div>
            <p className="text-sm text-muted-foreground">
              {format(new Date(date), 'MMM d, yyyy')}
            </p>
            {toPixKey && (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div 
                      className="flex items-center gap-1 text-sm text-muted-foreground mt-1 cursor-pointer hover:text-primary transition-colors"
                      onClick={handleCopyPix}
                    >
                      <QrCode className="h-4 w-4" />
                      <span className="truncate max-w-[200px]">{toPixKey}</span>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Click to copy PIX key</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
          </div>
        </div>
        <div className="text-right">
          <p className="font-semibold text-foreground">
            ${amount.toFixed(2)}
          </p>
          <p className="text-sm text-muted-foreground capitalize">
            {paymentStatus}
          </p>
        </div>
      </div>
      
      {!isPaid && (
        <Button
          variant="outline"
          size="sm"
          onClick={() => onMarkAsPaid(gamePlayerIds)}
          className="w-full mt-2 bg-card/80 hover:bg-primary/20 hover:text-primary transition-colors border-primary/20"
        >
          Mark as Paid
        </Button>
      )}
    </Card>
  );
};