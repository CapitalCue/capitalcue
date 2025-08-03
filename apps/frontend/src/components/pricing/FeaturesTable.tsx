import { Check, X } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { comparisonFeatures } from "@/lib/pricingData";

const FeaturesTable = () => {
  const renderFeatureValue = (value: string | boolean) => {
    if (typeof value === 'boolean') {
      return value ? (
        <Check className="w-5 h-5 text-success mx-auto" />
      ) : (
        <X className="w-5 h-5 text-muted-foreground mx-auto" />
      );
    }
    return <span className="text-center block">{value}</span>;
  };

  return (
    <Card className="mt-16">
      <CardHeader>
        <CardTitle className="text-center text-2xl">Feature Comparison</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[300px]">Features</TableHead>
                <TableHead className="text-center">Starter</TableHead>
                <TableHead className="text-center">Professional</TableHead>
                <TableHead className="text-center">Enterprise</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {comparisonFeatures.map((feature, index) => (
                <TableRow key={index}>
                  <TableCell className="font-medium">{feature.name}</TableCell>
                  <TableCell>{renderFeatureValue(feature.starter)}</TableCell>
                  <TableCell>{renderFeatureValue(feature.professional)}</TableCell>
                  <TableCell>{renderFeatureValue(feature.enterprise)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};

export default FeaturesTable;