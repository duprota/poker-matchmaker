import React from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check, X } from "lucide-react";
import { formatDate } from "@/lib/utils";

interface PaymentDetailProps {
  gameName: string;
  gameDate: string;
  amount: number;
  paymentStatus: string;
  gamePlayerId: string;
  onStatusUpdate: (gamePlayerId: string, newStatus: string) => Promise<void>;
}

export const PaymentDetail = ({
  gameName,
  gameDate,
  amount,
  paymentStatus,
  gamePlayerId,
  onStatusUpdate,
}: PaymentDetailProps) => {
  return (
    <Card className="p-4 bg-muted/30">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <p className="text-sm text-muted-foreground">
            {gameName || 'Unnamed Game'} ({formatDate(gameDate)})
          </p>
          <p className="font-medium">${amount.toFixed(2)}</p>
        </div>
        <Button
          variant={paymentStatus === 'paid' ? "outline" : "default"}
          size="sm"
          onClick={() => onStatusUpdate(
            gamePlayerId,
            paymentStatus === 'pending' ? 'paid' : 'pending'
          )}
          className={`w-full sm:w-auto transition-all duration-200 ${
            paymentStatus === 'paid' 
              ? 'hover:bg-red-500/10 hover:text-red-500 hover:border-red-500' 
              : 'hover:bg-green-500/90'
          }`}
        >
          {paymentStatus === 'paid' ? (
            <>
              <X className="w-4 h-4 mr-2" />
              <span>Mark as Pending</span>
            </>
          ) : (
            <>
              <Check className="w-4 h-4 mr-2" />
              <span>Mark as Paid</span>
            </>
          )}
        </Button>
      </div>
    </Card>
  );
};