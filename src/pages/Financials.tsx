import { Navigation } from "@/components/Navigation";
import { Card } from "@/components/ui/card";

const Financials = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background/90 to-muted">
      <Navigation />
      <div className="container mx-auto py-8 px-4">
        <h1 className="text-2xl font-bold mb-6">
          Transactions
        </h1>
        <Card className="p-6 text-center">
          <p className="text-muted-foreground">
            The transactions feature is currently being rebuilt to provide a better experience.
          </p>
        </Card>
      </div>
    </div>
  );
};

export default Financials;