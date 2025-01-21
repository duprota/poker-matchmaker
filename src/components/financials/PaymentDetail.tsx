import React from 'react';
import { Card } from "@/components/ui/card";
import { formatDate } from "@/lib/utils";
import { PaymentStatusButton } from "./PaymentStatusButton";

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
        <PaymentStatusButton
          status={paymentStatus}
          gamePlayerId={gamePlayerId}
          onStatusUpdate={onStatusUpdate}
        />
      </div>
    </Card>
  );
};