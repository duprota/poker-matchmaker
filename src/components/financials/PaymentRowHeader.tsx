import React from 'react';
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronUp, ArrowRight } from "lucide-react";

interface PaymentRowHeaderProps {
  fromPlayerName: string;
  toPlayerName: string;
  totalAmount: number;
  isExpanded: boolean;
  detailsCount: number;
  onToggle: () => void;
}

export const PaymentRowHeader = ({
  fromPlayerName,
  toPlayerName,
  totalAmount,
  isExpanded,
  detailsCount,
  onToggle,
}: PaymentRowHeaderProps) => {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div className="flex items-center gap-2">
        <span className="font-medium">{fromPlayerName}</span>
        <ArrowRight className="w-4 h-4 text-muted-foreground" />
        <span className="font-medium">{toPlayerName}</span>
        <span className="font-semibold text-lg ml-2">${totalAmount.toFixed(2)}</span>
      </div>
      <Button
        variant="ghost"
        size="sm"
        onClick={onToggle}
        className="w-full sm:w-auto"
      >
        {isExpanded ? (
          <ChevronUp className="h-4 w-4 mr-2" />
        ) : (
          <ChevronDown className="h-4 w-4 mr-2" />
        )}
        {detailsCount} transaction{detailsCount !== 1 ? 's' : ''}
      </Button>
    </div>
  );
};