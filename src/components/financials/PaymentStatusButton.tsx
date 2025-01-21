import React from 'react';
import { Button } from "@/components/ui/button";
import { Check, X } from "lucide-react";

interface PaymentStatusButtonProps {
  status: string;
  gamePlayerId: string;
  onStatusUpdate: (gamePlayerId: string, newStatus: string) => Promise<void>;
}

export const PaymentStatusButton = ({
  status,
  gamePlayerId,
  onStatusUpdate,
}: PaymentStatusButtonProps) => {
  return (
    <Button
      variant={status === 'paid' ? "outline" : "default"}
      size="sm"
      onClick={() => onStatusUpdate(
        gamePlayerId,
        status === 'pending' ? 'paid' : 'pending'
      )}
      className={`w-full sm:w-auto transition-all duration-200 ${
        status === 'paid' 
          ? 'hover:bg-red-500/10 hover:text-red-500 hover:border-red-500' 
          : 'hover:bg-green-500/90'
      }`}
    >
      {status === 'paid' ? (
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
  );
};