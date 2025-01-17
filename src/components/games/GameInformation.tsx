import { Alert, AlertDescription } from "@/components/ui/alert";

interface GameInformationProps {
  date: string;
  status: string;
  hasBalanceError: boolean;
}

export const GameInformation = ({ date, status, hasBalanceError }: GameInformationProps) => {
  return (
    <>
      <div className="mb-4">
        <h2 className="text-xl font-semibold mb-2">Game Information</h2>
        <p>Date: {new Date(date).toLocaleDateString()}</p>
        <p>Status: {status}</p>
      </div>

      {hasBalanceError && status === 'completed' && (
        <Alert variant="destructive" className="mb-4">
          <AlertDescription>
            Warning: The sum of final results does not match the total buy-ins and rebuys. 
            Please update the results to ensure they balance.
          </AlertDescription>
        </Alert>
      )}
    </>
  );
};